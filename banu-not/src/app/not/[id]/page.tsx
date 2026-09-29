'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Download, Bookmark, BookmarkCheck, Star, MessageSquare,
  Flag, Share2, FileText, Calendar, User, Eye, ArrowLeft,
  Send, AlertCircle, ChevronRight, Trash2, Edit
} from 'lucide-react';
import { getNoteTypeLabel, getSemesterLabel, formatFileSize, formatDate, timeAgo, REPORT_REASONS } from '@/lib/constants';
import { useToast } from '@/components/Toast';

export default function NoteDetailPage() {
  const { id } = useParams();
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
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

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
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Not yüklenirken bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ noteId: id, content: comment }),
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
        body: JSON.stringify({ noteId: id, reason: reportReason, details: reportDetails }),
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
    <div className="container-app py-6 sm:py-8 max-w-4xl mx-auto">
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
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="badge badge-teal">{getNoteTypeLabel(note.note_type)}</span>
          {note.course_code && <span className="badge badge-navy">{note.course_code}</span>}
          {note.semester && <span className="badge badge-accent">{getSemesterLabel(note.semester)}</span>}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 leading-tight">{note.title}</h1>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-navy-500">
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {note.user_display_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatDate(note.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            {note.download_count} indirme
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {note.view_count} görüntülenme
          </span>
        </div>
      </div>

      {/* Description */}
      {note.description && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-navy-800 mb-2">Açıklama</h2>
          <p className="text-navy-600 leading-relaxed whitespace-pre-line">{note.description}</p>
        </div>
      )}

      {/* File info & actions */}
      <div className="card p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-navy-900">
                {note.files?.[0]?.original_name || 'Dosya'}
              </p>
              <p className="text-sm text-navy-500">
                {note.files?.[0]?.mime_type?.split('/')[1]?.toUpperCase()} • {formatFileSize(note.files?.[0]?.file_size || 0)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <a
              href={`/api/download/${id}`}
              className="btn btn-primary flex-1 sm:flex-none"
              download
            >
              <Download className="w-4 h-4" /> İndir
            </a>
            <button onClick={handleBookmark} className="btn btn-secondary flex-1 sm:flex-none">
              {bookmarked ? <BookmarkCheck className="w-4 h-4 text-teal-600" /> : <Bookmark className="w-4 h-4" />}
              {bookmarked ? 'Kaydedildi' : 'Kaydet'}
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
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Yorumlar ({note.comments?.length || 0})
        </h2>

        {user && (
          <form onSubmit={handleComment} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Yorumunuzu yazın..."
                className="input flex-1"
                maxLength={1000}
                aria-label="Yorum yaz"
              />
              <button type="submit" disabled={submittingComment || !comment.trim()} className="btn btn-primary">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {note.comments?.length > 0 ? (
          <div className="space-y-4">
            {note.comments.map((c: any) => (
              <div key={c.id} className="flex gap-3">
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
                </div>
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
          <button onClick={() => setShowReport(true)} className="btn btn-ghost btn-sm text-navy-500">
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
    </div>
  );
}
