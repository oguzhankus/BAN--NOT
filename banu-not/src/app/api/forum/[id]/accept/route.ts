import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuid } from 'uuid';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string; role?: string };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Çözüm seçmek için giriş yapmalısınız.', 401);
    const { id: postId } = await params;
    const body = await request.json() as { replyId?: unknown };
    if (typeof body.replyId !== 'string') return errorResponse('Cevap seçimi geçersiz.');
    const db = await ensureDb();
    const user = session.user as SessionUser;
    const post = db.prepare('SELECT id, user_id FROM forum_posts WHERE id = ?').get(postId) as { id: string; user_id: string } | undefined;
    if (!post) return errorResponse('Soru bulunamadı.', 404);
    if (post.user_id !== user.id && user.role !== 'admin' && user.role !== 'moderator') {
      return errorResponse('Çözüm olarak yalnızca soruyu soran kişi seçebilir.', 403);
    }
    const reply = db.prepare('SELECT id, user_id FROM forum_replies WHERE id = ? AND post_id = ?').get(body.replyId, postId) as { id: string; user_id: string } | undefined;
    if (!reply) return errorResponse('Cevap bulunamadı.', 404);

    const update = db.transaction(() => {
      db.prepare('UPDATE forum_replies SET is_accepted = 0 WHERE post_id = ?').run(postId);
      db.prepare('UPDATE forum_replies SET is_accepted = 1 WHERE id = ? AND post_id = ?').run(reply.id, postId);
      db.prepare("UPDATE forum_posts SET is_resolved = 1, updated_at = datetime('now') WHERE id = ?").run(postId);
    });
    update();

    if (reply.user_id !== user.id) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'forum_solution', 'Cevabınız çözüm seçildi', 'Forum cevabınız en iyi çözüm olarak işaretlendi.', ?)
      `).run(uuid(), reply.user_id, `/soru-cevap/${postId}`);
    }
    return successResponse({ acceptedReplyId: reply.id });
  } catch (error) {
    console.error('Forum accept reply error:', error);
    return errorResponse('Çözüm seçilemedi.', 500);
  }
}
