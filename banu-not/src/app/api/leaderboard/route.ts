import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();

    // Get top 10 users by number of published notes and total downloads
    const topUsers = db.prepare(`
      SELECT 
        u.id, 
        u.display_name, 
        u.avatar_url,
        u.bio,
        u.created_at,
        COUNT(DISTINCT n.id) as note_count,
        COALESCE(SUM(n.download_count), 0) as total_downloads,
        COALESCE((SELECT SUM(duration_minutes) FROM study_sessions WHERE user_id = u.id), 0) as study_minutes
      FROM users u
      LEFT JOIN notes n ON u.id = n.user_id AND n.status = 'published'
      WHERE u.is_active = 1 AND u.is_banned = 0
      GROUP BY u.id
      HAVING note_count > 0 OR study_minutes > 0
      ORDER BY (total_downloads * 2 + note_count * 10 + study_minutes) DESC
      LIMIT 10
    `).all();

    return successResponse(topUsers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return errorResponse('Liderlik tablosu yüklenirken hata oluştu.', 500);
  }
}
