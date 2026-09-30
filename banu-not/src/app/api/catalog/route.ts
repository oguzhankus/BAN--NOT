import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();
    
    const faculties = db.prepare('SELECT * FROM faculties WHERE is_active = 1 ORDER BY sort_order, name').all();
    const departments = db.prepare('SELECT * FROM departments WHERE is_active = 1 ORDER BY sort_order, name').all();
    
    return successResponse({ faculties, departments });
  } catch (error) {
    console.error('Catalog API error:', error);
    return errorResponse('Katalog yüklenirken bir hata oluştu.', 500);
  }
}
