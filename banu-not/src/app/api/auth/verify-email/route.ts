import { createHash } from 'node:crypto';
import { NextRequest } from 'next/server';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { token?: unknown };
    const token = typeof body.token === 'string' ? body.token : '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return errorResponse('Doğrulama bağlantısı geçersiz veya süresi dolmuş.', 400);
    }

    const db = await ensureDb();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = db.prepare(`
      SELECT id, email_verify_expires
      FROM users
      WHERE email_verify_token = ? AND is_email_verified = 0
    `).get(tokenHash) as { id: string; email_verify_expires: string | null } | undefined;

    if (!user || !user.email_verify_expires || Date.parse(user.email_verify_expires) <= Date.now()) {
      if (user) {
        db.prepare(`
          UPDATE users
          SET email_verify_token = NULL, email_verify_expires = NULL
          WHERE id = ? AND is_email_verified = 0
        `).run(user.id);
      }
      return errorResponse('Doğrulama bağlantısı geçersiz veya süresi dolmuş.', 400);
    }

    const result = db.prepare(`
      UPDATE users
      SET is_email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL
      WHERE id = ? AND email_verify_token = ? AND is_email_verified = 0
    `).run(user.id, tokenHash);

    if (result.changes !== 1) {
      return errorResponse('Bu doğrulama bağlantısı artık kullanılamıyor.', 409);
    }

    return successResponse({ message: 'E-posta adresin doğrulandı. Artık giriş yapabilirsin.' });
  } catch (error) {
    console.error('Email verification error:', error);
    return errorResponse('E-posta doğrulanırken hata oluştu.', 500);
  }
}
