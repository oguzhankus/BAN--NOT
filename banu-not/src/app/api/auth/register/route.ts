import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { createHash, randomBytes } from 'node:crypto';
import { isMailConfigured, sendVerificationEmail } from '@/lib/mail';

export async function POST(request: NextRequest) {
  try {
    const db = await ensureDb();
    const body = await request.json();
    const { email, password, passwordConfirm, displayName, universityId, facultyId, departmentId, classYear } = body;

    // Validation
    if (!email || !password || !displayName) {
      return errorResponse('E-posta, şifre ve görünen ad zorunludur.');
    }

    if (password.length < 6) {
      return errorResponse('Şifre en az 6 karakter olmalıdır.');
    }

    if (password !== passwordConfirm) {
      return errorResponse('Şifreler eşleşmiyor.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('Geçerli bir e-posta adresi girin.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@ogr.bandirma.edu.tr')) {
      return errorResponse('Sadece @ogr.bandirma.edu.tr uzantılı öğrenci e-postası ile kayıt olabilirsiniz.');
    }

    if (!isMailConfigured()) {
      return errorResponse('Kayıt için e-posta doğrulaması gerekir. Sunucu SMTP ayarları henüz yapılandırılmamış.', 503);
    }

    if (displayName.length < 2 || displayName.length > 50) {
      return errorResponse('Görünen ad 2-50 karakter arasında olmalıdır.');
    }

    // Check existing
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return errorResponse('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
    }

    // Create user
    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO users (
        id, email, password_hash, display_name, university_id, faculty_id,
        department_id, class_year, is_email_verified, email_verify_token,
        email_verify_expires, email_verification_sent_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'))
    `).run(
      id,
      normalizedEmail,
      passwordHash,
      displayName.trim(),
      universityId || null,
      facultyId || null,
      departmentId || null,
      classYear || null,
      verificationTokenHash,
      verificationExpires,
    );

    try {
      await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (error) {
      console.error('Registration verification email error:', error);
      return errorResponse(
        'Hesap oluşturuldu ancak doğrulama e-postası gönderilemedi. SMTP ayarlarını kontrol ettirin veya doğrulama e-postasını yeniden isteyin.',
        503,
      );
    }

    return successResponse({ message: 'Hesap oluşturuldu. Giriş yapmadan önce e-posta adresindeki doğrulama bağlantısını açın.' }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}
