'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageSquare, Send, User, ChevronLeft, Check, CheckCheck } from 'lucide-react';
import { timeAgo } from '@/lib/constants';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');
  const user = session?.user as any;

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(initialUserId);
  const [activeUserInfo, setActiveUserInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (session?.user) loadConversations();
  }, [session, status]);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
      const interval = setInterval(() => loadMessages(activeChat), 3000); // Poll every 3s
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
        // If there's an initialUserId but it's not in conversations, it means it's a new chat, handled implicitly
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(otherUserId: string) {
    try {
      const res = await fetch(`/api/messages?userId=${otherUserId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
        if (data.data.otherUser) {
          setActiveUserInfo(data.data.otherUser);
        }
        setConversations(prev => prev.map(c => 
          c.other_user_id === otherUserId ? { ...c, unread_count: 0 } : c
        ));
        window.dispatchEvent(new Event('messagesRead'));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const content = newMessage.trim();
    setNewMessage('');
    
    // Optimistic UI
    setMessages(prev => [...prev, { id: Date.now(), sender_id: user.id, content, created_at: new Date().toISOString() }]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeChat, content }),
      });
      if (res.ok) {
        loadConversations();
      }
    } catch (e) {
      console.error(e);
    }
  }

  const activeUser = conversations.find(c => c.other_user_id === activeChat) || activeUserInfo;

  const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const diff = Date.now() - new Date(lastSeen + 'Z').getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  if (loading) return <div className="container-app py-8">Yükleniyor...</div>;

  return (
    <div className="container-app py-0 sm:py-8 h-[calc(100dvh-80px)] max-h-[800px] flex">
      <div className="bg-white border-x border-b sm:border border-navy-100 sm:rounded-2xl shadow-sm flex w-full overflow-hidden">
        
        {/* Conversations List */}
        <div className={`w-full md:w-1/3 border-r border-navy-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-navy-100 bg-navy-50">
            <h2 className="font-bold text-navy-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Mesajlarım
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="p-4 text-center text-navy-500 text-sm">Henüz mesajınız yok.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveChat(conv.other_user_id)}
                  className={`w-full text-left p-4 border-b border-navy-50 hover:bg-navy-50 transition-colors flex items-center gap-3 ${activeChat === conv.other_user_id ? 'bg-navy-50' : ''}`}
                >
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-teal-700">{conv.display_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-navy-900 truncate">{conv.display_name}</p>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{conv.unread_count}</span>
                      )}
                    </div>
                    <p className="text-sm text-navy-500 truncate">{conv.last_message || '...'}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          {activeChat ? (
            <>
              <div className="p-4 border-b border-navy-100 bg-white flex items-center gap-3">
                <button className="md:hidden p-1 text-navy-500" onClick={() => setActiveChat(null)}>
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-teal-700">{activeUser?.display_name?.charAt(0) || '?'}</span>
                  </div>
                  {isUserOnline(activeUser?.last_seen) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 leading-tight">{activeUser?.display_name || 'Kullanıcı'}</h3>
                  {isUserOnline(activeUser?.last_seen) ? (
                    <p className="text-xs text-green-500 font-medium">Çevrimiçi</p>
                  ) : (
                    <p className="text-xs text-navy-400">{activeUser?.last_seen ? `Son görülme: ${timeAgo(activeUser.last_seen)}` : 'Çevrimdışı'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-navy-400">
                    <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mb-3">
                      <MessageSquare className="w-8 h-8 text-navy-300" />
                    </div>
                    <p className="text-sm">İlk mesajı gönderin ve sohbete başlayın!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const showTime = idx === 0 || (new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000); // 5 min gap
                    
                    return (
                      <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <div className="w-full text-center my-3">
                            <span className="text-[10px] bg-navy-50 text-navy-400 px-2 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleDateString([], {weekday: 'long', hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        )}
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl relative group shadow-sm ${isMe ? 'bg-[#dcf8c6] text-navy-900 rounded-br-none' : 'bg-white text-navy-900 rounded-bl-none'}`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={`flex items-center gap-1 justify-end mt-1 text-navy-500`}>
                            <span className="text-[10px] opacity-80">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {isMe && (
                              msg.is_read ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5 text-navy-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-white border-t border-navy-100">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Mesaj yazın..."
                    className="flex-1 bg-navy-50 border-transparent rounded-full px-4 py-2 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                  />
                  <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 bg-teal-600 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-navy-400 p-8">
              <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-center">Sohbet başlatmak için bir konuşma seçin</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
