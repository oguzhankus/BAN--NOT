import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50') || 50) * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Not yüklemek için giriş yapmalısınız.', 401);
    }

    const db = await ensureDb();
    const userId = (session.user as any).id;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const noteType = formData.get('noteType') as string;
    const universityId = formData.get('universityId') as string;
    const facultyId = formData.get('facultyId') as string;
    const departmentId = formData.get('departmentId') as string;
    const courseId = formData.get('courseId') as string;
    const courseCode = formData.get('courseCode') as string;
    const semester = formData.get('semester') as string;
    const academicYear = formData.get('academicYear') as string;
    const topic = formData.get('topic') as string;
    const tagsStr = formData.get('tags') as string;
    const requestId = formData.get('requestId') as string;

    // Validation
    if (!title || title.length < 3 || title.length > 200) {
      return errorResponse('Başlık 3-200 karakter arasında olmalıdır.');
    }
    if (!noteType) {
      return errorResponse('Not türünü seçmelisiniz.');
    }
    if (!file) {
      return errorResponse('Dosya yüklenmelidir.');
    }

    // File validation
    if (!ALLOWED_MIMES.includes(file.type)) {
      return errorResponse('Desteklenmeyen dosya biçimi. İzin verilenler: PDF, DOCX, PPTX, JPG, PNG, WebP');
    }
    if (file.size > MAX_SIZE) {
      return errorResponse(`Dosya boyutu çok büyük. Maksimum: ${MAX_SIZE / 1024 / 1024} MB`);
    }

    // Save file
    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storageKey = uuid();
    const ext = path.extname(file.name) || '.pdf';
    const storagePath = path.join(uploadDir, `${storageKey}${ext}`);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(storagePath, buffer);

    // Compute file hash for duplicate detection
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Check for duplicate
    const duplicate = db.prepare("SELECT id, title FROM notes WHERE file_hash = ? AND status != 'removed'").get(hash) as any;
    if (duplicate) {
      // Remove the uploaded file
      fs.unlinkSync(storagePath);
      return errorResponse(`Bu dosya daha önce "${duplicate.title}" başlığıyla yüklenmiş görünüyor. Yine de yüklemek istiyorsanız dosyada küçük bir değişiklik yapın.`);
    }

    // Get auto_publish setting
    const autoPublish = db.prepare("SELECT value FROM site_settings WHERE key = 'auto_publish'").get() as any;
    const status = autoPublish?.value === 'true' ? 'published' : 'pending_review';

    // Create note
    const noteId = uuid();
    db.prepare(`
      INSERT INTO notes (id, title, description, note_type, university_id, faculty_id, department_id, course_id, course_code, semester, academic_year, topic, user_id, status, file_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(noteId, title.trim(), description?.trim() || null, noteType, universityId || null, facultyId || null, departmentId || null, courseId || null, courseCode?.trim() || null, semester || null, academicYear || null, topic?.trim() || null, userId, status, hash);

    // Create note file
    db.prepare(`
      INSERT INTO note_files (id, note_id, original_name, storage_path, storage_key, mime_type, file_size, scan_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(uuid(), noteId, file.name, storagePath, storageKey, file.type, file.size);

    // Handle tags
    if (tagsStr) {
      const tags = tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)');
      const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
      const insertNoteTag = db.prepare('INSERT OR IGNORE INTO note_tags (id, note_id, tag_id) VALUES (?, ?, ?)');

      tags.forEach(tagName => {
        insertTag.run(uuid(), tagName);
        const tag = getTag.get(tagName) as any;
        if (tag) {
          insertNoteTag.run(uuid(), noteId, tag.id);
        }
      });
    }

    // Fulfill note request if present
    if (requestId) {
      db.prepare(`
        UPDATE note_requests 
        SET status = 'fulfilled', 
            fulfilled_by = ?, 
            fulfilled_note_id = ?, 
            fulfilled_at = datetime('now') 
        WHERE id = ?
      `).run(userId, noteId, requestId);
    }

    return successResponse({
      id: noteId,
      status,
      message: status === 'published' ? 'Notunuz başarıyla yayınlandı!' : 'Notunuz incelemeye gönderildi.',
    }, 201);
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}
