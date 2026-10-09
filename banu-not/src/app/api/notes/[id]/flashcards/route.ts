import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };
type ReviewRow = { card_index: number; repetitions: number; interval_days: number; next_review_at: string };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Tekrar planını görmek için giriş yapmalısınız.', 401);
    const { id: noteId } = await params;
    const db = await ensureDb();
    const rows = db.prepare(`
      SELECT card_index, repetitions, interval_days, next_review_at
      FROM flashcard_reviews WHERE user_id = ? AND note_id = ?
    `).all((session.user as SessionUser).id, noteId) as ReviewRow[];
    return successResponse(rows);
  } catch (error) {
    console.error('Flashcard review GET error:', error);
    return errorResponse('Kart tekrar bilgileri alınamadı.', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Kartları tekrar planlamak için giriş yapmalısınız.', 401);
    const { id: noteId } = await params;
    const body = await request.json() as { cardIndex?: unknown; quality?: unknown };
    if (!Number.isInteger(body.cardIndex) || Number(body.cardIndex) < 0 || Number(body.cardIndex) > 100) return errorResponse('Kart numarası geçersiz.');
    if (!Number.isInteger(body.quality) || Number(body.quality) < 0 || Number(body.quality) > 3) return errorResponse('Değerlendirme 0-3 arasında olmalıdır.');

    const db = await ensureDb();
    const analysis = db.prepare('SELECT flashcards FROM note_ai_analysis WHERE note_id = ?').get(noteId) as { flashcards: string | null } | undefined;
    let cards: unknown;
    try {
      cards = JSON.parse(analysis?.flashcards || '[]');
    } catch {
      return errorResponse('Notun kart verisi okunamadı.', 500);
    }
    if (!Array.isArray(cards) || Number(body.cardIndex) >= cards.length) return errorResponse('Kart bulunamadı.', 404);

    const userId = (session.user as SessionUser).id;
    const index = Number(body.cardIndex);
    const quality = Number(body.quality);
    const previous = db.prepare(`
      SELECT repetitions, interval_days, ease_factor FROM flashcard_reviews
      WHERE user_id = ? AND note_id = ? AND card_index = ?
    `).get(userId, noteId, index) as { repetitions: number; interval_days: number; ease_factor: number } | undefined;
    const repetitions = quality < 2 ? 0 : (previous?.repetitions ?? 0) + 1;
    const intervalDays = quality < 2
      ? 1
      : repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.max(1, Math.round((previous?.interval_days || 6) * (previous?.ease_factor || 2.5)));
    const easeFactor = Math.max(1.3, (previous?.ease_factor || 2.5) + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
    const reviewedAt = new Date();
    const dueAt = new Date(reviewedAt.getTime() + intervalDays * 86_400_000).toISOString();

    db.prepare(`
      INSERT INTO flashcard_reviews (user_id, note_id, card_index, repetitions, interval_days, ease_factor, next_review_at, last_reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, note_id, card_index) DO UPDATE SET
        repetitions = excluded.repetitions, interval_days = excluded.interval_days,
        ease_factor = excluded.ease_factor, next_review_at = excluded.next_review_at,
        last_reviewed_at = excluded.last_reviewed_at
    `).run(userId, noteId, index, repetitions, intervalDays, easeFactor, dueAt, reviewedAt.toISOString());
    return successResponse({ cardIndex: index, repetitions, intervalDays, nextReviewAt: dueAt });
  } catch (error) {
    console.error('Flashcard review POST error:', error);
    return errorResponse('Kart tekrar kaydedilemedi.', 500);
  }
}
