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
    const { noteId, content, parentId } = await request.json();

    if (!noteId) return errorResponse('Not ID gerekli.');
    if (!content || content.trim().length < 2) return errorResponse('Yorum en az 2 karakter olmalıdır.');
    if (content.length > 1000) return errorResponse('Yorum en fazla 1000 karakter olabilir.');

    // Rate limiting: Check if user commented in the last 15 seconds
    const lastComment = db.prepare('SELECT created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any;
    if (lastComment) {
      const timeDiff = Date.now() - new Date(lastComment.created_at).getTime();
      if (timeDiff < 15000) {
        return errorResponse('Çok sık yorum yapıyorsunuz. Lütfen biraz bekleyin.', 429);
      }
    }

    const commentId = uuid();
    db.prepare('INSERT INTO comments (id, user_id, note_id, parent_id, content) VALUES (?, ?, ?, ?, ?)').run(
      commentId, userId, noteId, parentId || null, content.trim()
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return errorResponse('Yorum ID gerekli.');

    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id) as any;
    if (!comment) return errorResponse('Yorum bulunamadı.', 404);

    if (comment.user_id !== userId && userRole !== 'admin' && userRole !== 'moderator') {
      return errorResponse('Bu yorumu silme yetkiniz yok.', 403);
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(id);

    return successResponse({ message: 'Yorum silindi.' });
  } catch (error) {
    console.error('Comment delete error:', error);
    return errorResponse('Yorum silinirken bir hata oluştu.', 500);
  }
}
