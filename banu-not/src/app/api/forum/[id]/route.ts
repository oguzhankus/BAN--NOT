import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await ensureDb();
    const postId = params.id;

    // View count increment logic
    db.prepare(`UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?`).run(postId);

    const post = db.prepare(`
      SELECT p.*, 
             u.display_name as user_name, u.avatar_url,
             c.name as course_name, c.code as course_code,
             f.name as faculty_name, d.name as department_name
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN faculties f ON p.faculty_id = f.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE p.id = ?
    `).get(postId);

    if (!post) return errorResponse('Soru bulunamadı', 404);

    const replies = db.prepare(`
      SELECT r.*, u.display_name as user_name, u.avatar_url, u.role
      FROM forum_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.post_id = ?
      ORDER BY r.is_accepted DESC, r.upvotes DESC, r.created_at ASC
    `).all(postId);

    return successResponse({ post, replies });
  } catch (error) {
    console.error('Forum post GET error:', error);
    return errorResponse('Soru detayı alınırken hata oluştu', 500);
  }
}
