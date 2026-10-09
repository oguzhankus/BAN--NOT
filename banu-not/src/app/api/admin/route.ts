import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

const REPORT_STATUSES = ['pending', 'reviewing', 'resolved', 'dismissed'] as const;
const NOTE_STATUSES = ['published', 'pending_review', 'rejected', 'removed'] as const;
const FACULTY_TYPES = ['faculty', 'institute', 'vocational_school', 'conservatory'] as const;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function countRows(db: Awaited<ReturnType<typeof ensureDb>>, sql: string) {
  return (db.prepare(sql).get() as { c: number }).c;
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const sessionUser = session.user as typeof session.user & { id: string; role?: string };
  const role = sessionUser.role;
  if (role !== 'admin' && role !== 'moderator') return null;
  return { id: sessionUser.id, role };
}

function writeAuditLog(
  db: Awaited<ReturnType<typeof ensureDb>>,
  adminId: string,
  action: string,
  target: string,
  targetId: string,
  details?: string | null
) {
  db.prepare('INSERT INTO audit_logs (id, user_id, action, target, target_id, details) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuid(), adminId, action, target, targetId, details || null);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return errorResponse('Yetkiniz yok.', 403);

    const db = await ensureDb();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'dashboard';
    if (admin.role !== 'admin' && ['users', 'catalog', 'settings'].includes(section)) {
      return errorResponse('Bu bölüme erişim için yönetici yetkisi gereklidir.', 403);
    }

    switch (section) {
      case 'dashboard': {
        const stats = {
          totalUsers: countRows(db, 'SELECT COUNT(*) as c FROM users'),
          activeUsers: countRows(db, 'SELECT COUNT(*) as c FROM users WHERE is_active = 1 AND is_banned = 0'),
          totalNotes: countRows(db, "SELECT COUNT(*) as c FROM notes WHERE status != 'removed'"),
          publishedNotes: countRows(db, "SELECT COUNT(*) as c FROM notes WHERE status = 'published'"),
          totalDownloads: countRows(db, 'SELECT COALESCE(SUM(download_count), 0) as c FROM notes'),
          pendingReports: countRows(db, "SELECT COUNT(*) as c FROM reports WHERE status = 'pending'"),
          pendingNotes: countRows(db, "SELECT COUNT(*) as c FROM notes WHERE status = 'pending_review'"),
          recentUsers: countRows(db, "SELECT COUNT(*) as c FROM users WHERE created_at >= datetime('now', '-7 days')"),
          recentNotes: db.prepare(`
            SELECT n.*, u.display_name as user_display_name, c.name as course_name
            FROM notes n JOIN users u ON n.user_id = u.id
            LEFT JOIN courses c ON c.id = n.course_id
            ORDER BY n.created_at DESC LIMIT 5
          `).all(),
          popularNotes: db.prepare(`
            SELECT n.id, n.title, n.download_count, n.view_count
            FROM notes n WHERE n.status = 'published'
            ORDER BY n.download_count DESC, n.view_count DESC LIMIT 5
          `).all(),
          dailyUploads: db.prepare(`
            SELECT date(created_at) as day, COUNT(*) as total
            FROM notes WHERE created_at >= date('now', '-6 days')
            GROUP BY date(created_at) ORDER BY day
          `).all(),
        };
        return successResponse(stats);
      }

      case 'notes': {
        const requestedStatus = searchParams.get('status') || '';
        const status = NOTE_STATUSES.includes(requestedStatus as typeof NOTE_STATUSES[number]) ? requestedStatus : '';
        const query = cleanText(searchParams.get('q'), 120);
        const page = parsePositiveInt(searchParams.get('page'), 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const conditions = ["n.status != 'removed'"];
        const params: (string | number)[] = [];
        if (status) {
          conditions[0] = 'n.status = ?';
          params.push(status);
        }
        if (query) {
          conditions.push('(n.title LIKE ? COLLATE NOCASE OR u.display_name LIKE ? COLLATE NOCASE OR n.course_code LIKE ? COLLATE NOCASE)');
          const term = `%${query}%`;
          params.push(term, term, term);
        }
        const where = `WHERE ${conditions.join(' AND ')}`;

        const total = (db.prepare(`
          SELECT COUNT(*) as c FROM notes n
          JOIN users u ON n.user_id = u.id
          ${where}
        `).get(...params) as { c: number }).c;
        const notes = db.prepare(`
          SELECT n.*, u.display_name as user_display_name, u.email as user_email, c.name as course_name
          FROM notes n JOIN users u ON n.user_id = u.id
          LEFT JOIN courses c ON c.id = n.course_id
          ${where}
          ORDER BY n.created_at DESC LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return successResponse({ notes, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
      }

      case 'reports': {
        const requestedStatus = searchParams.get('status') || 'pending';
        if (!REPORT_STATUSES.includes(requestedStatus as typeof REPORT_STATUSES[number])) {
          return errorResponse('Geçersiz rapor durumu.');
        }
        const reports = db.prepare(`
          SELECT r.*, n.title as note_title, u.display_name as reporter_name, c.content as comment_content
          FROM reports r
          LEFT JOIN notes n ON r.note_id = n.id
          JOIN users u ON r.user_id = u.id
          LEFT JOIN comments c ON r.target_type = 'comment' AND r.target_id = c.id
          WHERE r.status = ?
          ORDER BY r.created_at DESC
        `).all(requestedStatus);
        return successResponse(reports);
      }

      case 'users': {
        const page = parsePositiveInt(searchParams.get('page'), 1);
        const query = cleanText(searchParams.get('q'), 120);
        const limit = 20;
        const offset = (page - 1) * limit;
        const where = query ? 'WHERE display_name LIKE ? COLLATE NOCASE OR email LIKE ? COLLATE NOCASE' : '';
        const params = query ? [`%${query}%`, `%${query}%`] : [];
        const total = (db.prepare(`SELECT COUNT(*) as c FROM users ${where}`).get(...params) as { c: number }).c;
        const users = db.prepare(`
          SELECT id, email, display_name, role, is_active, is_banned, created_at,
            (SELECT COUNT(*) FROM notes WHERE user_id = users.id) as note_count
          FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
        `).all(...params, limit, offset);
        return successResponse({ users, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
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

      case 'requests': {
        const requests = db.prepare(`
          SELECT r.*, u.display_name as user_display_name, n.title as fulfilled_note_title
          FROM note_requests r
          LEFT JOIN users u ON r.user_id = u.id
          LEFT JOIN notes n ON n.id = r.fulfilled_note_id
          ORDER BY r.created_at DESC
        `).all();
        return successResponse({ requests });
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
    const adminOnlyActions = ['ban_user', 'set_user_active', 'update_setting', 'add_faculty', 'add_department', 'add_course'];
    if (admin.role !== 'admin' && adminOnlyActions.includes(action)) {
      return errorResponse('Bu işlem için yönetici yetkisi gereklidir.', 403);
    }

    switch (action) {
      case 'moderate_note': {
        const noteId = cleanText(body.noteId, 100);
        const status = body.status;
        const reason = cleanText(body.reason, 500);
        if (!noteId || !NOTE_STATUSES.includes(status)) return errorResponse('Geçersiz not veya durum bilgisi.');
        const note = db.prepare('SELECT user_id, title FROM notes WHERE id = ?').get(noteId) as
          | { user_id: string; title: string }
          | undefined;
        if (!note) return errorResponse('Not bulunamadı.', 404);

        const update = db.transaction(() => {
          db.prepare(`UPDATE notes SET status = ?, rejection_reason = ?, updated_at = datetime('now') WHERE id = ?`)
            .run(status, status === 'rejected' ? reason || null : null, noteId);

          const msgMap: Partial<Record<typeof status, string>> = {
            published: `"${note.title}" başlıklı notunuz onaylandı ve yayınlandı.`,
            rejected: `"${note.title}" başlıklı notunuz reddedildi. Neden: ${reason || 'Belirtilmedi'}`,
            removed: `"${note.title}" başlıklı notunuz kaldırıldı.`,
          };
          const message = msgMap[status];
          if (message) {
            db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
              .run(uuid(), note.user_id, `note_${status}`, 'Not Durumu Güncellendi', message, `/not/${noteId}`);
          }
          writeAuditLog(db, admin.id, `note_${status}`, 'note', noteId, reason || null);
        });
        update();

        return successResponse({ message: 'Not durumu güncellendi.' });
      }

      case 'resolve_report': {
        const reportId = cleanText(body.reportId, 100);
        const resolution = cleanText(body.resolution, 500);
        const noteAction = body.noteAction;
        if (!reportId) return errorResponse('Rapor ID gerekli.');
        if (noteAction && !NOTE_STATUSES.includes(noteAction)) return errorResponse('Geçersiz içerik işlemi.');
        const report = db.prepare('SELECT note_id, target_type, target_id, status FROM reports WHERE id = ?').get(reportId) as
          | { note_id: string | null; target_type: string; target_id: string; status: string }
          | undefined;
        if (!report) return errorResponse('Rapor bulunamadı.', 404);
        if (!['pending', 'reviewing'].includes(report.status)) return errorResponse('Bu rapor daha önce sonuçlandırılmış.', 409);
        if (noteAction && report.target_type === 'comment' && noteAction !== 'removed') {
          return errorResponse('Yorum raporlarında yalnızca kaldırma işlemi uygulanabilir.');
        }

        const resolve = db.transaction(() => {
          db.prepare(`UPDATE reports SET status = 'resolved', resolution = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?`)
            .run(resolution || null, admin.id, reportId);
          if (noteAction === 'removed' && report.target_type === 'comment') {
            db.prepare('DELETE FROM comments WHERE id = ?').run(report.target_id);
          } else if (noteAction && report.note_id) {
            db.prepare(`UPDATE notes SET status = ?, updated_at = datetime('now') WHERE id = ?`)
              .run(noteAction, report.note_id);
          }
          writeAuditLog(db, admin.id, 'report_resolved', 'report', reportId, resolution || null);
        });
        resolve();

        return successResponse({ message: 'Rapor çözümlendi.' });
      }

      case 'dismiss_report': {
        const reportId = cleanText(body.reportId, 100);
        if (!reportId) return errorResponse('Rapor ID gerekli.');
        const report = db.prepare('SELECT status FROM reports WHERE id = ?').get(reportId) as { status: string } | undefined;
        if (!report) return errorResponse('Rapor bulunamadı.', 404);
        if (!['pending', 'reviewing'].includes(report.status)) return errorResponse('Bu rapor daha önce sonuçlandırılmış.', 409);
        db.prepare(`UPDATE reports SET status = 'dismissed', resolved_by = ?, resolved_at = datetime('now') WHERE id = ?`)
          .run(admin.id, reportId);
        writeAuditLog(db, admin.id, 'report_dismissed', 'report', reportId);
        return successResponse({ message: 'Rapor reddedildi.' });
      }

      case 'review_report': {
        const reportId = cleanText(body.reportId, 100);
        if (!reportId) return errorResponse('Rapor ID gerekli.');
        const result = db.prepare("UPDATE reports SET status = 'reviewing' WHERE id = ? AND status = 'pending'").run(reportId);
        if (!result.changes) return errorResponse('Bekleyen rapor bulunamadı.', 404);
        writeAuditLog(db, admin.id, 'report_reviewing', 'report', reportId);
        return successResponse({ message: 'Rapor incelemeye alındı.' });
      }

      case 'ban_user': {
        const userId = cleanText(body.userId, 100);
        const ban = body.ban;
        if (!userId || typeof ban !== 'boolean') return errorResponse('Kullanıcı ve engelleme durumu gerekli.');
        if (userId === admin.id) return errorResponse('Kendinizi engelleyemezsiniz.');
        const target = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
        if (!target) return errorResponse('Kullanıcı bulunamadı.', 404);
        if (target.role === 'admin' || (target.role === 'moderator' && admin.role !== 'admin')) {
          return errorResponse('Bu kullanıcı için işlem yapma yetkiniz yok.', 403);
        }
        db.prepare('UPDATE users SET is_banned = ?, updated_at = datetime(\'now\') WHERE id = ?').run(ban ? 1 : 0, userId);
        writeAuditLog(db, admin.id, ban ? 'user_banned' : 'user_unbanned', 'user', userId);
        return successResponse({ message: ban ? 'Kullanıcı engellendi.' : 'Kullanıcı engeli kaldırıldı.' });
      }

      case 'set_user_active': {
        const userId = cleanText(body.userId, 100);
        const active = body.active;
        if (!userId || typeof active !== 'boolean') return errorResponse('Kullanıcı ve hesap durumu gerekli.');
        if (userId === admin.id) return errorResponse('Kendi hesabınızın durumunu değiştiremezsiniz.');
        const target = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
        if (!target) return errorResponse('Kullanıcı bulunamadı.', 404);
        if (target.role === 'admin') return errorResponse('Yönetici hesabı pasifleştirilemez.', 403);
        db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(active ? 1 : 0, userId);
        writeAuditLog(db, admin.id, active ? 'user_activated' : 'user_deactivated', 'user', userId);
        return successResponse({ message: active ? 'Kullanıcı hesabı etkinleştirildi.' : 'Kullanıcı hesabı pasifleştirildi.' });
      }

      case 'update_setting': {
        const key = cleanText(body.key, 100);
        const value = typeof body.value === 'string' ? body.value : '';
        const setting = db.prepare('SELECT type FROM site_settings WHERE key = ?').get(key) as { type: string } | undefined;
        if (!setting) return errorResponse('Ayar bulunamadı.', 404);
        if (setting.type === 'boolean' && !['true', 'false'].includes(value)) {
          return errorResponse('Bu ayar açık veya kapalı olarak güncellenebilir.');
        }
        if (setting.type === 'number' && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)) {
          return errorResponse('Sayı ayarı 1 ile 100 arasında olmalıdır.');
        }
        if (value.length > 500) return errorResponse('Ayar değeri çok uzun.');
        const result = db.prepare("UPDATE site_settings SET value = ?, updated_at = datetime('now') WHERE key = ?").run(value, key);
        if (!result.changes) return errorResponse('Ayar güncellenemedi.', 500);
        writeAuditLog(db, admin.id, 'setting_updated', 'setting', key, value);
        return successResponse({ message: 'Ayar güncellendi.' });
      }

      case 'update_request_status': {
        const requestId = cleanText(body.requestId, 100);
        const status = body.status;
        if (!requestId || !['open', 'closed'].includes(status)) {
          return errorResponse('İstek ve geçerli durum gerekli.');
        }
        const result = db.prepare("UPDATE note_requests SET status = ?, updated_at = datetime('now') WHERE id = ?")
          .run(status, requestId);
        if (!result.changes) return errorResponse('İstek bulunamadı.', 404);
        writeAuditLog(db, admin.id, `request_${status}`, 'note_request', requestId);
        return successResponse({ message: status === 'open' ? 'İstek yeniden açıldı.' : 'İstek kapatıldı.' });
      }

      case 'delete_request': {
        const requestId = cleanText(body.requestId, 100);
        if (!requestId) return errorResponse('İstek ID gerekli.');
        const result = db.prepare('DELETE FROM note_requests WHERE id = ?').run(requestId);
        if (!result.changes) return errorResponse('İstek bulunamadı.', 404);
        writeAuditLog(db, admin.id, 'request_deleted', 'note_request', requestId);
        return successResponse({ message: 'İstek silindi.' });
      }

      case 'add_faculty': {
        const name = cleanText(body.name, 120);
        const universityId = cleanText(body.universityId, 100);
        const type = body.type || 'faculty';
        if (name.length < 2 || !universityId) return errorResponse('Geçerli fakülte adı ve üniversite gerekli.');
        if (!FACULTY_TYPES.includes(type)) return errorResponse('Geçersiz fakülte türü.');
        if (!db.prepare('SELECT id FROM universities WHERE id = ?').get(universityId)) {
          return errorResponse('Üniversite bulunamadı.', 404);
        }
        if (db.prepare('SELECT id FROM faculties WHERE university_id = ? AND name = ?').get(universityId, name)) {
          return errorResponse('Bu fakülte zaten kayıtlı.', 409);
        }
        db.prepare('INSERT INTO faculties (id, name, university_id, type) VALUES (?, ?, ?, ?)')
          .run(uuid(), name, universityId, type);
        writeAuditLog(db, admin.id, 'faculty_created', 'university', universityId, name);
        return successResponse({ message: 'Fakülte eklendi.' });
      }

      case 'add_department': {
        const name = cleanText(body.name, 120);
        const facultyId = cleanText(body.facultyId, 100);
        if (name.length < 2 || !facultyId) return errorResponse('Geçerli bölüm adı ve fakülte gerekli.');
        if (!db.prepare('SELECT id FROM faculties WHERE id = ?').get(facultyId)) {
          return errorResponse('Fakülte bulunamadı.', 404);
        }
        if (db.prepare('SELECT id FROM departments WHERE faculty_id = ? AND name = ?').get(facultyId, name)) {
          return errorResponse('Bu bölüm zaten kayıtlı.', 409);
        }
        db.prepare('INSERT INTO departments (id, name, faculty_id) VALUES (?, ?, ?)')
          .run(uuid(), name, facultyId);
        writeAuditLog(db, admin.id, 'department_created', 'faculty', facultyId, name);
        return successResponse({ message: 'Bölüm eklendi.' });
      }

      case 'add_course': {
        const name = cleanText(body.name, 120);
        const code = cleanText(body.code, 30);
        const universityId = cleanText(body.universityId, 100);
        const rawDepartmentIds: unknown[] = Array.isArray(body.departmentIds) ? body.departmentIds : [];
        const departmentIds: string[] = [...new Set(rawDepartmentIds.filter((id): id is string => typeof id === 'string'))];
        if (name.length < 2 || !universityId) return errorResponse('Geçerli ders adı ve üniversite gerekli.');
        const university = db.prepare('SELECT id FROM universities WHERE id = ?').get(universityId);
        if (!university) return errorResponse('Üniversite bulunamadı.', 404);
        if (departmentIds.length) {
          const placeholders = departmentIds.map(() => '?').join(', ');
          const departments = db.prepare(`
            SELECT d.id FROM departments d
            JOIN faculties f ON f.id = d.faculty_id
            WHERE d.id IN (${placeholders}) AND f.university_id = ?
          `).all(...departmentIds, universityId) as { id: string }[];
          if (departments.length !== departmentIds.length) {
            return errorResponse('Seçilen bölümler bu üniversiteye ait değil.');
          }
        }
        const courseId = uuid();
        const createCourse = db.transaction(() => {
          db.prepare('INSERT INTO courses (id, name, code, university_id) VALUES (?, ?, ?, ?)')
            .run(courseId, name, code || null, universityId);
          const insertCourseDepartment = db.prepare('INSERT INTO course_departments (id, course_id, department_id) VALUES (?, ?, ?)');
          departmentIds.forEach((departmentId: string) => {
            insertCourseDepartment.run(uuid(), courseId, departmentId);
          });
          writeAuditLog(db, admin.id, 'course_created', 'course', courseId, name);
        });
        createCourse();
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
