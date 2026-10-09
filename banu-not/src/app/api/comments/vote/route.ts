import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Yorumu değerlendirmek için giriş yapmalısınız.', 401);
    const body = await request.json() as { commentId?: unknown; vote?: unknown };
    if (typeof body.commentId !== 'string' || (body.vote !== 1 && body.vote !== -1)) return errorResponse('Oy bilgisi geçersiz.');
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const comment = db.prepare('SELECT id FROM comments WHERE id = ? AND is_hidden = 0').get(body.commentId);
    if (!comment) return errorResponse('Yorum bulunamadı.', 404);

    const existing = db.prepare('SELECT vote FROM comment_votes WHERE user_id = ? AND comment_id = ?')
      .get(userId, body.commentId) as { vote: number } | undefined;
    if (existing?.vote === body.vote) {
      db.prepare('DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?').run(userId, body.commentId);
    } else {
      db.prepare(`
        INSERT INTO comment_votes (user_id, comment_id, vote) VALUES (?, ?, ?)
        ON CONFLICT(user_id, comment_id) DO UPDATE SET vote = excluded.vote, created_at = datetime('now')
      `).run(userId, body.commentId, body.vote);
    }

    const counts = db.prepare(`
      SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) as helpful_count,
             SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) as unhelpful_count
      FROM comment_votes WHERE comment_id = ?
    `).get(body.commentId) as { helpful_count: number | null; unhelpful_count: number | null };
    const userVote = db.prepare('SELECT vote FROM comment_votes WHERE user_id = ? AND comment_id = ?')
      .get(userId, body.commentId) as { vote: number } | undefined;
    return successResponse({
      helpfulCount: counts.helpful_count || 0,
      unhelpfulCount: counts.unhelpful_count || 0,
      userVote: userVote?.vote || 0,
    });
  } catch (error) {
    console.error('Comment vote error:', error);
    return errorResponse('Yorum oyu kaydedilemedi.', 500);
  }
}
