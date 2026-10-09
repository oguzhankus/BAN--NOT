import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const { id: collectionId } = await params;
    const body = await request.json() as { noteId?: unknown };
    const noteId = typeof body.noteId === 'string' ? body.noteId : '';
    if (!noteId) return errorResponse('Not seçmelisiniz.');

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    const collection = db.prepare(
      'SELECT id FROM note_collections WHERE id = ? AND user_id = ?'
    ).get(collectionId, userId);
    if (!collection) return errorResponse('Koleksiyon bulunamadı.', 404);

    const note = db.prepare("SELECT id FROM notes WHERE id = ? AND status = 'published'").get(noteId);
    if (!note) return errorResponse('Yayınlanmış not bulunamadı.', 404);

    db.prepare('INSERT OR IGNORE INTO collection_notes (collection_id, note_id) VALUES (?, ?)').run(collectionId, noteId);
    return successResponse({ message: 'Not koleksiyona eklendi.' });
  } catch (error) {
    console.error('Add collection note error:', error);
    return errorResponse('Not koleksiyona eklenirken hata oluştu.', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const { id: collectionId } = await params;
    const noteId = new URL(request.url).searchParams.get('noteId');
    if (!noteId) return errorResponse('Not seçmelisiniz.');

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    const result = db.prepare(`
      DELETE FROM collection_notes
      WHERE collection_id = ? AND note_id = ?
        AND EXISTS (SELECT 1 FROM note_collections WHERE id = ? AND user_id = ?)
    `).run(collectionId, noteId, collectionId, userId);
    if (result.changes !== 1) return errorResponse('Not bu koleksiyonda bulunamadı.', 404);
    return successResponse({ message: 'Not koleksiyondan çıkarıldı.' });
  } catch (error) {
    console.error('Remove collection note error:', error);
    return errorResponse('Not koleksiyondan çıkarılırken hata oluştu.', 500);
  }
}
