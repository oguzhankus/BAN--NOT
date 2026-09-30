import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q');
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, 
             u.display_name as user_name, u.avatar_url,
             c.name as course_name, c.code as course_code,
             f.name as faculty_name, d.name as department_name,
             (SELECT COUNT(*) FROM forum_replies WHERE post_id = p.id) as reply_count
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN faculties f ON p.faculty_id = f.id
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (courseId) {
      query += ` AND p.course_id = ?`;
      params.push(courseId);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const posts = db.prepare(query).all(...params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as count FROM forum_posts p WHERE 1=1`;
    const countParams: any[] = [];
    if (search) {
      countQuery += ` AND (p.title LIKE ? OR p.content LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }
    if (courseId) {
      countQuery += ` AND p.course_id = ?`;
      countParams.push(courseId);
    }
    const total = (db.prepare(countQuery).get(...countParams) as any).count;

    return successResponse({
      posts,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Forum fetch error:', error);
    return errorResponse('Sorular alınırken hata oluştu', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { title, content, courseId, facultyId, departmentId } = await request.json();

    if (!title || title.trim().length < 5) {
      return errorResponse('Başlık en az 5 karakter olmalıdır');
    }
    if (!content || content.trim().length < 10) {
      return errorResponse('İçerik en az 10 karakter olmalıdır');
    }

    const postId = uuid();
    db.prepare(`
      INSERT INTO forum_posts (id, user_id, title, content, course_id, faculty_id, department_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(postId, userId, title.trim(), content.trim(), courseId || null, facultyId || null, departmentId || null);

    return successResponse({ id: postId, message: 'Sorunuz başarıyla paylaşıldı.' }, 201);
  } catch (error) {
    console.error('Forum post error:', error);
    return errorResponse('Soru paylaşılırken hata oluştu', 500);
  }
}
