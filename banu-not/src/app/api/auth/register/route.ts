import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

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

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, university_id, faculty_id, department_id, class_year, is_email_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(id, normalizedEmail, passwordHash, displayName.trim(), universityId || null, facultyId || null, departmentId || null, classYear || null);

    return successResponse({ message: 'Hesabınız başarıyla oluşturuldu. Giriş yapabilirsiniz.' }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}
