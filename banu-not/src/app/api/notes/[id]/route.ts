import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';
import { sendPushNotification } from '@/lib/push-notifications';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id } = await params;

    const note = db.prepare(`
      SELECT 
        n.*,
        (SELECT COALESCE(MAX(version_number), 0) + 1 FROM note_versions WHERE note_id = n.id) as version_number,
        u.display_name as user_display_name,
        u.is_email_verified as user_is_email_verified,
        u.avatar_url as user_avatar,
        uni.name as university_name,
        f.name as faculty_name,
        d.name as department_name,
        c.name as course_name,
        COALESCE(AVG(r.score), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN universities uni ON n.university_id = uni.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      LEFT JOIN ratings r ON r.note_id = n.id
      LEFT JOIN comments cm ON cm.note_id = n.id AND cm.is_hidden = 0
      WHERE n.id = ?
      GROUP BY n.id
    `).get(id) as any;

    if (!note) {
      return errorResponse('Not bulunamadı.', 404);
    }

    if (note.status !== 'published') {
      const session = await getServerSession(authOptions);
      const user = session?.user as any;
      if (!user || (user.id !== note.user_id && user.role !== 'admin' && user.role !== 'moderator')) {
        return errorResponse('Bu not henüz yayınlanmamış.', 403);
      }
    }

    // Get files
    const files = db.prepare('SELECT * FROM note_files WHERE note_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1').all(id);

    // Get tags
    const tags = db.prepare(`
      SELECT t.name FROM note_tags nt
      JOIN tags t ON nt.tag_id = t.id
      WHERE nt.note_id = ?
    `).all(id) as { name: string }[];

    // Check user first
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.display_name as user_display_name, u.avatar_url as user_avatar,
             (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count,
             EXISTS (SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as user_liked,
             (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote = 1) as helpful_count,
             (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote = -1) as unhelpful_count,
             (SELECT cv.vote FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.user_id = ?) as user_vote
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.note_id = ? AND c.is_hidden = 0
      ORDER BY c.created_at ASC
    `).all(userId || '', userId || '', userId || '', id);

    // Increment view
    db.prepare('UPDATE notes SET view_count = view_count + 1 WHERE id = ?').run(id);

    // Check user bookmark and rating
    let userBookmarked = false;
    let userRating = 0;
    if (userId) {
      const bm = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND note_id = ?').get(userId, id);
      userBookmarked = !!bm;
      const rt = db.prepare('SELECT score FROM ratings WHERE user_id = ? AND note_id = ?').get(userId, id) as any;
      userRating = rt?.score || 0;
    }

    return successResponse({
      ...note,
      files,
      tags: tags.map(t => t.name),
      comments,
      userBookmarked,
      userRating,
    });
  } catch (error) {
    console.error('Note detail error:', error);
    return errorResponse('Not detayı yüklenirken bir hata oluştu.', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Giriş yapmalısınız.', 401);
    }

    const db = await ensureDb();
    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const body = await request.json();

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
    if (!note) return errorResponse('Not bulunamadı.', 404);
    if (note.user_id !== userId && userRole !== 'admin') {
      return errorResponse('Bu notu düzenleme yetkiniz yok.', 403);
    }

    const editableFields = ['title', 'description', 'note_type', 'semester', 'academic_year', 'topic'] as const;
    const snapshot = {
      title: note.title,
      description: note.description,
      note_type: note.note_type,
      semester: note.semester,
      academic_year: note.academic_year,
      topic: note.topic,
      files: db.prepare(`
        SELECT original_name, mime_type, file_size, storage_path
        FROM note_files
        WHERE note_id = ?
        ORDER BY created_at
      `).all(id),
    };
    const updates = editableFields.filter(field => {
      if (body[field] === undefined) return false;
      const value = typeof body[field] === 'string' ? body[field].trim() || null : body[field];
      return value !== (note[field] ?? null);
    });
    if (updates.length === 0) return errorResponse('Güncellenecek bir alan bulunamadı.');

    for (const field of updates) {
      const value = body[field];
      if (value !== null && typeof value !== 'string') {
        return errorResponse('Not alanlarının biçimi geçersiz.');
      }
      if (field === 'title' && (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 200)) {
        return errorResponse('Başlık 3-200 karakter arasında olmalıdır.');
      }
      if (typeof value === 'string' && value.length > (field === 'description' ? 5000 : 200)) {
        return errorResponse('Not alanı izin verilen uzunluğu aşıyor.');
      }
    }

    const updateNote = db.transaction(() => {
      const versionNumber = db.prepare(
        'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM note_versions WHERE note_id = ?'
      ).get(id) as { next_version: number };
      db.prepare(`
        INSERT INTO note_versions (id, note_id, version_number, snapshot_json, changed_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuid(), id, versionNumber.next_version, JSON.stringify(snapshot), userId);

      const assignments = updates.map(field => `${field} = ?`).join(', ');
      const values = updates.map(field => {
        const value = body[field];
        return typeof value === 'string' ? value.trim() || null : value;
      });
      db.prepare(`UPDATE notes SET ${assignments}, updated_at = datetime('now') WHERE id = ?`)
        .run(...values, id);

      const recipients = db.prepare(`
        SELECT DISTINCT user_id
        FROM note_downloads
        WHERE note_id = ? AND user_id != ?
      `).all(id, userId) as { user_id: string }[];
      const insertNotification = db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'note_updated', 'İndirdiğin not güncellendi', ?, ?)
      `);
      for (const recipient of recipients) {
        insertNotification.run(
          uuid(),
          recipient.user_id,
          `"${note.title}" notu v${versionNumber.next_version + 1} olarak güncellendi.`,
          `/not/${id}`,
        );
      }
      return { version: versionNumber.next_version + 1, recipients };
    });

    const { version: newVersion, recipients } = updateNote();
    await Promise.all(recipients.map(recipient => sendPushNotification(db, recipient.user_id, {
      title: 'İndirdiğin not güncellendi',
      body: `"${note.title}" notu v${newVersion} olarak güncellendi.`,
      url: `/not/${id}`,
    })));
    return successResponse({ message: `Not v${newVersion} olarak güncellendi.`, version: newVersion });
  } catch (error) {
    console.error('Note update error:', error);
    return errorResponse('Not güncellenirken bir hata oluştu.', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as any;
    if (!note) return errorResponse('Not bulunamadı.', 404);
    if (note.user_id !== userId && userRole !== 'admin') {
      return errorResponse('Bu notu silme yetkiniz yok.', 403);
    }

    db.prepare("UPDATE notes SET status = 'removed', updated_at = datetime('now') WHERE id = ?").run(id);

    return successResponse({ message: 'Not kaldırıldı.' });
  } catch (error) {
    console.error('Note delete error:', error);
    return errorResponse('Not silinirken bir hata oluştu.', 500);
  }
}
