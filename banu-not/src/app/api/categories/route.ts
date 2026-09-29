import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'universities';
    const parentId = searchParams.get('parentId') || '';

    switch (type) {
      case 'universities': {
        const data = db.prepare('SELECT * FROM universities WHERE is_active = 1 ORDER BY sort_order, name').all();
        return successResponse(data);
      }
      case 'faculties': {
        if (!parentId) return errorResponse('Üniversite ID gerekli.');
        const data = db.prepare('SELECT * FROM faculties WHERE university_id = ? AND is_active = 1 ORDER BY sort_order, name').all(parentId);
        return successResponse(data);
      }
      case 'departments': {
        if (!parentId) return errorResponse('Fakülte ID gerekli.');
        const data = db.prepare('SELECT * FROM departments WHERE faculty_id = ? AND is_active = 1 ORDER BY sort_order, name').all(parentId);
        return successResponse(data);
      }
      case 'courses': {
        if (!parentId) return errorResponse('Bölüm ID gerekli.');
        const data = db.prepare(`
          SELECT c.* FROM courses c
          JOIN course_departments cd ON c.id = cd.course_id
          WHERE cd.department_id = ? AND c.is_active = 1
          ORDER BY c.code, c.name
        `).all(parentId);
        return successResponse(data);
      }
      default:
        return errorResponse('Geçersiz kategori tipi.');
    }
  } catch (error) {
    console.error('Categories API error:', error);
    return errorResponse('Kategoriler yüklenirken bir hata oluştu.', 500);
  }
}
