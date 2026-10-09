import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse } from '@/lib/api-utils';

type SessionUser = { id: string };
type CalendarTask = { id: string; title: string; due_at: string; course_name: string | null };

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Takvimi dışa aktarmak için giriş yapmalısınız.', 401);
    const db = await ensureDb();
    const tasks = db.prepare(`
      SELECT t.id, t.title, t.due_at, c.name as course_name
      FROM study_tasks t LEFT JOIN courses c ON c.id = t.course_id
      WHERE t.user_id = ? AND t.is_done = 0
      ORDER BY t.due_at
    `).all((session.user as SessionUser).id) as CalendarTask[];
    const events = tasks.map(task => {
      const date = new Date(task.due_at);
      const start = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      const end = new Date(date.getTime() + 30 * 60_000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      return [
        'BEGIN:VEVENT',
        `UID:${task.id}@banunot`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(task.title)}`,
        `DESCRIPTION:${escapeIcs(task.course_name ? `Ders: ${task.course_name}` : 'BANÜ NOT çalışma planı')}`,
        'END:VEVENT',
      ].join('\r\n');
    });
    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//BANU NOT//Study Plan//TR', ...events, 'END:VCALENDAR'].join('\r\n');
    return new Response(calendar, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="banu-not-calisma-plani.ics"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Study calendar export error:', error);
    return errorResponse('Takvim dışa aktarılamadı.', 500);
  }
}
