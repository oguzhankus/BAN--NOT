import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { sendPushNotification } from '@/lib/push-notifications';

type SessionUser = { id: string };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız', 401);

    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const { id: postId } = await params;
    const { content } = await request.json();

    if (!content || content.trim().length < 5) {
      return errorResponse('Cevabınız en az 5 karakter olmalıdır');
    }

    const post = db.prepare('SELECT id, user_id FROM forum_posts WHERE id = ?').get(postId) as
      | { id: string; user_id: string }
      | undefined;
    if (!post) return errorResponse('Soru bulunamadı', 404);

    const replyId = uuid();
    db.prepare(`
      INSERT INTO forum_replies (id, post_id, user_id, content)
      VALUES (?, ?, ?, ?)
    `).run(replyId, postId, userId, content.trim());

    // Automatically send a notification if answering someone else's question
    if (post.user_id !== userId) {
      const notifId = uuid();
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'forum_reply', 'Sorunuza yeni bir cevap geldi!', ?, ?)
      `).run(
        notifId,
        post.user_id,
        `${session.user?.name || 'Bir kullanıcı'} sorunuza cevap yazdı.`,
        `/soru-cevap/${postId}`
      );
      await sendPushNotification(db, post.user_id, {
        title: 'Sorunuza yeni bir cevap geldi!',
        body: `${session.user?.name || 'Bir kullanıcı'} sorunuza cevap yazdı.`,
        url: `/soru-cevap/${postId}`,
      });
    }

    return successResponse({ id: replyId, message: 'Cevabınız başarıyla paylaşıldı.' }, 201);
  } catch (error) {
    console.error('Forum reply post error:', error);
    return errorResponse('Cevap paylaşılırken hata oluştu', 500);
  }
}
