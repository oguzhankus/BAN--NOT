'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download, Heart, Star, MessageSquare, Flag, Share2, FileText,
  Calendar, Eye, Send, ChevronRight, Trash2, Sparkles
} from 'lucide-react';
import { getNoteTypeLabel, getSemesterLabel, formatFileSize, formatDate, timeAgo, REPORT_REASONS } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import confetti from 'canvas-confetti';
import NoteCard from '@/components/NoteCard';
import AiAnalysis from '@/components/AiAnalysis';

export default function NoteDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const user = session?.user as any;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<any>(null);

  const handleCommentLike = async (commentId: string) => {
    if (!user) { showToast('Beğenmek için giriş yapmalısınız.', 'error'); return; }
    try {
      const res = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });
      const data = await res.json();
      if (data.success) {
        setNote((prev: any) => ({
          ...prev,
          comments: prev.comments.map((c: any) => 
            c.id === commentId ? { ...c, user_liked: data.data.liked, like_count: c.like_count + (data.data.liked ? 1 : -1) } : c
          )
        }));
      }
    } catch (e) {}
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Yorum silindi.');
        setNote((prev: any) => ({ ...prev, comments: prev.comments.filter((c: any) => c.id !== commentId) }));
      }
    } catch (e) {}
  };
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'note' | 'comment'>('note');
  const [similarNotes, setSimilarNotes] = useState<any[]>([]);
  
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadNote();
  }, [id]);

  async function loadNote() {
    try {
      const res = await fetch(`/api/notes/${id}`);
      const data = await res.json();
      if (data.success) {
        setNote(data.data);
        setBookmarked(data.data.userBookmarked);
        setUserRating(data.data.userRating);
        
        // Fetch similar notes
        fetch(`/api/notes/${id}/similar`)
          .then(r => r.json())
          .then(d => { if (d.success) setSimilarNotes(d.data); })
          .catch(() => {});
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Not yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadAiAnalysis() {
    if (aiAnalysis) return;
    setLoadingAi(true);
    try {
      const res = await fetch(`/api/notes/${id}/ai-analysis`);
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.data);
      }
    } catch {
      showToast('Yapay zeka analizi alınamadı.', 'error');
    } finally {
      setLoadingAi(false);
    }
  }

  async function handleBookmark() {
    if (!user) { router.push('/giris'); return; }
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarked(data.data.bookmarked);
        showToast(data.data.message);
      }
    } catch { showToast('Hata oluştu.', 'error'); }
  }

  async function handleRate(score: number) {
    if (!user) { router.push('/giris'); return; }
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, score }),
      });
      const data = await res.json();
      if (data.success) {
        setUserRating(score);
        setNote((n: any) => ({ ...n, avg_rating: data.data.avgRating, rating_count: data.data.ratingCount }));
        showToast(data.data.message);
      }
    } catch { showToast('Hata oluştu.', 'error'); }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push('/giris'); return; }
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, content: comment, parentId: replyTo?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setNote((n: any) => ({ ...n, comments: [data.data, ...n.comments] }));
        setComment('');
        showToast('Yorumunuz eklendi.');
      } else {
        showToast(data.error, 'error');
      }
    } catch { showToast('Hata oluştu.', 'error'); }
    finally { setSubmittingComment(false); }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push('/giris'); return; }
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: id, targetId: reportTargetId || id, targetType: reportTargetType, reason: reportReason, details: reportDetails }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.data.message);
        setShowReport(false);
        setReportReason('');
        setReportDetails('');
      } else {
        showToast(data.error, 'error');
      }
    } catch { showToast('Hata oluştu.', 'error'); }
  }

  async function handleDelete() {
    if (!confirm('Bu notu kaldırmak istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Not kaldırıldı.');
        router.push('/notlarim');
      }
    } catch { showToast('Hata oluştu.', 'error'); }
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Bağlantı kopyalandı.');
    } catch {
      showToast('Bağlantı kopyalanamadı.', 'error');
    }
  }

  if (loading) {
    return (
      <div className="container-app py-8 max-w-4xl mx-auto">
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="skeleton h-4 w-48 mb-6" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container-app py-16 text-center">
        <FileText className="w-16 h-16 text-navy-300 mx-auto" />
        <h1 className="text-xl font-bold text-navy-800 mt-4">Not bulunamadı</h1>
        <p className="text-navy-500 mt-2">Bu not silinmiş veya henüz yayınlanmamış olabilir.</p>
        <Link href="/kesfet" className="btn btn-primary mt-4">Keşfete Git</Link>
      </div>
    );
  }

  const categoryPath = [note.faculty_name, note.department_name, note.course_name].filter(Boolean);
  const isOwner = user?.id === note.user_id;
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <div className="container-app note-detail-page mx-auto max-w-5xl py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-navy-500 mb-4 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-navy-700">Ana Sayfa</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/kesfet" className="hover:text-navy-700">Keşfet</Link>
        {categoryPath.map((item, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{item}</span>
          </span>
        ))}
      </nav>

      {/* Note header */}
      <div className="note-detail-header card relative mb-6 overflow-hidden p-5 sm:p-7">
        <div aria-hidden="true" className="note-detail-header-glow absolute inset-0" />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge badge-teal">{getNoteTypeLabel(note.note_type)}</span>
            {note.course_code && <span className="badge badge-navy">{note.course_code}</span>}
            {note.semester && <span className="badge badge-accent">{getSemesterLabel(note.semester)}</span>}
          </div>
          <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight text-navy-900 sm:text-3xl lg:text-4xl">{note.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-navy-500">
            <Link href={`/kullanici/${note.user_id}`} className="inline-flex items-center gap-2 font-semibold text-navy-700 transition-colors hover:text-teal-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                {(note.user_display_name || 'A').charAt(0).toUpperCase()}
              </span>
              {note.user_display_name || 'Anonim'}
            </Link>
            {user && user.id !== note.user_id && (
              <Link href={`/mesajlar?userId=${note.user_id}`} className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition-colors hover:bg-teal-100">
                <MessageSquare className="h-3.5 w-3.5" /> Mesaj At
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(note.created_at)}</span>
            <span className="inline-flex items-center gap-1.5"><Download className="h-4 w-4" /> {note.download_count} indirme</span>
            <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {note.view_count} görüntülenme</span>
            <button
              onClick={() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-teal-700"
            >
              <MessageSquare className="h-4 w-4" /> {note.comments?.length || 0} yorum
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {note.description && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-navy-800 mb-2">Açıklama</h2>
          <p className="text-navy-600 leading-relaxed whitespace-pre-line">{note.description}</p>
        </div>
      )}

      {/* AI Analysis */}
      <div className="card p-5 mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => {
          setShowAi(!showAi);
          if (!showAi) loadAiAnalysis();
        }}>
          <h2 className="font-semibold text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" /> Yapay Zeka (AI) Not Analizi
          </h2>
          <ChevronRight className={`w-5 h-5 text-indigo-400 transition-transform ${showAi ? 'rotate-90' : ''}`} />
        </div>
        
        {showAi && (
          <div className="mt-4 pt-4 border-t border-indigo-100/50">
            {loadingAi ? (
              <div className="space-y-3">
                <div className="skeleton h-4 w-full bg-indigo-200/50" />
                <div className="skeleton h-4 w-5/6 bg-indigo-200/50" />
                <div className="skeleton h-4 w-4/6 bg-indigo-200/50" />
                <p className="text-xs text-indigo-500 animate-pulse mt-2">AI notu analiz ediyor, lütfen bekleyin...</p>
              </div>
            ) : aiAnalysis ? (
              <AiAnalysis data={aiAnalysis} />
            ) : (
              <p className="text-sm text-red-500">Analiz yüklenemedi.</p>
            )}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="card mb-6 overflow-hidden border-teal-200 shadow-lg">
          <div className="bg-teal-50 px-4 py-3 border-b border-teal-100 flex justify-between items-center">
            <h3 className="font-semibold text-teal-800 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Dosya Önizlemesi
            </h3>
            <button onClick={() => setShowPreview(false)} className="text-teal-600 hover:text-teal-800 text-sm font-medium">Kapat</button>
          </div>
          <div className="w-full bg-navy-900 rounded-b-xl relative flex items-center justify-center overflow-hidden" style={{ height: '70vh', minHeight: '500px' }}>
            {note.files?.[0]?.mime_type?.startsWith('image/') ? (
              <img 
                src={`/api/preview/${id}`} 
                alt="Dosya Önizleme" 
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <iframe 
                src={`/api/preview/${id}`} 
                className="w-full h-full border-0 rounded-b-xl bg-white"
                title="Dosya Önizleme"
              />
            )}
          </div>
        </div>
      )}

      {/* File info & actions */}
      <div className="note-file-actions card mb-6 p-4 sm:p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <FileText className="h-6 w-6 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="break-all font-semibold text-navy-900">
                {note.files?.[0]?.original_name || 'Dosya'}
              </p>
              <p className="mt-0.5 text-xs text-navy-500 sm:text-sm">
                {note.files?.[0]?.mime_type?.split('/')[1]?.toUpperCase()} • {formatFileSize(note.files?.[0]?.file_size || 0)}
              </p>
            </div>
          </div>
          
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <a
              href={user ? `/api/download/${id}` : '#'}
              className="btn btn-primary flex-1 sm:flex-none relative overflow-hidden group"
              {...(user ? { download: true } : {})}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  showToast('Notları indirmek için giriş yapmalısınız veya kayıt olmalısınız.', 'error');
                  return;
                }
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#0f766e', '#1e293b', '#3b82f6', '#f59e0b']
                });
              }}
            >
              <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" /> İndir
            </a>
            <button
              onClick={() => {
                if (!user) { showToast('Önizleme için giriş yapmalısınız.', 'error'); return; }
                setShowPreview(!showPreview);
              }}
              className={`btn flex-1 sm:flex-none transition-colors ${showPreview ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'}`}
            >
              <Eye className="w-4 h-4" /> {showPreview ? 'Önizlemeyi Kapat' : 'Önizleme'}
            </button>
            <button onClick={handleBookmark} className={`btn flex-1 sm:flex-none ${bookmarked ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'btn-secondary'}`}>
              <Heart className={`w-4 h-4 ${bookmarked ? 'fill-red-600 text-red-600' : ''}`} />
              {bookmarked ? 'Beğenildi' : 'Beğen'}
            </button>
            <button onClick={handleShare} className="btn btn-ghost">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tags & metadata */}
      {(note.tags?.length > 0 || note.topic || note.academic_year) && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-navy-800 mb-3">Detaylar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {note.topic && (
              <div><span className="text-navy-500">Konu:</span> <span className="text-navy-800 font-medium">{note.topic}</span></div>
            )}
            {note.academic_year && (
              <div><span className="text-navy-500">Akademik Yıl:</span> <span className="text-navy-800 font-medium">{note.academic_year}</span></div>
            )}
          </div>
          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {note.tags.map((tag: string) => (
                <Link key={tag} href={`/kesfet?q=${tag}`} className="badge badge-accent hover:opacity-80">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-navy-800 mb-3">Puanlama</h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-navy-900">
              {note.avg_rating ? (Math.round(note.avg_rating * 10) / 10).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-navy-500">{note.rating_count || 0} puan</div>
          </div>
          <div>
            <p className="text-sm text-navy-600 mb-1.5">{user ? 'Puanınız:' : 'Puan vermek için giriş yapın'}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => handleRate(i)}
                  onMouseEnter={() => setHoverRating(i)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                  aria-label={`${i} puan ver`}
                >
                  <Star
                    className={`w-6 h-6 ${
                      i <= (hoverRating || userRating) ? 'text-accent-500 fill-accent-500' : 'text-navy-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div id="comments-section" className="card p-5 mb-6">
        <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Yorumlar ({note.comments?.length || 0})
        </h2>

        {user && (
          <form onSubmit={handleComment} className="mb-6">
            {replyTo && (
              <div className="flex justify-between items-center bg-teal-50 text-teal-800 p-2 px-3 rounded-t-lg border-b border-teal-100 text-sm">
                <span><strong>{replyTo.user_display_name}</strong> adlı kullanıcıya yanıt veriyorsunuz:</span>
                <button type="button" onClick={() => setReplyTo(null)} className="text-teal-600 hover:text-teal-900">İptal</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={replyTo ? "Yanıtınızı yazın..." : "Yorumunuzu yazın..."}
                className={`input flex-1 ${replyTo ? 'rounded-t-none border-t-0 focus:ring-0' : ''}`}
                maxLength={1000}
                aria-label="Yorum yaz"
              />
              <button type="submit" disabled={submittingComment || !comment.trim()} className={`btn btn-primary ${replyTo ? 'rounded-tl-none' : ''}`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {note.comments?.length > 0 ? (
          <div className="space-y-4">
            {note.comments.filter((c: any) => !c.parent_id).map((c: any) => (
              <div key={c.id} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-navy-600">
                      {c.user_display_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-800">{c.user_display_name}</span>
                      <span className="text-xs text-navy-400">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-navy-600 mt-0.5">{c.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                      <button onClick={() => handleCommentLike(c.id)} className={`flex items-center gap-1 ${c.user_liked ? 'text-teal-600' : 'text-navy-500 hover:text-navy-700'}`}>
                        <Heart className={`w-3.5 h-3.5 ${c.user_liked ? 'fill-teal-600' : ''}`} /> {c.like_count || 0}
                      </button>
                      <button onClick={() => setReplyTo(c)} className="text-navy-500 hover:text-navy-700">Yanıtla</button>
                      {(user?.id === c.user_id || isAdmin) && (
                        <button onClick={() => handleCommentDelete(c.id)} className="text-red-500 hover:text-red-700">Sil</button>
                      )}
                      {user?.id !== c.user_id && (
                        <button onClick={() => { setReportReason(''); setReportDetails(''); setReportTargetId(c.id); setReportTargetType('comment'); setShowReport(true); }} className="text-navy-400 hover:text-navy-600" title="Şikayet Et">
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {note.comments.filter((reply: any) => reply.parent_id === c.id).length > 0 && (
                  <div className="pl-11 space-y-3 mt-1">
                    {note.comments.filter((reply: any) => reply.parent_id === c.id).map((reply: any) => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-6 h-6 bg-navy-50 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-semibold text-navy-500">
                            {reply.user_display_name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-navy-800">{reply.user_display_name}</span>
                            <span className="text-xs text-navy-400">{timeAgo(reply.created_at)}</span>
                          </div>
                          <p className="text-sm text-navy-600 mt-0.5">{reply.content}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs font-medium">
                            <button onClick={() => handleCommentLike(reply.id)} className={`flex items-center gap-1 ${reply.user_liked ? 'text-teal-600' : 'text-navy-500 hover:text-navy-700'}`}>
                              <Heart className={`w-3.5 h-3.5 ${reply.user_liked ? 'fill-teal-600' : ''}`} /> {reply.like_count || 0}
                            </button>
                            {(user?.id === reply.user_id || isAdmin) && (
                              <button onClick={() => handleCommentDelete(reply.id)} className="text-red-500 hover:text-red-700">Sil</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy-500 text-center py-4">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(isOwner || isAdmin) && (
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <Trash2 className="w-4 h-4" /> Kaldır
          </button>
        )}
        {user && (
          <button onClick={() => { setReportTargetId(id || null); setReportTargetType('note'); setShowReport(true); }} className="btn btn-ghost btn-sm text-navy-500">
            <Flag className="w-4 h-4" /> Bildir
          </button>
        )}
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy-900 mb-4">İçerik Bildirimi</h3>
            <form onSubmit={handleReport} className="space-y-4">
              <div>
                <label className="label" htmlFor="report-reason">Neden</label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Bir neden seçin</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="report-details">Açıklama (isteğe bağlı)</label>
                <textarea
                  id="report-details"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Detay ekleyin..."
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowReport(false)} className="btn btn-ghost">İptal</button>
                <button type="submit" className="btn btn-danger">Gönder</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Similar Notes */}
      {similarNotes.length > 0 && (
        <div className="mt-8 mb-6">
          <h2 className="text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
            Benzer Notlar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {similarNotes.map(sn => (
              <NoteCard key={sn.id} note={sn} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
