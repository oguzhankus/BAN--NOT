import { NextResponse } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const db = await ensureDb();
    
    const notesCount = db.prepare("SELECT COUNT(*) as count FROM notes WHERE status = 'published'").get() as { count: number };
    const usersCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1").get() as { count: number };
    const coursesCount = db.prepare("SELECT COUNT(*) as count FROM courses").get() as { count: number };
    
    return successResponse({
      notes: notesCount.count,
      users: usersCount.count,
      courses: coursesCount.count
    });
  } catch (error) {
    console.error('Stats error:', error);
    return errorResponse('İstatistikler yüklenirken hata oluştu.', 500);
  }
}
