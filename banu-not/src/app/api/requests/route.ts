import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const db = await ensureDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.display_name as user_display_name, u.avatar_url,
             fu.display_name as fulfilled_by_name,
             n.title as fulfilled_note_title
      FROM note_requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users fu ON r.fulfilled_by = fu.id
      LEFT JOIN notes n ON r.fulfilled_note_id = n.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const requests = db.prepare(query).all(status, limit, offset);
    return successResponse(requests);
  } catch (error) {
    console.error('Fetch requests error:', error);
    return errorResponse('İstekler yüklenemedi.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);

    const db = await ensureDb();
    const userId = (session.user as any).id;
    const body = await request.json();
    const { title, description } = body;

    if (!title || title.trim().length < 3) {
      return errorResponse('Geçerli bir başlık giriniz.');
    }

    db.prepare(`
      INSERT INTO note_requests (id, user_id, title, description)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), userId, title.trim(), description?.trim() || null);

    return successResponse({ message: 'İsteğiniz başarıyla eklendi.' });
  } catch (error) {
    console.error('Create request error:', error);
    return errorResponse('İstek oluşturulurken hata oluştu.', 500);
  }
}
