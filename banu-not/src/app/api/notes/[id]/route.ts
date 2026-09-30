import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id } = await params;

    const note = db.prepare(`
      SELECT 
        n.*,
        u.display_name as user_display_name,
        u.avatar_url as user_avatar,
        uni.name as university_name,
        f.name as faculty_name,
        d.name as department_name,
        c.name as course_name,
        COALESCE(AVG(r.score), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN universities uni ON n.university_id = uni.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      LEFT JOIN ratings r ON r.note_id = n.id
      LEFT JOIN comments cm ON cm.note_id = n.id AND cm.is_hidden = 0
      WHERE n.id = ?
      GROUP BY n.id
    `).get(id) as any;

    if (!note) {
      return errorResponse('Not bulunamadı.', 404);
    }

    if (note.status !== 'published') {
      const session = await getServerSession(authOptions);
      const user = session?.user as any;
      if (!user || (user.id !== note.user_id && user.role !== 'admin' && user.role !== 'moderator')) {
        return errorResponse('Bu not henüz yayınlanmamış.', 403);
      }
    }

    // Get files
    const files = db.prepare('SELECT * FROM note_files WHERE note_id = ?').all(id);

    // Get tags
    const tags = db.prepare(`
      SELECT t.name FROM note_tags nt
      JOIN tags t ON nt.tag_id = t.id
      WHERE nt.note_id = ?
    `).all(id) as { name: string }[];

    // Check user first
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.display_name as user_display_name, u.avatar_url as user_avatar,
             (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
             EXISTS (SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as user_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.note_id = ? AND c.is_hidden = 0
      ORDER BY c.created_at ASC
    `).all(userId || '', id);

    // Increment view
    db.prepare('UPDATE notes SET view_count = view_count + 1 WHERE id = ?').run(id);

    // Check user bookmark and rating
    let userBookmarked = false;
    let userRating = 0;
    if (userId) {
      const bm = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?').get(userId, id);
      userBookmarked = !!bm;
      const rt = db.prepare('SELECT score FROM ratings WHERE user_id = ? AND note_id = ?').get(userId, id) as any;
      userRating = rt?.score || 0;
    }

    return successResponse({
      ...note,
      files,
      tags: tags.map(t => t.name),
      comments,
      userBookmarked,
      userRating,
    });
  } catch (error) {
    console.error('Note detail error:', error);
    return errorResponse('Not detayı yüklenirken bir hata oluştu.', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Giriş yapmalısınız.', 401);
    }

    const db = await ensureDb();
    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const body = await request.json();

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
    if (!note) return errorResponse('Not bulunamadı.', 404);
    if (note.user_id !== userId && userRole !== 'admin') {
      return errorResponse('Bu notu düzenleme yetkiniz yok.', 403);
    }

    const { title, description, note_type, semester, academic_year, topic } = body;

    db.prepare(`
      UPDATE notes SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        note_type = COALESCE(?, note_type),
        semester = COALESCE(?, semester),
        academic_year = COALESCE(?, academic_year),
        topic = COALESCE(?, topic),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(title, description, note_type, semester, academic_year, topic, id);

    return successResponse({ message: 'Not güncellendi.' });
  } catch (error) {
    console.error('Note update error:', error);
    return errorResponse('Not güncellenirken bir hata oluştu.', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
    if (!note) return errorResponse('Not bulunamadı.', 404);
    if (note.user_id !== userId && userRole !== 'admin') {
      return errorResponse('Bu notu silme yetkiniz yok.', 403);
    }

    db.prepare("UPDATE notes SET status = 'removed', updated_at = datetime('now') WHERE id = ?").run(id);

    return successResponse({ message: 'Not kaldırıldı.' });
  } catch (error) {
    console.error('Note delete error:', error);
    return errorResponse('Not silinirken bir hata oluştu.', 500);
  }
}
