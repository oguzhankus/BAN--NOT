import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { id: targetUserId } = await params;

    if (userId === targetUserId) {
      return errorResponse('Kendinizi takip edemezsiniz.', 400);
    }

    const targetUser = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(targetUserId);
    if (!targetUser) return errorResponse('Kullanıcı bulunamadı.', 404);

    db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(userId, targetUserId);

    // Get notification preference of target user
    const prefs = db.prepare('SELECT followed_users FROM notification_preferences WHERE user_id = ?').get(targetUserId) as any;
    if (!prefs || prefs.followed_users) {
      // Create notification
      const follower = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId) as any;
      db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuid(), targetUserId, 'new_follower', 'Yeni Takipçi',
        `${follower?.display_name || 'Birisi'} seni takip etmeye başladı.`,
        `/kullanici/${userId}`
      );
      // NOTE: Web Push can be triggered here if available.
    }

    return successResponse({ message: 'Kullanıcı takip edildi.' });
  } catch (error) {
    console.error('Follow error:', error);
    return errorResponse('Kullanıcı takip edilirken bir hata oluştu.', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { id: targetUserId } = await params;

    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(userId, targetUserId);

    return successResponse({ message: 'Takipten çıkıldı.' });
  } catch (error) {
    console.error('Unfollow error:', error);
    return errorResponse('Takipten çıkılırken bir hata oluştu.', 500);
  }
}
