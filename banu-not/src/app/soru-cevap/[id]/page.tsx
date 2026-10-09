'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MessageCircle, ThumbsUp, ThumbsDown, CheckCircle, Clock, ChevronLeft, Send, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ForumPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/forum/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setPost(data.data.post);
        setReplies(data.data.replies);
      } else {
        showToast(data.error || 'Soru bulunamadı', 'error');
        router.push('/soru-cevap');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      showToast('Cevap yazmak için giriş yapmalısınız', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/forum/${params.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Cevabınız eklendi!');
        setReplyContent('');
        fetchPost(); // Refresh
      } else {
        showToast(data.error || 'Hata', 'error');
      }
    } catch {
      showToast('Bir hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  async function vote(targetType: 'post' | 'reply', targetId: string, voteValue: 1 | -1) {
    if (!session?.user) {
      showToast('Oy vermek için giriş yapmalısınız.', 'error');
      return;
    }
    try {
      const response = await fetch(`/api/forum/${params.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, vote: voteValue }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Oy kaydedilemedi.');
      const counts = result.data as { upvotes: number; downvotes: number };
      if (targetType === 'post') setPost((current: any) => ({ ...current, upvotes: counts.upvotes, downvotes: counts.downvotes }));
      else setReplies(current => current.map(reply => reply.id === targetId ? { ...reply, upvotes: counts.upvotes, downvotes: counts.downvotes } : reply));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Oy kaydedilemedi.', 'error');
    }
  }

  async function acceptReply(replyId: string) {
    try {
      const response = await fetch(`/api/forum/${params.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Çözüm işaretlenemedi.');
      showToast('Cevap çözüm olarak işaretlendi.');
      await fetchPost();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Çözüm işaretlenemedi.', 'error');
    }
  }

  if (loading) return <div className="container-app py-8"><div className="skeleton h-64 w-full mb-8" /></div>;
  if (!post) return null;

  return (
    <div className="container-app py-8 max-w-4xl mx-auto">
      <Link href="/soru-cevap" className="inline-flex items-center text-sm font-medium text-navy-500 hover:text-navy-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Forum'a Dön
      </Link>

      {/* Main Post */}
      <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden mb-8">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-navy-100 text-navy-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {post.course_code || post.faculty_name || 'Genel'}
            </span>
            {post.is_resolved === 1 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Çözüldü
              </span>
            )}
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mb-4">{post.title}</h1>
          
          <div className="flex items-center justify-between border-b border-navy-50 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <img src={post.avatar_url || `https://ui-avatars.com/api/?name=${post.user_name}&background=0D9488&color=fff`} className="w-10 h-10 rounded-full" alt="avatar" />
              <div>
                <p className="font-semibold text-navy-900">{post.user_name}</p>
                <p className="text-xs text-navy-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 
                  {new Date(post.created_at).toLocaleDateString('tr-TR')} {new Date(post.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          </div>

          <div className="prose prose-navy max-w-none mb-8 whitespace-pre-wrap text-navy-800">
            {post.content}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void vote('post', post.id, 1)} className="inline-flex items-center gap-1 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600 hover:bg-teal-50 hover:text-teal-700" aria-label="Soruyu faydalı bul">
              <ThumbsUp className="h-4 w-4" /> {post.upvotes || 0}
            </button>
            <button type="button" onClick={() => void vote('post', post.id, -1)} className="inline-flex items-center gap-1 rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600 hover:bg-red-50 hover:text-red-700" aria-label="Soruyu yararsız bul">
              <ThumbsDown className="h-4 w-4" /> {post.downvotes || 0}
            </button>
          </div>

        </div>
      </div>

      {/* Replies */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-teal-600" /> 
          Cevaplar <span className="bg-navy-100 text-navy-600 text-sm px-2 py-0.5 rounded-full">{replies.length}</span>
        </h3>

        {replies.length > 0 ? (
          <div className="space-y-4">
            {replies.map(reply => (
              <div key={reply.id} className={`bg-white rounded-xl shadow-sm border p-5 sm:p-6 transition-all ${reply.is_accepted ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-navy-100'}`}>
                {reply.is_accepted === 1 && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 w-max px-3 py-1 rounded-full mb-4">
                    <CheckCircle className="w-4 h-4" /> Çözüm Olarak İşaretlendi
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={reply.avatar_url || `https://ui-avatars.com/api/?name=${reply.user_name}&background=e2e8f0`} className="w-8 h-8 rounded-full" alt="avatar" />
                    <div>
                      <p className="font-semibold text-navy-900 flex items-center gap-2">
                        {reply.user_name}
                        {reply.role === 'admin' && <span className="bg-teal-100 text-teal-700 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold">Yönetici</span>}
                      </p>
                      <p className="text-[11px] text-navy-500">{new Date(reply.created_at).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                </div>

                <div className="text-navy-800 whitespace-pre-wrap">
                  {reply.content}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void vote('reply', reply.id, 1)} className="inline-flex items-center gap-1 rounded-lg border border-navy-100 px-3 py-1.5 text-xs text-navy-600 hover:bg-teal-50 hover:text-teal-700" aria-label="Cevabı faydalı bul">
                    <ThumbsUp className="h-3.5 w-3.5" /> {reply.upvotes || 0}
                  </button>
                  <button type="button" onClick={() => void vote('reply', reply.id, -1)} className="inline-flex items-center gap-1 rounded-lg border border-navy-100 px-3 py-1.5 text-xs text-navy-600 hover:bg-red-50 hover:text-red-700" aria-label="Cevabı yararsız bul">
                    <ThumbsDown className="h-3.5 w-3.5" /> {reply.downvotes || 0}
                  </button>
                  {session?.user && ((session.user as any).id === post.user_id || ['admin', 'moderator'].includes((session.user as any).role)) && reply.is_accepted !== 1 && (
                    <button type="button" onClick={() => void acceptReply(reply.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                      <CheckCircle className="h-3.5 w-3.5" /> En iyi cevap
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-navy-50 rounded-xl p-8 text-center border border-dashed border-navy-200">
            <p className="text-navy-500">Henüz cevap yazılmamış. İlk cevabı siz yazın!</p>
          </div>
        )}
      </div>

      {/* Reply Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-navy-100 p-6 sm:p-8">
        <h4 className="font-bold text-navy-900 mb-4 text-lg">Cevap Yaz</h4>
        {session ? (
          <form onSubmit={handleReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="input min-h-[120px] mb-4"
              placeholder="Sorunun çözümüne yardımcı olacak detaylı bir cevap yazın..."
              required
              minLength={5}
            />
            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="btn btn-teal">
                <Send className="w-4 h-4" /> {submitting ? 'Gönderiliyor...' : 'Cevabı Gönder'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center p-6 bg-navy-50 rounded-xl">
            <p className="text-navy-600 mb-4">Cevap yazabilmek için giriş yapmalısınız.</p>
            <Link href="/giris" className="btn btn-navy mx-auto">Giriş Yap</Link>
          </div>
        )}
      </div>

    </div>
  );
}
