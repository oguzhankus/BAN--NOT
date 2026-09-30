import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get('q') || '';
    const universityId = searchParams.get('university') || '';
    const facultyId = searchParams.get('faculty') || '';
    const departmentId = searchParams.get('department') || '';
    const courseId = searchParams.get('course') || '';
    const noteType = searchParams.get('type') || '';
    const semester = searchParams.get('semester') || '';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE n.status = 'published'";
    const params: any[] = [];

    if (q) {
      whereClause += ` AND (
        n.title LIKE ? COLLATE NOCASE OR 
        n.description LIKE ? COLLATE NOCASE OR 
        n.topic LIKE ? COLLATE NOCASE OR
        n.course_code LIKE ? COLLATE NOCASE OR
        c.name LIKE ? COLLATE NOCASE
      )`;
      
      // SQLite COLLATE NOCASE does not support Turkish characters like ı, İ, ş, vb.
      // A great workaround is to replace these characters in the search term with the SQL '_' wildcard.
      // It will match any single character, making it effectively case-insensitive for those letters!
      const wildcardSearch = q
        .replace(/[ıiİI]/g, '_')
        .replace(/[şŞsS]/g, '_') // include s just in case
        .replace(/[ğĞgG]/g, '_')
        .replace(/[üÜuU]/g, '_')
        .replace(/[öÖoO]/g, '_')
        .replace(/[çÇcC]/g, '_');
        
      const searchTerm = `%${wildcardSearch}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (universityId) {
      whereClause += ' AND n.university_id = ?';
      params.push(universityId);
    }
    if (facultyId) {
      whereClause += ' AND n.faculty_id = ?';
      params.push(facultyId);
    }
    if (departmentId) {
      whereClause += ' AND n.department_id = ?';
      params.push(departmentId);
    }
    if (courseId) {
      whereClause += ' AND n.course_id = ?';
      params.push(courseId);
    }
    if (noteType) {
      whereClause += ' AND n.note_type = ?';
      params.push(noteType);
    }
    if (semester) {
      whereClause += ' AND n.semester = ?';
      params.push(semester);
    }

    let orderBy = 'ORDER BY n.created_at DESC';
    if (sort === 'popular') orderBy = 'ORDER BY n.download_count DESC';
    if (sort === 'rating') orderBy = 'ORDER BY avg_rating DESC';
    if (sort === 'oldest') orderBy = 'ORDER BY n.created_at ASC';
    
    // Sizin İçin (Personalized Feed)
    if (sort === 'recommended') {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const userId = (session.user as any).id;
        const dbUser = db.prepare('SELECT department_id FROM users WHERE id = ?').get(userId) as any;
        if (dbUser?.department_id) {
          whereClause += ' AND n.department_id = ?';
          params.push(dbUser.department_id);
        } else {
          // If user hasn't set a department, at least match their university
          const uniId = (session.user as any).universityId;
          if (uniId) {
            whereClause += ' AND n.university_id = ?';
            params.push(uniId);
          }
        }
      }
    }
    
    // Takip Ettiğim Dersler
    if (sort === 'followed_courses') {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const userId = (session.user as any).id;
        whereClause += ' AND n.course_id IN (SELECT course_id FROM user_courses WHERE user_id = ?)';
        params.push(userId);
      }
    }

    // Count total
    const countQuery = `
      SELECT COUNT(*) as total FROM notes n
      LEFT JOIN courses c ON n.course_id = c.id
      ${whereClause}
    `;
    const { total } = db.prepare(countQuery).get(...params) as { total: number };

    // Get notes with joins
    const query = `
      SELECT 
        n.*,
        u.display_name as user_display_name,
        uni.name as university_name,
        f.name as faculty_name,
        d.name as department_name,
        c.name as course_name,
        c.code as course_code_joined,
        nf.file_size,
        nf.mime_type,
        COALESCE(AVG(r.score), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count,
        COUNT(DISTINCT bk.id) as bookmark_count
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN universities uni ON n.university_id = uni.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      LEFT JOIN note_files nf ON nf.note_id = n.id
      LEFT JOIN ratings r ON r.note_id = n.id
      LEFT JOIN comments cm ON cm.note_id = n.id AND cm.is_hidden = 0
      LEFT JOIN bookmarks bk ON bk.note_id = n.id
      ${whereClause}
      GROUP BY n.id
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const notes = db.prepare(query).all(...params, limit, offset) as any[];

    // Get tags for each note
    const tagQuery = db.prepare(`
      SELECT t.name FROM note_tags nt
      JOIN tags t ON nt.tag_id = t.id
      WHERE nt.note_id = ?
    `);

    const notesWithTags = notes.map(note => ({
      ...note,
      tags: (tagQuery.all(note.id) as { name: string }[]).map(t => t.name),
    }));

    return successResponse({
      notes: notesWithTags,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Notes API error:', error);
    return errorResponse('Notlar yüklenirken bir hata oluştu.', 500);
  }
}
