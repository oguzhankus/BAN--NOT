import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'moderator') return null;
  return session.user as any;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return errorResponse('Yetkiniz yok.', 403);

    const db = await ensureDb();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'dashboard';

    switch (section) {
      case 'dashboard': {
        const stats = {
          totalUsers: (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c,
          totalNotes: (db.prepare("SELECT COUNT(*) as c FROM notes WHERE status != 'removed'").get() as any).c,
          totalDownloads: (db.prepare('SELECT SUM(download_count) as c FROM notes').get() as any).c || 0,
          pendingReports: (db.prepare("SELECT COUNT(*) as c FROM reports WHERE status = 'pending'").get() as any).c,
          pendingNotes: (db.prepare("SELECT COUNT(*) as c FROM notes WHERE status = 'pending_review'").get() as any).c,
          recentNotes: db.prepare(`
            SELECT n.*, u.display_name as user_display_name
            FROM notes n JOIN users u ON n.user_id = u.id
            ORDER BY n.created_at DESC LIMIT 5
          `).all(),
        };
        return successResponse(stats);
      }

      case 'notes': {
        const status = searchParams.get('status') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;

        let where = "WHERE n.status != 'removed'";
        const params: any[] = [];
        if (status) {
          where = 'WHERE n.status = ?';
          params.push(status);
        }

        const total = (db.prepare(`SELECT COUNT(*) as c FROM notes n ${where}`).get(...params) as any).c;
        const notes = db.prepare(`
          SELECT n.*, u.display_name as user_display_name, u.email as user_email
          FROM notes n JOIN users u ON n.user_id = u.id
          ${where}
          ORDER BY n.created_at DESC LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return successResponse({ notes, total, page, totalPages: Math.ceil(total / limit) });
      }

      case 'reports': {
        const status = searchParams.get('status') || 'pending';
        const reports = db.prepare(`
          SELECT r.*, n.title as note_title, u.display_name as reporter_name
          FROM reports r
          JOIN notes n ON r.note_id = n.id
          JOIN users u ON r.user_id = u.id
          WHERE r.status = ?
          ORDER BY r.created_at DESC
        `).all(status);
        return successResponse(reports);
      }

      case 'users': {
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;
        const total = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
        const users = db.prepare(`
          SELECT id, email, display_name, role, is_active, is_banned, created_at,
            (SELECT COUNT(*) FROM notes WHERE user_id = users.id) as note_count
          FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(limit, offset);
        return successResponse({ users, total, page, totalPages: Math.ceil(total / limit) });
      }

      case 'catalog': {
        const universities = db.prepare('SELECT * FROM universities ORDER BY sort_order, name').all();
        const faculties = db.prepare('SELECT * FROM faculties ORDER BY sort_order, name').all();
        const departments = db.prepare('SELECT * FROM departments ORDER BY sort_order, name').all();
        const courses = db.prepare(`
          SELECT c.*, GROUP_CONCAT(cd.department_id) as dept_ids
          FROM courses c
          LEFT JOIN course_departments cd ON c.id = cd.course_id
          GROUP BY c.id
          ORDER BY c.code, c.name
        `).all();
        return successResponse({ universities, faculties, departments, courses });
      }

      case 'settings': {
        const settings = db.prepare('SELECT * FROM site_settings ORDER BY key').all();
        return successResponse(settings);
      }

      default:
        return errorResponse('Geçersiz bölüm.');
    }
  } catch (error) {
    console.error('Admin GET error:', error);
    return errorResponse('Veri yüklenirken hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return errorResponse('Yetkiniz yok.', 403);

    const db = await ensureDb();
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'moderate_note': {
        const { noteId, status, reason } = body;
        if (!noteId || !status) return errorResponse('Eksik bilgi.');
        db.prepare(`UPDATE notes SET status = ?, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`)
          .run(status, reason || null, noteId);
        
        // Create notification for note owner
        const note = db.prepare('SELECT user_id, title FROM notes WHERE id = ?').get(noteId) as any;
        if (note) {
          const msgMap: Record<string, string> = {
            published: `"${note.title}" başlıklı notunuz onaylandı ve yayınlandı.`,
            rejected: `"${note.title}" başlıklı notunuz reddedildi. Neden: ${reason || 'Belirtilmedi'}`,
            removed: `"${note.title}" başlıklı notunuz kaldırıldı.`,
          };
          if (msgMap[status]) {
            db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
              .run(uuid(), note.user_id, `note_${status}`, 'Not Durumu Güncellendi', msgMap[status], `/not/${noteId}`);
          }
        }

        db.prepare('INSERT INTO audit_logs (id, user_id, action, target, target_id, details) VALUES (?, ?, ?, ?, ?, ?)')
          .run(uuid(), admin.id, `note_${status}`, 'note', noteId, reason || null);

        return successResponse({ message: 'Not durumu güncellendi.' });
      }

      case 'resolve_report': {
        const { reportId, resolution, noteAction } = body;
        if (!reportId) return errorResponse('Rapor ID gerekli.');
        
        db.prepare(`UPDATE reports SET status = 'resolved', resolution = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?`)
          .run(resolution || null, admin.id, reportId);

        if (noteAction) {
          const report = db.prepare('SELECT note_id FROM reports WHERE id = ?').get(reportId) as any;
          if (report) {
            db.prepare(`UPDATE notes SET status = ?, updated_at = datetime('now') WHERE id = ?`)
              .run(noteAction, report.note_id);
          }
        }

        return successResponse({ message: 'Rapor çözümlendi.' });
      }

      case 'dismiss_report': {
        const { reportId } = body;
        db.prepare(`UPDATE reports SET status = 'dismissed', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?`)
          .run(admin.id, reportId);
        return successResponse({ message: 'Rapor reddedildi.' });
      }

      case 'ban_user': {
        const { userId, ban } = body;
        if (userId === admin.id) return errorResponse('Kendinizi engelleyemezsiniz.');
        db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(ban ? 1 : 0, userId);
        db.prepare('INSERT INTO audit_logs (id, user_id, action, target, target_id) VALUES (?, ?, ?, ?, ?)')
          .run(uuid(), admin.id, ban ? 'user_banned' : 'user_unbanned', 'user', userId);
        return successResponse({ message: ban ? 'Kullanıcı engellendi.' : 'Kullanıcı engeli kaldırıldı.' });
      }

      case 'update_setting': {
        const { key, value } = body;
        db.prepare("UPDATE site_settings SET value = ?, updated_at = datetime('now') WHERE key = ?").run(value, key);
        return successResponse({ message: 'Ayar güncellendi.' });
      }

      case 'add_faculty': {
        const { name, universityId, type } = body;
        if (!name || !universityId) return errorResponse('Ad ve üniversite gerekli.');
        db.prepare('INSERT INTO faculties (id, name, university_id, type) VALUES (?, ?, ?, ?)')
          .run(uuid(), name.trim(), universityId, type || 'faculty');
        return successResponse({ message: 'Fakülte eklendi.' });
      }

      case 'add_department': {
        const { name, facultyId } = body;
        if (!name || !facultyId) return errorResponse('Ad ve fakülte gerekli.');
        db.prepare('INSERT INTO departments (id, name, faculty_id) VALUES (?, ?, ?)')
          .run(uuid(), name.trim(), facultyId);
        return successResponse({ message: 'Bölüm eklendi.' });
      }

      case 'add_course': {
        const { name, code, universityId, departmentIds } = body;
        if (!name || !universityId) return errorResponse('Ders adı ve üniversite gerekli.');
        const courseId = uuid();
        db.prepare('INSERT INTO courses (id, name, code, university_id) VALUES (?, ?, ?, ?)')
          .run(courseId, name.trim(), code?.trim() || null, universityId);
        
        if (departmentIds && Array.isArray(departmentIds)) {
          departmentIds.forEach((deptId: string) => {
            db.prepare('INSERT INTO course_departments (id, course_id, department_id) VALUES (?, ?, ?)')
              .run(uuid(), courseId, deptId);
          });
        }
        return successResponse({ message: 'Ders eklendi.' });
      }

      default:
        return errorResponse('Geçersiz işlem.');
    }
  } catch (error) {
    console.error('Admin POST error:', error);
    return errorResponse('İşlem sırasında hata oluştu.', 500);
  }
}
