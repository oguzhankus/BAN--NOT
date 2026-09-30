import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Lütfen giriş yapın', 401);
    }
    const userId = (session.user as any).id;
    const db = await ensureDb();
    const noteId = params.id;

    // Check if exists
    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?').get(userId, noteId);
    
    if (existing) {
      // Remove bookmark
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND note_id = ?').run(userId, noteId);
      return successResponse({ bookmarked: false });
    } else {
      // Add bookmark
      db.prepare('INSERT INTO bookmarks (id, user_id, note_id) VALUES (?, ?, ?)').run(uuidv4(), userId, noteId);
      return successResponse({ bookmarked: true });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return errorResponse('Bir hata oluştu', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return successResponse({ bookmarked: false });
    }
    const userId = (session.user as any).id;
    const db = await ensureDb();
    const noteId = params.id;

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?').get(userId, noteId);
    return successResponse({ bookmarked: !!existing });
  } catch (error) {
    return errorResponse('Hata', 500);
  }
}
