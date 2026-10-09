import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const { id } = await params;
    const body = await request.json() as { name?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 60) {
      return errorResponse('Koleksiyon adı 2-60 karakter arasında olmalıdır.');
    }

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    try {
      const result = db.prepare(`
        UPDATE note_collections
        SET name = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).run(name, id, userId);
      if (result.changes !== 1) return errorResponse('Koleksiyon bulunamadı.', 404);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return errorResponse('Bu isimde bir koleksiyonun zaten var.', 409);
      }
      throw error;
    }
    return successResponse({ id, name });
  } catch (error) {
    console.error('Collection update error:', error);
    return errorResponse('Koleksiyon güncellenirken hata oluştu.', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const { id } = await params;
    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    const result = db.prepare('DELETE FROM note_collections WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes !== 1) return errorResponse('Koleksiyon bulunamadı.', 404);
    return successResponse({ message: 'Koleksiyon silindi.' });
  } catch (error) {
    console.error('Collection delete error:', error);
    return errorResponse('Koleksiyon silinirken hata oluştu.', 500);
  }
}
