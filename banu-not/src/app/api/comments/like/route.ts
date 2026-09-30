import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Beğenmek için giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { commentId } = await request.json();

    if (!commentId) return errorResponse('Yorum ID gerekli.');

    const existing = db.prepare('SELECT id FROM comment_likes WHERE user_id = ? AND comment_id = ?').get(userId, commentId);
    
    if (existing) {
      db.prepare('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?').run(userId, commentId);
      return successResponse({ liked: false, message: 'Beğeni geri alındı.' });
    } else {
      db.prepare('INSERT INTO comment_likes (id, user_id, comment_id) VALUES (?, ?, ?)').run(uuid(), userId, commentId);
      return successResponse({ liked: true, message: 'Yorum beğenildi.' });
    }
  } catch (error) {
    console.error('Comment like error:', error);
    return errorResponse('İşlem sırasında bir hata oluştu.', 500);
  }
}
