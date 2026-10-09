import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id } = await params;

    const note = db.prepare('SELECT course_id, department_id, faculty_id FROM notes WHERE id = ?').get(id) as any;
    if (!note) return errorResponse('Not bulunamadı', 404);

    let similarNotes: { id: string }[] = [];

    // Try finding by course
    if (note.course_id) {
      similarNotes = db.prepare(`
        SELECT n.*, u.display_name as user_display_name
        FROM notes n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.course_id = ? AND n.id != ? AND n.status = 'published'
        ORDER BY n.created_at DESC LIMIT 3
      `).all(note.course_id, id) as { id: string }[];
    }

    // If not enough, try by department
    if (similarNotes.length < 3 && note.department_id) {
      const more = db.prepare(`
        SELECT n.*, u.display_name as user_display_name
        FROM notes n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.department_id = ? AND n.id != ? AND n.status = 'published'
        ${similarNotes.length > 0 ? `AND n.id NOT IN (${similarNotes.map(n => `'${n.id}'`).join(',')})` : ''}
        ORDER BY n.created_at DESC LIMIT ?
      `).all(note.department_id, id, 3 - similarNotes.length) as { id: string }[];
      similarNotes = [...similarNotes, ...more];
    }

    // If still not enough, try by faculty
    if (similarNotes.length < 3 && note.faculty_id) {
      const more = db.prepare(`
        SELECT n.*, u.display_name as user_display_name
        FROM notes n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.faculty_id = ? AND n.id != ? AND n.status = 'published'
        ${similarNotes.length > 0 ? `AND n.id NOT IN (${similarNotes.map(n => `'${n.id}'`).join(',')})` : ''}
        ORDER BY n.created_at DESC LIMIT ?
      `).all(note.faculty_id, id, 3 - similarNotes.length) as { id: string }[];
      similarNotes = [...similarNotes, ...more];
    }

    return successResponse(similarNotes);
  } catch (error) {
    console.error('Similar notes error:', error);
    return errorResponse('Benzer notlar yüklenemedi', 500);
  }
}
