import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuid } from 'uuid';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };
type TaskRow = {
  id: string;
  title: string;
  due_at: string;
  is_done: number;
  course_id: string | null;
  course_name: string | null;
  note_id: string | null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Çalışma planını görmek için giriş yapmalısınız.', 401);
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const tasks = db.prepare(`
      SELECT t.id, t.title, t.due_at, t.is_done, t.course_id, c.name as course_name, t.note_id
      FROM study_tasks t
      LEFT JOIN courses c ON c.id = t.course_id
      WHERE t.user_id = ?
      ORDER BY t.is_done ASC, t.due_at ASC
    `).all(userId) as TaskRow[];
    const stats = db.prepare(`
      SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes,
             COUNT(*) as completed_sessions
      FROM study_sessions
      WHERE user_id = ? AND date(completed_at) >= date('now', '-6 days')
    `).get(userId) as { total_minutes: number; completed_sessions: number };

    return successResponse({ tasks, weeklyStudyMinutes: stats.total_minutes, weeklySessions: stats.completed_sessions });
  } catch (error) {
    console.error('Study plan GET error:', error);
    return errorResponse('Çalışma planı yüklenemedi.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Çalışma planı oluşturmak için giriş yapmalısınız.', 401);
    const body = await request.json() as { title?: unknown; dueAt?: unknown; courseId?: unknown; noteId?: unknown };
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const dueAt = typeof body.dueAt === 'string' ? new Date(body.dueAt) : new Date(Number.NaN);
    if (title.length < 2 || title.length > 160) return errorResponse('Görev adı 2-160 karakter olmalıdır.');
    if (Number.isNaN(dueAt.getTime())) return errorResponse('Geçerli bir tarih seçmelisiniz.');

    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const courseId = typeof body.courseId === 'string' ? body.courseId : null;
    const noteId = typeof body.noteId === 'string' ? body.noteId : null;
    if (courseId && !db.prepare('SELECT id FROM courses WHERE id = ? AND is_active = 1').get(courseId)) {
      return errorResponse('Seçilen ders bulunamadı.', 404);
    }
    if (noteId && !db.prepare("SELECT id FROM notes WHERE id = ? AND status = 'published'").get(noteId)) {
      return errorResponse('Seçilen not bulunamadı.', 404);
    }

    const id = uuid();
    db.prepare(`
      INSERT INTO study_tasks (id, user_id, title, due_at, course_id, note_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, title, dueAt.toISOString(), courseId, noteId);
    return successResponse({ id, title, due_at: dueAt.toISOString(), is_done: 0, course_id: courseId, note_id: noteId }, 201);
  } catch (error) {
    console.error('Study task create error:', error);
    return errorResponse('Çalışma görevi oluşturulamadı.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);
    const body = await request.json() as { id?: unknown; isDone?: unknown };
    if (typeof body.id !== 'string' || typeof body.isDone !== 'boolean') return errorResponse('Görev bilgisi geçersiz.');
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const result = db.prepare(`
      UPDATE study_tasks SET is_done = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(body.isDone ? 1 : 0, body.id, userId);
    if (!result.changes) return errorResponse('Görev bulunamadı.', 404);
    return successResponse({ id: body.id, is_done: body.isDone ? 1 : 0 });
  } catch (error) {
    console.error('Study task update error:', error);
    return errorResponse('Görev güncellenemedi.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return errorResponse('Görev ID gereklidir.');
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const result = db.prepare('DELETE FROM study_tasks WHERE id = ? AND user_id = ?').run(id, userId);
    if (!result.changes) return errorResponse('Görev bulunamadı.', 404);
    return successResponse({ message: 'Görev silindi.' });
  } catch (error) {
    console.error('Study task delete error:', error);
    return errorResponse('Görev silinemedi.', 500);
  }
}
