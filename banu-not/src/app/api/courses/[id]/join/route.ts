import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { id: courseId } = await params;

    const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId);
    if (!course) return errorResponse('Ders bulunamadı.', 404);

    db.prepare('INSERT OR IGNORE INTO user_courses (id, user_id, course_id) VALUES (?, ?, ?)').run(uuid(), userId, courseId);

    return successResponse({ message: 'Ders takip edilmeye başlandı.' });
  } catch (error) {
    console.error('Course join error:', error);
    return errorResponse('Ders takip edilirken hata oluştu.', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { id: courseId } = await params;

    db.prepare('DELETE FROM user_courses WHERE user_id = ? AND course_id = ?').run(userId, courseId);

    return successResponse({ message: 'Ders takipten çıkarıldı.' });
  } catch (error) {
    console.error('Course leave error:', error);
    return errorResponse('Ders takipten çıkarılırken hata oluştu.', 500);
  }
}
