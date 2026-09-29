import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { noteId } = await request.json();

    if (!noteId) return errorResponse('Not ID gerekli.');

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?').get(userId, noteId);
    
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND note_id = ?').run(userId, noteId);
      return successResponse({ bookmarked: false, message: 'Kaydedilenlerden çıkarıldı.' });
    } else {
      db.prepare('INSERT INTO bookmarks (id, user_id, note_id) VALUES (?, ?, ?)').run(uuid(), userId, noteId);
      return successResponse({ bookmarked: true, message: 'Kaydedildi.' });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return errorResponse('İşlem sırasında bir hata oluştu.', 500);
  }
}
