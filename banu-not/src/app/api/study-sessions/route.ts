import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuid } from 'uuid';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Çalışma oturumunu kaydetmek için giriş yapmalısınız.', 401);
    const body = await request.json() as { durationMinutes?: unknown; taskId?: unknown };
    const duration = Number(body.durationMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 180) {
      return errorResponse('Oturum süresi 1-180 dakika arasında olmalıdır.');
    }

    const userId = (session.user as SessionUser).id;
    const db = await ensureDb();
    const taskId = typeof body.taskId === 'string' ? body.taskId : null;
    if (taskId && !db.prepare('SELECT id FROM study_tasks WHERE id = ? AND user_id = ?').get(taskId, userId)) {
      return errorResponse('Seçilen görev bulunamadı.', 404);
    }

    const id = uuid();
    const completedAt = new Date();
    const startedAt = new Date(completedAt.getTime() - duration * 60_000);
    db.prepare(`
      INSERT INTO study_sessions (id, user_id, duration_minutes, task_id, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, duration, taskId, startedAt.toISOString(), completedAt.toISOString());
    return successResponse({ id, durationMinutes: duration, completedAt: completedAt.toISOString() }, 201);
  } catch (error) {
    console.error('Study session create error:', error);
    return errorResponse('Çalışma oturumu kaydedilemedi.', 500);
  }
}
