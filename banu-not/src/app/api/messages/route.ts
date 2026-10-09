import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { sendPushNotification } from '@/lib/push-notifications';

type SessionUser = { id: string };

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);
    
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    
    if (otherUserId) {
      const otherUser = db.prepare('SELECT id as other_user_id, display_name, avatar_url, last_seen FROM users WHERE id = ?').get(otherUserId) as
        | { other_user_id: string; display_name: string; avatar_url: string | null; last_seen: string | null }
        | undefined;
      if (!otherUser) return errorResponse('Kullanıcı bulunamadı.', 404);

      // Get messages for a specific conversation
      const conv = db.prepare(`
        SELECT id FROM conversations 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `).get(userId, otherUserId, otherUserId, userId) as { id: string } | undefined;
      
      if (!conv) return successResponse({ messages: [], otherUser });
      
      // Mark as read
      db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0')
        .run(conv.id, userId);
      
      const messages = db.prepare(`
        SELECT * FROM messages 
        WHERE conversation_id = ? 
        ORDER BY created_at ASC
      `).all(conv.id);
      
      return successResponse({ messages, otherUser });
    }
    
    // Otherwise, list conversations
    const conversations = db.prepare(`
      SELECT c.id, c.last_message_at,
             u.id as other_user_id, u.display_name, u.avatar_url, u.last_seen,
             (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
             (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
      FROM conversations c
      JOIN users u ON (u.id = c.user1_id OR u.id = c.user2_id) AND u.id != ?
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC
    `).all(userId, userId, userId, userId);
    
    return successResponse(conversations);
  } catch (error) {
    console.error('Messages GET error:', error);
    return errorResponse('Hata oluştu.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return errorResponse('Giriş yapmalısınız.', 401);
    
    const db = await ensureDb();
    const userId = (session.user as SessionUser).id;
    const { receiverId, content } = await request.json();
    
    if (!receiverId || !content || !content.trim()) {
      return errorResponse('Eksik bilgi.', 400);
    }
    
    // Find or create conversation
    let conv = db.prepare(`
      SELECT id FROM conversations 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `).get(userId, receiverId, receiverId, userId) as { id: string } | undefined;
    
    if (!conv) {
      const convId = uuidv4();
      db.prepare('INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)')
        .run(convId, userId, receiverId);
      conv = { id: convId };
    }
    
    const messageId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, content) 
      VALUES (?, ?, ?, ?)
    `).run(messageId, conv.id, userId, content.trim());
    
    db.prepare('UPDATE conversations SET last_message_at = datetime("now") WHERE id = ?')
      .run(conv.id);
      
    // Send notification to receiver
    const sender = db.prepare('SELECT display_name FROM users WHERE id = ?').get(userId) as
      | { display_name: string }
      | undefined;
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), receiverId, 'message', 'Yeni Mesaj', `${sender?.display_name || 'Biri'} sana mesaj gönderdi.`, '/mesajlar');

    await sendPushNotification(db, receiverId, {
      title: 'Yeni Mesaj',
      body: `${sender?.display_name || 'Biri'} sana mesaj gönderdi.`,
      url: '/mesajlar',
    });
    
    return successResponse({ id: messageId, content: content.trim() });
  } catch (error) {
    console.error('Messages POST error:', error);
    return errorResponse('Mesaj gönderilemedi.', 500);
  }
}
