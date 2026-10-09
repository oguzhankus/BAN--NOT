import { NextRequest } from 'next/server';
import { v4 as uuid } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type CollectionNote = {
  id: string;
  title: string;
  note_type: string;
  is_handwritten: number;
  download_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
  user_display_name: string | null;
  user_is_email_verified: number;
  course_name: string | null;
  faculty_name: string | null;
  department_name: string | null;
  file_size: number | null;
  mime_type: string | null;
};

type CollectionRow = {
  id: string;
  name: string;
  created_at: string;
  note_id: string | null;
} & Omit<CollectionNote, 'id'>;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    const rows = db.prepare(`
      SELECT c.id, c.name, c.created_at,
             n.id as note_id, n.title, n.note_type, n.is_handwritten, n.download_count, n.view_count, n.created_at as note_created_at,
             n.user_id, u.display_name as user_display_name, u.is_email_verified as user_is_email_verified,
             co.name as course_name, f.name as faculty_name, d.name as department_name,
             nf.file_size, nf.mime_type
      FROM note_collections c
      LEFT JOIN collection_notes cn ON cn.collection_id = c.id
      LEFT JOIN notes n ON n.id = cn.note_id AND n.status = 'published'
      LEFT JOIN users u ON u.id = n.user_id
      LEFT JOIN courses co ON co.id = n.course_id
      LEFT JOIN faculties f ON f.id = n.faculty_id
      LEFT JOIN departments d ON d.id = n.department_id
      LEFT JOIN note_files nf
        ON nf.id = (
          SELECT id FROM note_files
          WHERE note_id = n.id
          ORDER BY created_at DESC, rowid DESC
          LIMIT 1
        )
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC, cn.created_at DESC
    `).all(userId) as (Omit<CollectionRow, 'created_at'> & {
      created_at: string;
      note_created_at: string | null;
    })[];

    const collections = new Map<string, { id: string; name: string; created_at: string; notes: CollectionNote[] }>();
    for (const row of rows) {
      let collection = collections.get(row.id);
      if (!collection) {
        collection = { id: row.id, name: row.name, created_at: row.created_at, notes: [] };
        collections.set(row.id, collection);
      }
      if (row.note_id && row.note_created_at) {
        collection.notes.push({
          id: row.note_id,
          title: row.title,
          note_type: row.note_type,
          is_handwritten: row.is_handwritten,
          download_count: row.download_count,
          view_count: row.view_count,
          created_at: row.note_created_at,
          user_id: row.user_id,
          user_display_name: row.user_display_name,
          user_is_email_verified: row.user_is_email_verified,
          course_name: row.course_name,
          faculty_name: row.faculty_name,
          department_name: row.department_name,
          file_size: row.file_size,
          mime_type: row.mime_type,
        });
      }
    }
    return successResponse(Array.from(collections.values()));
  } catch (error) {
    console.error('Collections list error:', error);
    return errorResponse('Koleksiyonlar yüklenirken hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const body = await request.json() as { name?: unknown };
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 60) {
      return errorResponse('Koleksiyon adı 2-60 karakter arasında olmalıdır.');
    }

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    const id = uuid();
    try {
      db.prepare('INSERT INTO note_collections (id, user_id, name) VALUES (?, ?, ?)').run(id, userId, name);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return errorResponse('Bu isimde bir koleksiyonun zaten var.', 409);
      }
      throw error;
    }

    return successResponse({ id, name }, 201);
  } catch (error) {
    console.error('Collection create error:', error);
    return errorResponse('Koleksiyon oluşturulurken hata oluştu.', 500);
  }
}
