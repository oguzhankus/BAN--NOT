import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id: noteId } = await params;

    const comments = db.prepare(`
      SELECT c.id, c.content, c.created_at, u.id as user_id, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.note_id = ? AND c.is_hidden = 0
      ORDER BY c.created_at DESC
    `).all(noteId);

    return successResponse(comments);
  } catch (error) {
    console.error('Comments GET error:', error);
    return errorResponse('Yorumlar yüklenemedi.', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Yorum yapmak için giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const { id: noteId } = await params;
    const userId = (session.user as any).id;
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return errorResponse('Yorum boş olamaz.', 400);
    }

    const commentId = uuidv4();
    db.prepare(`
      INSERT INTO comments (id, user_id, note_id, content) 
      VALUES (?, ?, ?, ?)
    `).run(commentId, userId, noteId, content.trim());

    // Send notification to note owner
    const note = db.prepare('SELECT user_id, title FROM notes WHERE id = ?').get(noteId) as any;
    if (note && note.user_id !== userId) {
      const sender = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId) as any;
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), 
        note.user_id, 
        'comment', 
        'Yeni Yorum', 
        `${sender?.display_name || 'Biri'} "${note.title}" notuna yorum yaptı.`, 
        `/not/${noteId}`
      );
    }

    return successResponse({ id: commentId, content: content.trim() });
  } catch (error) {
    console.error('Comments POST error:', error);
    return errorResponse('Yorum yapılamadı.', 500);
  }
}
