import { createHash, randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';
import { isMailConfigured, sendVerificationEmail } from '@/lib/mail';

const GENERIC_RESPONSE = 'Hesap mevcutsa doğrulama bağlantısı gönderilir.';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@ogr\.bandirma\.edu\.tr$/.test(email)) {
      return errorResponse('Geçerli bir @ogr.bandirma.edu.tr e-posta adresi girin.');
    }
    if (!isMailConfigured()) {
      return errorResponse('E-posta gönderimi şu anda yapılandırılmamış.', 503);
    }

    const db = await ensureDb();
    const user = db.prepare(`
      SELECT id, is_email_verified, email_verification_sent_at
      FROM users
      WHERE email = ?
    `).get(email) as
      | { id: string; is_email_verified: number; email_verification_sent_at: string | null }
      | undefined;

    if (!user || user.is_email_verified) return successResponse({ message: GENERIC_RESPONSE });

    const lastSentAt = user.email_verification_sent_at
      ? Date.parse(`${user.email_verification_sent_at.replace(' ', 'T')}Z`)
      : Number.NaN;
    if (Number.isFinite(lastSentAt) && Date.now() - lastSentAt < 60_000) {
      return successResponse({ message: GENERIC_RESPONSE });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      UPDATE users
      SET email_verify_token = ?, email_verify_expires = ?, email_verification_sent_at = datetime('now')
      WHERE id = ? AND is_email_verified = 0
    `).run(tokenHash, expires, user.id);

    try {
      await sendVerificationEmail(email, token);
    } catch (error) {
      console.error('Resend verification email error:', error);
      return errorResponse('Doğrulama e-postası şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin.', 503);
    }

    return successResponse({ message: GENERIC_RESPONSE });
  } catch (error) {
    console.error('Resend verification request error:', error);
    return errorResponse('Doğrulama e-postası istenirken hata oluştu.', 500);
  }
}
