import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id } = await params;
    const userId = id;

    const user = db.prepare(`
      SELECT id, display_name, avatar_url, bio, created_at, role, is_email_verified
      FROM users 
      WHERE id = ? AND (profile_public = 1 OR profile_public IS NULL) AND is_banned = 0
    `).get(userId);

    if (!user) {
      // Return 404 or a specific error message if user not found or profile not public
      return errorResponse('Kullanıcı bulunamadı veya profili gizli.', 404);
    }

    const notes = db.prepare(`
      SELECT n.*, 
        u.display_name as user_display_name,
        u.is_email_verified as user_is_email_verified,
        f.name as faculty_name,
        d.name as department_name,
        c.name as course_name,
        nf.file_size, nf.mime_type,
        COALESCE(AVG(r.score), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM notes n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN faculties f ON n.faculty_id = f.id
      LEFT JOIN departments d ON n.department_id = d.id
      LEFT JOIN courses c ON n.course_id = c.id
      LEFT JOIN note_files nf ON nf.note_id = n.id
      LEFT JOIN ratings r ON r.note_id = n.id
      LEFT JOIN comments cm ON cm.note_id = n.id
      WHERE n.user_id = ? AND n.status = 'published'
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `).all(userId);

    const stats = db.prepare(`
      SELECT 
        SUM(download_count) as total_downloads,
        SUM(view_count) as total_views
      FROM notes WHERE user_id = ? AND status = 'published'
    `).get(userId) as any;

    const followStats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count
    `).get(userId, userId) as any;

    let isFollowing = false;
    // We need session to check if current user follows
    const { getServerSession } = require('next-auth');
    const { authOptions } = require('@/lib/auth');
    const session = await getServerSession(authOptions);
    
    if (session?.user) {
       const currentUserId = (session.user as any).id;
       const follow = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').get(currentUserId, userId);
       if (follow) isFollowing = true;
    }

    return successResponse({ 
      user, 
      notes,
      stats: {
        totalDownloads: stats?.total_downloads || 0,
        totalViews: stats?.total_views || 0,
      },
      followInfo: {
        followers: followStats?.followers_count || 0,
        following: followStats?.following_count || 0,
        isFollowing
      }
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return errorResponse('Kullanıcı yüklenirken hata oluştu.', 500);
  }
}
