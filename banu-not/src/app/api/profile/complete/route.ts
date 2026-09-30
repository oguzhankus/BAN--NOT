import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Oturum bulunamadı. Lütfen giriş yapın.', 401);
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return errorResponse('Kullanıcı ID bulunamadı.', 400);
    }

    const db = await ensureDb();
    const body = await request.json();
    const { displayName, universityId, facultyId, departmentId, classYear } = body;

    if (!displayName || !universityId) {
      return errorResponse('Görünen ad ve Üniversite zorunludur.', 400);
    }

    db.prepare(`
      UPDATE users 
      SET 
        display_name = ?,
        university_id = ?,
        faculty_id = ?,
        department_id = ?,
        class_year = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      displayName, 
      universityId, 
      facultyId || null, 
      departmentId || null, 
      classYear || null,
      userId
    );

    return successResponse({ message: 'Profil tamamlandı.' });
  } catch (error) {
    console.error('Profile complete error:', error);
    return errorResponse('Profil güncellenirken bir hata oluştu.', 500);
  }
}
