import { getServerSession } from 'next-auth';
import { v4 as uuid } from 'uuid';
import { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';
import { isValidPushEndpoint } from '@/lib/push-notifications';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    await ensureDb();
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject = process.env.VAPID_SUBJECT?.trim();

    return successResponse({
      configured: Boolean(publicKey && privateKey && subject),
      publicKey,
    });
  } catch (error) {
    console.error('Push configuration error:', error);
    return errorResponse('Push bildirimi ayarları yüklenemedi.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const body = await request.json() as {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : '';
    const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : '';

    if (
      endpoint.length > 4096
      || !isValidPushEndpoint(endpoint)
      || !p256dh
      || p256dh.length > 512
      || !auth
      || auth.length > 512
    ) {
      return errorResponse('Geçersiz push aboneliği.', 400);
    }

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    db.prepare(`
      INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `).run(uuid(), userId, endpoint, p256dh, auth);

    return successResponse({ message: 'Push bildirimleri açıldı.' });
  } catch (error) {
    console.error('Push subscription error:', error);
    return errorResponse('Push bildirimi açılamadı.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const body = await request.json() as { endpoint?: unknown };
    const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
    if (endpoint.length > 4096 || !isValidPushEndpoint(endpoint)) {
      return errorResponse('Geçersiz push aboneliği.', 400);
    }

    const db = await ensureDb();
    const userId = (session.user as { id: string }).id;
    db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?')
      .run(endpoint, userId);

    return successResponse({ message: 'Push bildirimleri kapatıldı.' });
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return errorResponse('Push bildirimi kapatılamadı.', 500);
  }
}
