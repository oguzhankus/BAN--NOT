import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuid } from 'uuid';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';
import { sendPushNotification } from '@/lib/push-notifications';

type RouteContext = { params: Promise<{ id: string }> };
type VersionRow = {
  version_number: number;
  snapshot_json: string;
  created_at: string;
  changed_by_name: string;
};

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50') || 50) * 1024 * 1024;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const db = await ensureDb();
    const note = db.prepare('SELECT id, user_id, status FROM notes WHERE id = ?').get(id) as
      | { id: string; user_id: string; status: string }
      | undefined;
    if (!note) return errorResponse('Not bulunamadı.', 404);

    if (note.status !== 'published') {
      const session = await getServerSession(authOptions);
      const user = session?.user as { id?: string; role?: string } | undefined;
      if (!user || (user.id !== note.user_id && user.role !== 'admin' && user.role !== 'moderator')) {
        return errorResponse('Bu notun sürümlerini görüntüleme yetkiniz yok.', 403);
      }
    }

    const versions = db.prepare(`
      SELECT nv.version_number, nv.snapshot_json, nv.created_at,
             u.display_name as changed_by_name
      FROM note_versions nv
      JOIN users u ON u.id = nv.changed_by
      WHERE nv.note_id = ?
      ORDER BY nv.version_number DESC
    `).all(id) as VersionRow[];

    return successResponse(versions.map(version => {
      const snapshot = JSON.parse(version.snapshot_json) as {
        files?: { original_name: string; mime_type: string; file_size: number; storage_path?: string }[];
        [key: string]: unknown;
      };
      const { files, ...publicSnapshot } = snapshot;
      return {
        version: version.version_number,
        changedAt: version.created_at,
        changedBy: version.changed_by_name,
        previous: {
          ...publicSnapshot,
          files: files?.map(file => ({
            original_name: file.original_name,
            mime_type: file.mime_type,
            file_size: file.file_size,
          })),
        },
      };
    }));
  } catch (error) {
    console.error('Note versions error:', error);
    return errorResponse('Not sürümleri yüklenirken hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  let uploadedPath: string | null = null;
  let fileCommitted = false;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const { id } = await params;
    const user = session.user as { id: string; role?: string };
    const db = await ensureDb();
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as
      | {
        id: string;
        title: string;
        description: string | null;
        note_type: string;
        semester: string | null;
        academic_year: string | null;
        topic: string | null;
        file_hash: string | null;
        user_id: string;
      }
      | undefined;
    if (!note) return errorResponse('Not bulunamadı.', 404);
    if (note.user_id !== user.id && user.role !== 'admin') {
      return errorResponse('Bu notu güncelleme yetkiniz yok.', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) return errorResponse('Yeni dosya seçmelisiniz.');
    if (!ALLOWED_MIMES.includes(file.type)) {
      return errorResponse('Desteklenmeyen dosya biçimi. İzin verilenler: PDF, DOCX, PPTX, JPG, PNG, WebP');
    }
    if (file.size > MAX_SIZE) return errorResponse(`Dosya boyutu çok büyük. Maksimum: ${MAX_SIZE / 1024 / 1024} MB`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex');
    if (hash === note.file_hash) return errorResponse('Seçtiğiniz dosya notun mevcut dosyasıyla aynı.');
    const duplicate = db.prepare(`
      SELECT id, title FROM notes
      WHERE file_hash = ? AND id != ? AND status != 'removed'
    `).get(hash, id) as { id: string; title: string } | undefined;
    if (duplicate) return errorResponse(`Bu dosya daha önce "${duplicate.title}" başlığıyla yüklenmiş görünüyor.`);

    const currentFile = db.prepare(`
      SELECT original_name, mime_type, file_size, storage_path
      FROM note_files
      WHERE note_id = ?
      ORDER BY created_at DESC, rowid DESC
      LIMIT 1
    `).get(id);
    const snapshot = {
      title: note.title,
      description: note.description,
      note_type: note.note_type,
      semester: note.semester,
      academic_year: note.academic_year,
      topic: note.topic,
      files: currentFile ? [currentFile] : [],
    };

    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    const storageKey = uuid();
    const ext = path.extname(file.name) || '.pdf';
    uploadedPath = path.join(uploadDir, `${storageKey}${ext}`);
    fs.writeFileSync(uploadedPath, buffer, { flag: 'wx' });

    const saveVersion = db.transaction(() => {
      const next = db.prepare(
        'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM note_versions WHERE note_id = ?'
      ).get(id) as { next_version: number };
      db.prepare(`
        INSERT INTO note_versions (id, note_id, version_number, snapshot_json, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuid(), id, next.next_version, JSON.stringify(snapshot), user.id);
      db.prepare(`
        INSERT INTO note_files (id, note_id, original_name, storage_path, storage_key, mime_type, file_size, scan_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(uuid(), id, file.name, uploadedPath, storageKey, file.type, file.size);
      db.prepare(`
        UPDATE notes SET file_hash = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(hash, id);

      const recipients = db.prepare(`
        SELECT DISTINCT user_id FROM note_downloads
        WHERE note_id = ? AND user_id != ?
      `).all(id, user.id) as { user_id: string }[];
      const addNotification = db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'note_updated', 'İndirdiğin not güncellendi', ?, ?)
      `);
      recipients.forEach(recipient => addNotification.run(
        uuid(),
        recipient.user_id,
        `"${note.title}" notunun dosyası v${next.next_version + 1} olarak güncellendi.`,
        `/not/${id}`,
      ));
      return { version: next.next_version + 1, recipients };
    });

    const result = saveVersion();
    fileCommitted = true;
    await Promise.all(result.recipients.map(recipient => sendPushNotification(db, recipient.user_id, {
      title: 'İndirdiğin not güncellendi',
      body: `"${note.title}" notunun dosyası v${result.version} olarak güncellendi.`,
      url: `/not/${id}`,
    })));
    return successResponse({ version: result.version, message: `Dosya v${result.version} olarak güncellendi.` });
  } catch (error) {
    if (!fileCommitted && uploadedPath && fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    console.error('Note file version error:', error);
    return errorResponse('Not dosyası güncellenirken hata oluştu.', 500);
  }
}
