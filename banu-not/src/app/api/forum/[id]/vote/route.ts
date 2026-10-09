import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };
type TargetRow = { user_id: string; upvotes: number; downvotes: number };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Oy vermek için giriş yapmalısınız.', 401);
    const { id: postId } = await params;
    const body = await request.json() as { targetType?: unknown; targetId?: unknown; vote?: unknown };
    if (body.targetType !== 'post' && body.targetType !== 'reply') return errorResponse('Oylanacak içerik türü geçersiz.');
    if (typeof body.targetId !== 'string' || !Number.isInteger(body.vote) || (body.vote !== 1 && body.vote !== -1)) return errorResponse('Oy bilgisi geçersiz.');
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const table = body.targetType === 'post' ? 'forum_posts' : 'forum_replies';
    const target = body.targetType === 'post'
      ? db.prepare('SELECT user_id, upvotes, downvotes FROM forum_posts WHERE id = ?').get(body.targetId)
      : db.prepare('SELECT user_id, upvotes, downvotes FROM forum_replies WHERE id = ? AND post_id = ?').get(body.targetId, postId);
    if (!target) return errorResponse('Oylanacak içerik bulunamadı.', 404);
    const current = target as TargetRow;
    if (current.user_id === userId) return errorResponse('Kendi içeriğinize oy veremezsiniz.', 403);
    const previous = db.prepare(`
      SELECT vote_type FROM forum_votes WHERE user_id = ? AND target_type = ? AND target_id = ?
    `).get(userId, body.targetType, body.targetId) as { vote_type: number } | undefined;
    const vote = previous?.vote_type === body.vote ? null : Number(body.vote);
    const transaction = db.transaction(() => {
      if (vote === null) {
        db.prepare('DELETE FROM forum_votes WHERE user_id = ? AND target_type = ? AND target_id = ?')
          .run(userId, body.targetType, body.targetId);
      } else {
        db.prepare(`
          INSERT INTO forum_votes (id, user_id, target_type, target_id, vote_type)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id, target_type, target_id) DO UPDATE SET vote_type = excluded.vote_type, created_at = datetime('now')
        `).run(`${userId}:${body.targetType}:${body.targetId}`, userId, body.targetType, body.targetId, vote);
      }
      const counts = db.prepare(`
        SELECT SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
               SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) AS downvotes
        FROM forum_votes WHERE target_type = ? AND target_id = ?
      `).get(body.targetType, body.targetId) as { upvotes: number | null; downvotes: number | null };
      db.prepare(`UPDATE ${table} SET upvotes = ?, downvotes = ? WHERE id = ?`)
        .run(counts.upvotes || 0, counts.downvotes || 0, body.targetId);
      return { upvotes: counts.upvotes || 0, downvotes: counts.downvotes || 0, userVote: vote };
    });
    return successResponse(transaction());
  } catch (error) {
    console.error('Forum vote error:', error);
    return errorResponse('Oy kaydedilemedi.', 500);
  }
}
