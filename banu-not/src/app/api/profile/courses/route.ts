import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;

    const courses = db.prepare(`
      SELECT c.* 
      FROM courses c
      JOIN user_courses uc ON c.id = uc.course_id
      WHERE uc.user_id = ?
      ORDER BY c.name ASC
    `).all(userId);

    return successResponse(courses);
  } catch (error) {
    console.error('Tracked courses GET error:', error);
    return errorResponse('Dersler yüklenemedi.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { courseId } = await request.json();

    if (!courseId) return errorResponse('Ders ID gerekli.', 400);

    try {
      db.prepare(`
        INSERT INTO user_courses (id, user_id, course_id)
        VALUES (?, ?, ?)
      `).run(uuidv4(), userId, courseId);
    } catch (e: any) {
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return successResponse({ message: 'Zaten takip ediliyor.' });
      }
      throw e;
    }

    return successResponse({ message: 'Ders takip listesine eklendi.' });
  } catch (error) {
    console.error('Tracked courses POST error:', error);
    return errorResponse('İşlem sırasında hata oluştu.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) return errorResponse('Ders ID gerekli.', 400);

    db.prepare('DELETE FROM user_courses WHERE user_id = ? AND course_id = ?').run(userId, courseId);

    return successResponse({ message: 'Ders takipten çıkarıldı.' });
  } catch (error) {
    console.error('Tracked courses DELETE error:', error);
    return errorResponse('İşlem sırasında hata oluştu.', 500);
  }
}
