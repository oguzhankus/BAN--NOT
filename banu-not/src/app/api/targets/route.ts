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

    const targets = db.prepare('SELECT target_type, target_value, period FROM user_targets WHERE user_id = ?').all(userId) as any[];

    // Calculate current progress
    // Weekly progress
    const uploads = db.prepare("SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND status = 'published' AND created_at >= date('now', '-7 days')").get(userId) as any;
    
    // We don't have note downloads tracked by user who DOWNLOADED, but we do have `note_downloads` table which tracks `user_id` of downloader.
    const downloads = db.prepare("SELECT COUNT(*) as count FROM note_downloads WHERE user_id = ? AND created_at >= date('now', '-7 days')").get(userId) as any;
    
    const studyTime = db.prepare("SELECT COALESCE(SUM(duration_minutes), 0) as count FROM study_sessions WHERE user_id = ? AND started_at >= date('now', '-7 days')").get(userId) as any;

    const progress = {
      upload: uploads?.count || 0,
      download: downloads?.count || 0,
      study_time: studyTime?.count || 0,
    };

    // Calculate streak
    // A daily streak for study sessions or uploads
    const activityDates = db.prepare(`
      SELECT DISTINCT date(started_at) as act_date FROM study_sessions WHERE user_id = ?
      UNION
      SELECT DISTINCT date(created_at) as act_date FROM notes WHERE user_id = ? AND status = 'published'
      ORDER BY act_date DESC
    `).all(userId, userId) as { act_date: string }[];

    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let expectedDate = new Date(todayStr);

    for (let i = 0; i < activityDates.length; i++) {
      const rowDate = activityDates[i].act_date;
      if (rowDate === expectedDate.toISOString().split('T')[0]) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (i === 0 && rowDate === new Date(expectedDate.getTime() - 86400000).toISOString().split('T')[0]) {
        // If today is missed but yesterday was active, streak still continues
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 2);
      } else {
        break;
      }
    }

    return successResponse({
      targets,
      progress,
      streak
    });
  } catch (error) {
    console.error('Targets GET error:', error);
    return errorResponse('Hedefler yüklenirken hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const body = await request.json();

    const { target_type, target_value } = body;
    if (!['upload', 'download', 'study_time'].includes(target_type)) {
      return errorResponse('Geçersiz hedef türü.', 400);
    }
    
    if (typeof target_value !== 'number' || target_value <= 0) {
      return errorResponse('Geçersiz hedef değeri.', 400);
    }

    // Upsert
    const existing = db.prepare('SELECT id FROM user_targets WHERE user_id = ? AND target_type = ? AND period = ?').get(userId, target_type, 'weekly') as any;
    if (existing) {
      db.prepare('UPDATE user_targets SET target_value = ?, updated_at = datetime("now") WHERE id = ?').run(target_value, existing.id);
    } else {
      db.prepare('INSERT INTO user_targets (id, user_id, target_type, target_value, period) VALUES (?, ?, ?, ?, ?)').run(uuid(), userId, target_type, target_value, 'weekly');
    }

    return successResponse({ message: 'Hedef güncellendi.' });
  } catch (error) {
    console.error('Targets POST error:', error);
    return errorResponse('Hedef güncellenirken hata oluştu.', 500);
  }
}
