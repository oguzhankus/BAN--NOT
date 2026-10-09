'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BookOpen, CheckCircle, ChevronLeft, ChevronRight,
  Clock, Edit3, Eye, MessageCircle, Search, X,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  course_code?: string;
  course_name?: string;
  faculty_name?: string;
  department_name?: string;
  is_resolved?: number;
  user_name?: string;
  created_at: string;
  reply_count?: number;
  view_count?: number;
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();

  const fetchPosts = useCallback(async (query: string, targetPage = 1, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(targetPage) });
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/forum?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Sorular yüklenemedi.', 'error');
        return;
      }
      setPosts(data.data.posts);
      setTotalResults(data.data.pagination.total);
      setTotalPages(Math.max(1, data.data.pagination.totalPages));
      setPage(targetPage);
    } catch {
      showToast('Sorular yüklenirken bağlantı hatası oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchPosts('', 1, false));
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery.trim());
    fetchPosts(searchQuery, 1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveQuery('');
    fetchPosts('', 1);
  };

  const changePage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === page) return;
    fetchPosts(activeQuery, targetPage);
  };

  return (
    <div className="forum-page min-h-screen pb-12">
      <section className="forum-hero relative isolate overflow-hidden text-white">
        <div aria-hidden="true" className="forum-hero-glow absolute inset-0 -z-10" />
        <div className="container-app py-9 sm:py-12 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-teal-200">
              <MessageCircle className="h-3.5 w-3.5" /> Öğrenci topluluğu
            </div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Birlikte soralım, <span className="forum-hero-accent">birlikte çözelim.</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-200 sm:text-base">
                  Derslerle ilgili merak ettiklerini sor; deneyimini paylaşarak başka öğrencilere destek ol.
                </p>
              </div>
              <Link href="/soru-cevap/sor" className="btn btn-teal self-start px-5 sm:self-auto">
                <Edit3 className="h-4 w-4" /> Soru Sor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <form onSubmit={handleSearch} className="forum-search mt-6 max-w-3xl">
              <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white p-1.5 pl-4 shadow-[0_18px_50px_rgba(1,13,26,0.25)] transition-[border-color,box-shadow] focus-within:border-teal-300/70 focus-within:shadow-[0_0_0_4px_rgba(79,209,197,0.12),0_18px_50px_rgba(1,13,26,0.25)]">
                <Search className="h-5 w-5 shrink-0 text-navy-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Bir soru, ders veya konu ara..."
                  aria-label="Forumda ara"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy-900 outline-none placeholder:text-navy-400 focus:ring-0 sm:text-base"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button type="submit" className="btn btn-teal">Ara</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="container-app py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-6">
          <aside className="space-y-4 lg:col-span-1">
            <div className="forum-help-card card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-navy-900">Bir sorunun mu var?</h2>
              <p className="mt-1.5 text-sm leading-6 text-navy-500">
                Başlığını açık yaz, ilgili dersi ekle ve bildiklerini paylaş.
              </p>
              <Link href="/soru-cevap/sor" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800">
                Sorunu topluluğa yönelt <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <Link href="/dersler" className="forum-catalog-link card group flex items-center gap-3 p-4 transition-colors hover:border-teal-200 hover:bg-teal-50/40">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
                <BookOpen className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-navy-800">Ders kataloğu</span>
                <span className="mt-0.5 block text-xs text-navy-500">Bölümünü ve dersini bul</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-navy-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </aside>

          <main className="min-w-0 lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">Kampüs sohbetleri</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                  {activeQuery ? 'Arama sonuçları' : 'Son sorular'}
                </h2>
              </div>
              <span className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-xs font-semibold text-navy-600">
                {loading ? 'Yükleniyor…' : `${totalResults} soru`}
              </span>
            </div>

            {loading ? (
              <div className="space-y-3" aria-label="Sorular yükleniyor">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="forum-skeleton card h-36 p-5">
                    <div className="skeleton mb-3 h-4 w-28 rounded-full" />
                    <div className="skeleton mb-2 h-5 w-3/4" />
                    <div className="skeleton h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <Link key={post.id} href={`/soru-cevap/${post.id}`} className="forum-post-card card group block p-4 sm:p-5">
                      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <span className="max-w-full truncate rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-600">
                              {post.course_code || post.course_name || post.faculty_name || 'Genel'}
                            </span>
                            {post.is_resolved === 1 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                                <CheckCircle className="h-3 w-3" /> Çözüldü
                              </span>
                            )}
                          </div>
                          <h3 className="line-clamp-2 text-base font-bold leading-snug text-navy-900 transition-colors group-hover:text-teal-800 sm:text-lg">
                            {post.title}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-navy-600">{post.content}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-navy-500">
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-teal-800">
                                {(post.user_name || 'Ö').trim().charAt(0).toLocaleUpperCase('tr-TR')}
                              </span>
                              <span className="max-w-32 truncate">{post.user_name || 'Öğrenci'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(post.created_at).toLocaleDateString('tr-TR')}
                            </span>
                            {post.department_name && <span className="max-w-full truncate">{post.department_name}</span>}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-around gap-5 border-t border-navy-100 pt-3 sm:flex-col sm:items-end sm:justify-center sm:gap-2 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500" aria-label={`${post.reply_count || 0} cevap`}>
                            <MessageCircle className="h-4 w-4 text-teal-600" />
                            {post.reply_count || 0} <span className="hidden sm:inline">cevap</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-500" aria-label={`${post.view_count || 0} görüntülenme`}>
                            <Eye className="h-4 w-4 text-navy-400" />
                            {post.view_count || 0} <span className="hidden sm:inline">görüntülenme</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Soru sayfaları">
                    <button
                      type="button"
                      onClick={() => changePage(page - 1)}
                      disabled={page <= 1 || loading}
                      className="btn btn-secondary btn-sm"
                      aria-label="Önceki sayfa"
                    >
                      <ChevronLeft className="h-4 w-4" /> Önceki
                    </button>
                    <span className="min-w-20 text-center text-sm font-medium text-navy-600">{page} / {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => changePage(page + 1)}
                      disabled={page >= totalPages || loading}
                      className="btn btn-secondary btn-sm"
                      aria-label="Sonraki sayfa"
                    >
                      Sonraki <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="forum-empty card p-8 text-center sm:p-12">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  {activeQuery ? <Search className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
                </div>
                <h3 className="text-lg font-bold text-navy-900">
                  {activeQuery ? 'Bu aramayla eşleşen soru yok' : 'Henüz soru paylaşılmamış'}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-navy-500">
                  {activeQuery ? 'Farklı kelimeler deneyebilir veya aramanı temizleyebilirsin.' : 'Topluluğun ilk sorusunu sen başlat; birlikte yanıtlayalım.'}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {activeQuery && <button type="button" onClick={clearSearch} className="btn btn-secondary">Aramayı temizle</button>}
                  <Link href="/soru-cevap/sor" className="btn btn-teal"><Edit3 className="h-4 w-4" /> Soru Sor</Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
