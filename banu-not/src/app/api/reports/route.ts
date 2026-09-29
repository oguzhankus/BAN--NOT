import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Bildirmek için giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { noteId, reason, details } = await request.json();

    if (!noteId) return errorResponse('Not ID gerekli.');
    if (!reason) return errorResponse('Bildirim nedeninizi seçmelisiniz.');

    const existing = db.prepare("SELECT id FROM reports WHERE user_id = ? AND note_id = ? AND status IN ('pending', 'reviewing')").get(userId, noteId);
    if (existing) return errorResponse('Bu not için zaten bekleyen bir bildiriminiz var.');

    db.prepare('INSERT INTO reports (id, note_id, user_id, reason, details) VALUES (?, ?, ?, ?, ?)').run(
      uuid(), noteId, userId, reason, details?.trim() || null
    );

    return successResponse({ message: 'Bildiriminiz alındı. İncelenecektir.' }, 201);
  } catch (error) {
    console.error('Report error:', error);
    return errorResponse('Bildirim gönderilirken bir hata oluştu.', 500);
  }
}
