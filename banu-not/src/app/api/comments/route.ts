import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Yorum yazmak için giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { noteId, content } = await request.json();

    if (!noteId) return errorResponse('Not ID gerekli.');
    if (!content || content.trim().length < 2) return errorResponse('Yorum en az 2 karakter olmalıdır.');
    if (content.length > 1000) return errorResponse('Yorum en fazla 1000 karakter olabilir.');

    const commentId = uuid();
    db.prepare('INSERT INTO comments (id, user_id, note_id, content) VALUES (?, ?, ?, ?)').run(
      commentId, userId, noteId, content.trim()
    );

    const comment = db.prepare(`
      SELECT c.*, u.display_name as user_display_name, u.avatar_url as user_avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(commentId);

    return successResponse(comment, 201);
  } catch (error) {
    console.error('Comment error:', error);
    return errorResponse('Yorum eklenirken bir hata oluştu.', 500);
  }
}
