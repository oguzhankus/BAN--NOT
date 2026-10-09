import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { v4 as uuid } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authOptions } from '@/lib/auth';
import { ensureDb, errorResponse, successResponse } from '@/lib/api-utils';

type SessionUser = { id: string };
type NoteContext = { title: string; description: string | null; topic: string | null };
type HistoryRow = { role: 'user' | 'assistant'; content: string };

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Sohbet geçmişi için giriş yapmalısınız.', 401);
    const { id: noteId } = await params;
    const db = await ensureDb();
    const history = db.prepare(`
      SELECT role, content FROM note_ai_chat
      WHERE user_id = ? AND note_id = ?
      ORDER BY created_at DESC LIMIT 30
    `).all((session.user as SessionUser).id, noteId) as HistoryRow[];
    return successResponse(history.reverse());
  } catch (error) {
    console.error('Note chat GET error:', error);
    return errorResponse('Sohbet geçmişi yüklenemedi.', 500);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Bu not hakkında soru sormak için giriş yapmalısınız.', 401);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return errorResponse('AI sohbeti şu anda yapılandırılmamış.', 503);
    const { id: noteId } = await params;
    const body = await request.json() as { message?: unknown };
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (message.length < 2 || message.length > 1500) return errorResponse('Mesaj 2-1500 karakter olmalıdır.');

    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const note = db.prepare(`
      SELECT title, description, topic FROM notes WHERE id = ? AND status = 'published'
    `).get(noteId) as NoteContext | undefined;
    if (!note) return errorResponse('Not bulunamadı.', 404);

    const recentCount = db.prepare(`
      SELECT COUNT(*) as count FROM note_ai_chat
      WHERE user_id = ? AND created_at >= datetime('now', '-1 minute')
    `).get(userId) as { count: number };
    if (recentCount.count >= 8) return errorResponse('Çok hızlı mesaj gönderiyorsunuz. Biraz bekleyip tekrar deneyin.', 429);

    const summary = db.prepare('SELECT summary FROM note_ai_analysis WHERE note_id = ?').get(noteId) as { summary: string | null } | undefined;
    const context = `Başlık: ${note.title}\nKonu: ${note.topic || 'Belirtilmemiş'}\nAçıklama: ${note.description || 'Yok'}\nYapay zeka özeti: ${summary?.summary || 'Henüz oluşturulmamış'}`;
    const previous = db.prepare(`
      SELECT role, content FROM note_ai_chat
      WHERE user_id = ? AND note_id = ?
      ORDER BY created_at DESC LIMIT 8
    `).all(userId, noteId).reverse() as HistoryRow[];
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: previous.map(item => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content }] })),
      systemInstruction: `Sen BANÜ NOT içindeki bir çalışma yardımcısısın. Öncelikle aşağıdaki not bilgisine dayanarak doğru, kısa ve öğretici Türkçe yanıt ver. Bilgi notta yoksa bunu açıkça belirt; kesin olmayan bilgiyi uydurma. Not bağlamı:\n${context}`,
    });
    const answer = (await chat.sendMessage(message)).response.text().trim();
    if (!answer) return errorResponse('AI yanıt üretemedi. Lütfen tekrar deneyin.', 502);
    const insert = db.prepare(`
      INSERT INTO note_ai_chat (id, user_id, note_id, role, content) VALUES (?, ?, ?, ?, ?)
    `);
    const saveMessages = db.transaction(() => {
      insert.run(uuid(), userId, noteId, 'user', message);
      insert.run(uuid(), userId, noteId, 'assistant', answer);
    });
    saveMessages();
    return successResponse({ answer });
  } catch (error) {
    console.error('Note chat POST error:', error);
    return errorResponse('AI sohbeti sırasında bir hata oluştu.', 500);
  }
}
