import { NextRequest } from 'next/server';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type RouteContext = { params: Promise<{ id: string }> };
type CourseNoteRow = {
  id: string;
  title: string;
  description: string | null;
  note_type: string;
  is_handwritten: number;
  course_code: string | null;
  semester: string | null;
  academic_year: string | null;
  topic: string | null;
  download_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
  user_display_name: string | null;
  user_is_email_verified: number;
  course_name: string;
  department_name: string | null;
  faculty_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  avg_rating: number;
  rating_count: number;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = await ensureDb();
    const course = db.prepare(`
      SELECT c.id, c.name, c.code, c.semester, c.year,
             uni.name as university_name,
             GROUP_CONCAT(DISTINCT d.name) as department_names
      FROM courses c
      LEFT JOIN universities uni ON uni.id = c.university_id
      LEFT JOIN course_departments cd ON cd.course_id = c.id
      LEFT JOIN departments d ON d.id = cd.department_id
      WHERE c.id = ? AND c.is_active = 1
      GROUP BY c.id
    `).get(id) as {
      id: string;
      name: string;
      code: string | null;
      semester: string | null;
      year: number | null;
      university_name: string | null;
      department_names: string | null;
    } | undefined;
    if (!course) return errorResponse('Ders bulunamadı.', 404);

    const notes = db.prepare(`
      SELECT n.id, n.title, n.description, n.note_type, n.is_handwritten, n.course_code, n.semester,
             n.academic_year, n.topic, n.download_count, n.view_count, n.created_at,
             u.id as user_id, u.display_name as user_display_name,
             u.is_email_verified as user_is_email_verified,
             c.name as course_name, d.name as department_name, f.name as faculty_name,
             nf.file_size, nf.mime_type,
             COALESCE(AVG(r.score), 0) as avg_rating,
             COUNT(DISTINCT r.id) as rating_count
      FROM notes n
      JOIN users u ON u.id = n.user_id
      LEFT JOIN courses c ON c.id = n.course_id
      LEFT JOIN departments d ON d.id = n.department_id
      LEFT JOIN faculties f ON f.id = n.faculty_id
      LEFT JOIN note_files nf ON nf.id = (
        SELECT id FROM note_files WHERE note_id = n.id ORDER BY created_at DESC, rowid DESC LIMIT 1
      )
      LEFT JOIN ratings r ON r.note_id = n.id
      WHERE n.course_id = ? AND n.status = 'published'
      GROUP BY n.id
    `).all(id) as CourseNoteRow[];

    const bestNotes = [...notes]
      .sort((a, b) => b.avg_rating - a.avg_rating || b.download_count - a.download_count)
      .slice(0, 6);
    const examQuestions = notes
      .filter(note => note.note_type === 'cikmis_soru')
      .sort((a, b) => (b.academic_year || '').localeCompare(a.academic_year || '') || b.download_count - a.download_count);

    let isJoined = false;
    let isAdmin = false;
    const { getServerSession } = require('next-auth');
    const { authOptions } = require('@/lib/auth');
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
       const currentUserId = (session.user as any).id;
       const join = db.prepare('SELECT 1 FROM user_courses WHERE user_id = ? AND course_id = ?').get(currentUserId, id);
       if (join) isJoined = true;
       isAdmin = (session.user as any).role === 'admin' || (session.user as any).role === 'moderator';
    }

    const announcements = db.prepare(`
      SELECT * FROM announcements 
      WHERE is_active = 1 
      ORDER BY created_at DESC LIMIT 3
    `).all();

    return successResponse({
      course,
      stats: {
        noteCount: notes.length,
        examQuestionCount: examQuestions.length,
        downloads: notes.reduce((total, note) => total + note.download_count, 0),
      },
      bestNotes,
      examQuestions,
      isJoined,
      isAdmin,
      announcements
    });
  } catch (error) {
    console.error('Course detail error:', error);
    return errorResponse('Ders bilgileri yüklenirken hata oluştu.', 500);
  }
}
