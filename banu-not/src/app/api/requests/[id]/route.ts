import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const isAdmin = (session.user as any).role === 'admin';
    const { id: requestId } = await params;

    const requestItem = db.prepare('SELECT user_id FROM note_requests WHERE id = ?').get(requestId) as any;

    if (!requestItem) {
      return errorResponse('İstek bulunamadı.', 404);
    }

    if (requestItem.user_id !== userId && !isAdmin) {
      return errorResponse('Bu işlemi yapmaya yetkiniz yok.', 403);
    }

    db.prepare('DELETE FROM note_requests WHERE id = ?').run(requestId);

    return successResponse({ message: 'İstek başarıyla silindi.' });
  } catch (error) {
    console.error('Delete request error:', error);
    return errorResponse('İstek silinirken hata oluştu.', 500);
  }
}
