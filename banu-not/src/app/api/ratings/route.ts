import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const { noteId, score } = await request.json();

    if (!noteId) return errorResponse('Not ID gerekli.');
    if (!score || score < 1 || score > 5) return errorResponse('Puan 1-5 arasında olmalıdır.');

    const existing = db.prepare('SELECT id FROM ratings WHERE user_id = ? AND note_id = ?').get(userId, noteId);

    if (existing) {
      db.prepare("UPDATE ratings SET score = ?, updated_at = datetime('now') WHERE user_id = ? AND note_id = ?").run(score, userId, noteId);
    } else {
      db.prepare('INSERT INTO ratings (id, user_id, note_id, score) VALUES (?, ?, ?, ?)').run(uuid(), userId, noteId, score);
    }

    const avg = db.prepare('SELECT AVG(score) as avg, COUNT(*) as count FROM ratings WHERE note_id = ?').get(noteId) as any;

    return successResponse({
      score,
      avgRating: Math.round(avg.avg * 10) / 10,
      ratingCount: avg.count,
      message: 'Puanınız kaydedildi.',
    });
  } catch (error) {
    console.error('Rating error:', error);
    return errorResponse('Puanlama sırasında bir hata oluştu.', 500);
  }
}
