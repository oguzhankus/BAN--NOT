import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };
const preferenceKeys = ['comments', 'messages', 'forum_replies', 'note_updates', 'followed_users'] as const;
type PreferenceKey = typeof preferenceKeys[number];
type Preferences = Record<PreferenceKey, number>;

function loadPreferences(db: Awaited<ReturnType<typeof ensureDb>>, userId: string) {
  db.prepare('INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)').run(userId);
  return db.prepare(`
    SELECT comments, messages, forum_replies, note_updates, followed_users
    FROM notification_preferences WHERE user_id = ?
  `).get(userId) as Preferences;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);
    const db = await ensureDb();
    return successResponse(loadPreferences(db, (session.user as SessionUser).id));
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return errorResponse('Bildirim tercihleri alınamadı.', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);
    const body = await request.json() as Partial<Record<PreferenceKey, unknown>>;
    if (preferenceKeys.some(key => typeof body[key] !== 'boolean')) return errorResponse('Tüm bildirim tercihleri true/false olmalıdır.');
    const values = preferenceKeys.map(key => body[key] ? 1 : 0);
    const db = await ensureDb();
    db.prepare(`
      INSERT INTO notification_preferences (user_id, comments, messages, forum_replies, note_updates, followed_users, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        comments = excluded.comments, messages = excluded.messages,
        forum_replies = excluded.forum_replies, note_updates = excluded.note_updates,
        followed_users = excluded.followed_users, updated_at = datetime('now')
    `).run((session.user as SessionUser).id, ...values);
    return successResponse(loadPreferences(db, (session.user as SessionUser).id));
  } catch (error) {
    console.error('Notification preferences PUT error:', error);
    return errorResponse('Bildirim tercihleri kaydedilemedi.', 500);
  }
}
