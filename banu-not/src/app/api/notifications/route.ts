import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(userId);

    const unreadMessagesCount = db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE conversation_id IN (
        SELECT id FROM conversations WHERE user1_id = ? OR user2_id = ?
      ) AND sender_id != ? AND is_read = 0
    `).get(userId, userId, userId) as any;

    return successResponse({
      items: notifications,
      unreadMessagesCount: unreadMessagesCount?.count || 0
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return errorResponse('Bildirimler yüklenirken hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { id } = await request.json();

    if (id) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    }

    return successResponse({ message: 'Bildirimler güncellendi.' });
  } catch (error) {
    console.error('Notifications update error:', error);
    return errorResponse('İşlem sırasında hata oluştu.', 500);
  }
}
