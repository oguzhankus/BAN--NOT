import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;

    const user = db.prepare(`
      SELECT id, email, display_name, first_name, last_name, bio, avatar_url,
             university_id, faculty_id, department_id, class_year, role, 
             profile_public, created_at
      FROM users WHERE id = ?
    `).get(userId);

    const notes = db.prepare(`
      SELECT n.*, 
        u.display_name as user_display_name,
        f.name as faculty_name,
        d.name as department_name,
        c.name as course_name,
        nf.file_size, nf.mime_type,
        COALESCE(AVG(r.score), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      LEFT JOIN note_files nf ON nf.note_id = n.id
      LEFT JOIN ratings r ON r.note_id = n.id
      LEFT JOIN comments cm ON cm.note_id = n.id
      WHERE n.user_id = ? AND n.status != 'removed'
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `).all(userId);

    return successResponse({ user, notes });
  } catch (error) {
    console.error('Profile error:', error);
    return errorResponse('Profil yüklenirken hata oluştu.', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { displayName, bio } = await request.json();

    if (displayName && (displayName.length < 2 || displayName.length > 50)) {
      return errorResponse('Görünen ad 2-50 karakter arasında olmalıdır.');
    }

    db.prepare(`
      UPDATE users SET 
        display_name = COALESCE(?, display_name),
        bio = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(displayName?.trim() || null, bio?.trim() || null, userId);

    return successResponse({ message: 'Profil güncellendi.' });
  } catch (error) {
    console.error('Profile update error:', error);
    return errorResponse('Profil güncellenirken hata oluştu.', 500);
  }
}
