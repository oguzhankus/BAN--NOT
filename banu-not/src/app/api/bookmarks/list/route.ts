import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;

    const notes = db.prepare(`
      SELECT n.*, 
        u.display_name as user_display_name,
        u.is_email_verified as user_is_email_verified,
        f.name as faculty_name,
        d.name as department_name,
        c.name as course_name,
        nf.file_size, nf.mime_type,
        COALESCE(AVG(r.score), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count
      FROM bookmarks b
      JOIN notes n ON b.note_id = n.id
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      LEFT JOIN note_files nf ON nf.note_id = n.id
      LEFT JOIN ratings r ON r.note_id = n.id
      WHERE b.user_id = ? AND n.status = 'published'
      GROUP BY n.id
      ORDER BY b.created_at DESC
    `).all(userId);

    return successResponse(notes);
  } catch (error) {
    console.error('Bookmarks list error:', error);
    return errorResponse('Kaydedilenler yüklenirken hata oluştu.', 500);
  }
}
