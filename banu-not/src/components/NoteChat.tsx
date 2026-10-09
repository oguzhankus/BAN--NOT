'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Send, UserRound } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function NoteChat({ noteId }: { noteId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/notes/${noteId}/chat`)
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Sohbet yüklenemedi.');
        if (!cancelled) setMessages(result.data);
      })
      .catch(loadError => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Sohbet yüklenemedi.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [noteId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = message.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    setMessages(current => [...current, { role: 'user', content }]);
    setMessage('');
    try {
      const response = await fetch(`/api/notes/${noteId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Yanıt alınamadı.');
      setMessages(current => [...current, { role: 'assistant', content: result.data.answer }]);
    } catch (sendError) {
      setMessages(current => current.filter((item, index) => !(index === current.length - 1 && item.role === 'user' && item.content === content)));
      setMessage(content);
      setError(sendError instanceof Error ? sendError.message : 'Yanıt alınamadı.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-5 border-t border-indigo-100 pt-5">
      <h3 className="mb-1 flex items-center gap-2 font-bold text-indigo-900"><Bot className="h-4 w-4" /> Bu nota soru sor</h3>
      <p className="mb-3 text-xs text-indigo-600">Yanıtlar notun bilgileri ve AI özetine dayanır; emin olunmayan noktalar belirtilir.</p>
      <div ref={listRef} className="mb-3 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-indigo-100 bg-white/70 p-3" aria-live="polite">
        {loading ? <p className="text-sm text-indigo-500">Sohbet yükleniyor…</p> : null}
        {!loading && !messages.length && <p className="text-sm text-indigo-500">Bu notla ilgili bir kavramı sorarak başlayabilirsin.</p>}
        {messages.map((item, index) => (
          <div key={`${index}-${item.role}`} className={`flex gap-2 ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {item.role === 'assistant' && <Bot className="mt-1 h-4 w-4 shrink-0 text-indigo-500" />}
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${item.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-950'}`}>{item.content}</p>
            {item.role === 'user' && <UserRound className="mt-1 h-4 w-4 shrink-0 text-indigo-500" />}
          </div>
        ))}
        {sending && <p className="text-xs text-indigo-500">Yanıt hazırlanıyor…</p>}
      </div>
      {error && <p className="mb-2 text-sm text-red-600" role="alert">{error}</p>}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input className="input min-w-0 flex-1" value={message} onChange={event => setMessage(event.target.value)} maxLength={1500} minLength={2} placeholder="Notla ilgili bir soru yaz…" aria-label="Notla ilgili soru" disabled={sending} />
        <button type="submit" className="btn btn-teal shrink-0" disabled={sending || message.trim().length < 2} aria-label="Soruyu gönder"><Send className="h-4 w-4" /><span className="hidden sm:inline">Gönder</span></button>
      </form>
    </section>
  );
}
