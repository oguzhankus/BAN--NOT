import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;

    // Join bookmarks with notes to get full note details
    const bookmarkedNotes = db.prepare(`
      SELECT n.*, b.created_at as bookmarked_at,
             (SELECT COUNT(*) FROM bookmarks WHERE note_id = n.id) as bookmark_count,
             u.display_name as user_display_name, u.avatar_url as user_avatar,
             f.short_name as faculty_name, d.short_name as department_name, c.name as course_name
      FROM bookmarks b
      JOIN notes n ON b.note_id = n.id
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      WHERE b.user_id = ? AND n.status = 'published'
      ORDER BY b.created_at DESC
    `).all(userId);

    // Get files for these notes
    if (bookmarkedNotes.length > 0) {
      const noteIds = bookmarkedNotes.map((n: any) => n.id);
      const placeholders = noteIds.map(() => '?').join(',');
      const files = db.prepare(`SELECT id, note_id, original_name, mime_type, file_size FROM note_files WHERE note_id IN (${placeholders})`).all(...noteIds);
      
      const filesByNote = files.reduce((acc: any, file: any) => {
        if (!acc[file.note_id]) acc[file.note_id] = [];
        acc[file.note_id].push(file);
        return acc;
      }, {});

      bookmarkedNotes.forEach((n: any) => {
        n.files = filesByNote[n.id] || [];
      });
    }

    return successResponse(bookmarkedNotes);
  } catch (error) {
    console.error('Bookmarks GET error:', error);
    return errorResponse('Kaydedilenler yüklenirken hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { noteId } = await request.json();

    if (!noteId) return errorResponse('Not ID gerekli.');

    const existing = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?').get(userId, noteId);
    
    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND note_id = ?').run(userId, noteId);
      return successResponse({ bookmarked: false, message: 'Kaydedilenlerden çıkarıldı.' });
    } else {
      db.prepare('INSERT INTO bookmarks (id, user_id, note_id) VALUES (?, ?, ?)').run(uuid(), userId, noteId);
      return successResponse({ bookmarked: true, message: 'Kaydedildi.' });
    }
  } catch (error) {
    console.error('Bookmark error:', error);
    return errorResponse('İşlem sırasında bir hata oluştu.', 500);
  }
}
