'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search, Upload, BookOpen, TrendingUp, Clock,
  ArrowRight, GraduationCap, Users, Download, Star,
  Sparkles, ArrowUpRight, FileText
} from 'lucide-react';
import NoteCard from '@/components/NoteCard';
import ExamCountdown from '@/components/ExamCountdown';
import ScrollReveal from '@/components/ScrollReveal';
import { UNIVERSITY, getDailyQuote } from '@/lib/constants';

const dailyQuote = getDailyQuote();

type HomeNote = React.ComponentProps<typeof NoteCard>['note'];

interface HomeFaculty {
  id: string;
  name: string;
  short_name?: string;
  type: string;
}

interface HomeRequest {
  id: string;
  status: string;
  title: string;
  reward_points: number;
  description?: string;
  user_display_name: string;
  created_at: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentNotes, setRecentNotes] = useState<HomeNote[]>([]);
  const [followedNotes, setFollowedNotes] = useState<HomeNote[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'followed'>('recent');
  const [popularNotes, setPopularNotes] = useState<HomeNote[]>([]);
  const [recommendedNotes, setRecommendedNotes] = useState<HomeNote[]>([]);
  const [recentRequests, setRecentRequests] = useState<HomeRequest[]>([]);
  const [faculties, setFaculties] = useState<HomeFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteStats, setSiteStats] = useState({ notes: 0, users: 0, courses: 0 });

  const loadData = useCallback(async () => {
    try {
      // Get stats
      const statsRes = await fetch('/api/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setSiteStats(statsData.data);
      }

      // Get university
      const uniRes = await fetch('/api/categories?type=universities');
      const uniData = await uniRes.json();
      if (uniData.success && uniData.data.length > 0) {
        const universityId = uniData.data[0].id;
        // Get faculties
        const facRes = await fetch(`/api/categories?type=faculties&parentId=${universityId}`);
        const facData = await facRes.json();
        if (facData.success) setFaculties(facData.data);
      }

      // Get recent notes
      const recentRes = await fetch('/api/notes?sort=newest&limit=4');
      const recentData = await recentRes.json();
      if (recentData.success) setRecentNotes(recentData.data.notes);

      // Get followed courses notes (we try unconditionally, API returns 0 if not logged in)
      const followedRes = await fetch('/api/notes?sort=followed_courses&limit=4');
      const followedData = await followedRes.json();
      if (followedData.success) setFollowedNotes(followedData.data.notes);

      // Get popular notes
      const popRes = await fetch('/api/notes?sort=popular&limit=4');
      const popData = await popRes.json();
      if (popData.success) setPopularNotes(popData.data.notes);

      // Get recommended notes (if logged in, but we might not have session immediately in loadData, so we fetch it later or blindly)
      const recRes = await fetch('/api/notes?sort=recommended&limit=4');
      const recData = await recRes.json();
      if (recData.success && recData.data.notes.length > 0) {
        setRecommendedNotes(recData.data.notes);
      }

      // Get recent requests
      const reqRes = await fetch('/api/requests');
      const reqData = await reqRes.json();
      if (reqData.success) {
        setRecentRequests(reqData.data.filter((request: HomeRequest) => request.status === 'pending').slice(0, 4));
      }
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The loader awaits network responses before it updates this page's state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/kesfet?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Paylaşılan not', value: loading ? '—' : siteStats.notes.toLocaleString('tr-TR') },
    { icon: Users, label: 'Öğrenci', value: loading ? '—' : siteStats.users.toLocaleString('tr-TR') },
    { icon: GraduationCap, label: 'Ders', value: loading ? '—' : siteStats.courses.toLocaleString('tr-TR') },
  ];
  const featuredNote = popularNotes[0] || recentNotes[0];

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f9fc]">
      <section className="home-hero relative isolate overflow-hidden bg-navy-950 text-white">
        <div aria-hidden="true" className="home-hero-glow absolute inset-0" />
        <div aria-hidden="true" className="home-hero-grid absolute inset-0 opacity-30" />
        <div className="container-app relative grid items-center gap-12 py-14 sm:py-20 lg:min-h-[570px] lg:grid-cols-[1.04fr_0.96fr] lg:gap-10 lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-xs font-semibold tracking-wide text-teal-200 shadow-inner shadow-white/[0.03] backdrop-blur">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-300/15">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              {UNIVERSITY.shortName} ÖĞRENCİ TOPLULUĞU
              <span className="hidden text-white/40 sm:inline">·</span>
              <span className="hidden text-white/65 sm:inline">{UNIVERSITY.name}</span>
            </div>

            <h1 className="max-w-2xl text-[2.65rem] font-bold leading-[1.06] tracking-[-0.045em] sm:text-6xl lg:text-[4.15rem]">
              Aradığın ders notu{' '}
              <span className="home-hero-accent">burada.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-navy-200 sm:text-lg sm:leading-8">
              Ders notlarını keşfet, kendi birikimini paylaş. Üniversite yolculuğunu birlikte biraz daha kolaylaştıralım.
            </p>

            <form onSubmit={handleSearch} className="mt-8 max-w-xl">
              <label className="sr-only" htmlFor="home-search">Not veya ders ara</label>
              <div className="home-search group flex items-center gap-2 rounded-2xl border border-white/15 bg-white p-1.5 pl-4 shadow-[0_20px_60px_rgba(1,13,26,0.3)] transition-[border-color,box-shadow] duration-200 focus-within:border-teal-300/70 focus-within:shadow-[0_0_0_4px_rgba(79,209,197,0.14),0_20px_60px_rgba(1,13,26,0.3)]">
                <Search className="h-5 w-5 shrink-0 text-navy-400 transition-colors group-focus-within:text-teal-700" />
                <input
                  id="home-search"
                  type="search"
                  placeholder="Ders, konu veya not ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-navy-900 outline-none placeholder:text-navy-400 focus:ring-0 sm:text-base"
                />
                <button type="submit" className="btn btn-teal btn-lg home-search-button">
                  Ara <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-navy-300">
              <span className="mr-1 font-medium text-white/55">Hızlı erişim</span>
              <Link href="/kesfet?sort=popular" className="home-hero-chip">Popüler notlar</Link>
              <Link href="/dersler" className="home-hero-chip">Dersler</Link>
              <Link href="/istekler" className="home-hero-chip">Not istekleri</Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/kesfet" className="btn btn-teal btn-lg">
                <BookOpen className="h-4 w-4" /> Notları keşfet
              </Link>
              <Link href="/yukle" className="btn btn-glass btn-lg">
                <Upload className="h-4 w-4" /> Not paylaş
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[470px] lg:ml-auto">
            <div aria-hidden="true" className="absolute -inset-8 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="home-feature-card relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white p-5 text-navy-900 shadow-[0_32px_90px_rgba(1,13,26,0.32)] sm:p-7">
              <div aria-hidden="true" className="absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-teal-50/80" />
              <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900">Öğrenme alanın</p>
                    <p className="mt-0.5 text-xs text-navy-500">İhtiyacın olan kaynaklar bir arada</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">BANÜ</span>
              </div>

              <div className="home-feature-inner relative mt-6 rounded-2xl bg-[#f5f8fb] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy-400">
                    {featuredNote ? 'Topluluğun seçimi' : 'Paylaşım arşivi'}
                  </span>
                  <TrendingUp className="h-4 w-4 text-teal-700" />
                </div>
                {featuredNote ? (
                  <Link href={`/not/${featuredNote.id}`} className="group mt-4 block">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-navy-100 transition-colors group-hover:bg-teal-50">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-base font-bold leading-snug text-navy-900 transition-colors group-hover:text-teal-800">
                          {featuredNote.title}
                        </p>
                        <p className="mt-1.5 truncate text-xs text-navy-500">
                          {[featuredNote.course_name, featuredNote.faculty_name].filter(Boolean).join(' · ') || 'Ders notu'}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-navy-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-700" />
                    </div>
                    <div className="mt-4 flex items-center gap-4 border-t border-navy-100 pt-3 text-xs text-navy-500">
                      <span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5 text-teal-700" /> {featuredNote.download_count ?? 0} indirme</span>
                      <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" /> Öne çıkan kaynak</span>
                    </div>
                  </Link>
                ) : (
                  <div className="mt-4">
                    <p className="text-lg font-bold text-navy-900">İyi notlar, iyi bir başlangıç.</p>
                    <p className="mt-1 text-sm leading-6 text-navy-500">Ders kaynaklarını keşfet veya topluluğa ilk notunu ekle.</p>
                  </div>
                )}
              </div>

              <Link href="/kesfet?sort=popular" className="group relative mt-4 flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3 transition-colors hover:border-teal-200 hover:bg-teal-50/60">
                <span className="flex items-center gap-2 text-xs font-semibold text-navy-700"><TrendingUp className="h-4 w-4 text-teal-700" /> Popüler kaynakları keşfet</span>
                <ArrowUpRight className="h-4 w-4 text-navy-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-700" />
              </Link>
            </div>
            <div className="home-float-note absolute -bottom-5 -left-4 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-3 shadow-[0_16px_40px_rgba(1,13,26,0.18)] sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><BookOpen className="h-4 w-4" /></span>
              <div>
                <p className="text-xs font-bold text-navy-900">Birlikte daha güçlüyüz</p>
                <p className="mt-0.5 text-[10px] text-navy-500">Paylaş · keşfet · öğren</p>
              </div>
            </div>
          </div>
        </div>
        <div className="home-hero-bottom-rule absolute inset-x-0 bottom-0 h-px" />
      </section>

      {/* Stats */}
      <section className="relative z-10 -mt-1 border-b border-navy-100 bg-white">
        <div className="container-app py-5 sm:py-7">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:justify-between sm:px-6 lg:px-14">
            <p className="hidden max-w-[170px] text-xs font-semibold uppercase leading-5 tracking-[0.12em] text-navy-400 lg:block">
              Öğrenciler için, öğrencilerle birlikte
            </p>
            {stats.map((stat) => (
              <div key={stat.label} className="flex min-w-[88px] items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <stat.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-lg font-extrabold leading-none tracking-tight text-navy-900 sm:text-xl">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-navy-500 sm:text-xs">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Motivation & Quote */}
      <section className="container-app py-8 sm:py-10">
        <ScrollReveal>
          <div className="home-quote-card relative overflow-hidden rounded-2xl border border-teal-100 bg-white px-5 py-5 shadow-[0_12px_35px_rgba(16,42,67,0.045)] sm:px-7">
            <div aria-hidden="true" className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-teal-50" />
            <div className="relative flex items-start gap-4 sm:items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Sparkles className="h-5 w-5" /></span>
              <div className="min-w-0">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Günün sözü</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-navy-800 sm:text-base">&ldquo;{dailyQuote.text}&rdquo;</p>
                <p className="mt-1 text-xs text-navy-500">— {dailyQuote.author}</p>
              </div>
              <BookOpen className="ml-auto hidden h-7 w-7 shrink-0 text-teal-200 sm:block" />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Faculties */}
      <section className="container-app pb-10 sm:pb-14">
        <ExamCountdown />
        <ScrollReveal>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Akademik rehber</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">Fakülteni seç, keşfe başla</h2>
              <p className="mt-2 hidden max-w-xl text-sm leading-6 text-navy-500 sm:block">Bölümüne göre düzenlenmiş ders notlarına birkaç adımda ulaş.</p>
            </div>
            <Link href="/kesfet" className="home-text-link shrink-0">
              Tüm fakülteler <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ScrollReveal stagger>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {faculties.slice(0, 10).map((faculty) => (
                <Link
                  key={faculty.id}
                  href={`/kesfet?faculty=${faculty.id}`}
                  className="home-faculty-card group relative flex min-h-[148px] flex-col items-start overflow-hidden rounded-2xl border border-navy-100 bg-white p-4 text-left shadow-[0_6px_20px_rgba(16,42,67,0.035)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_16px_32px_rgba(16,42,67,0.09)] sm:min-h-[160px] sm:p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 line-clamp-2 text-sm font-bold leading-snug text-navy-800 transition-colors group-hover:text-teal-800">
                    {faculty.short_name || faculty.name}
                  </h3>
                  <div className="mt-auto flex w-full items-center justify-between pt-3">
                    <p className="text-[11px] font-medium text-navy-400">{faculty.type === 'institute' ? 'Enstitü' : faculty.type === 'vocational_school' ? 'Yüksekokul' : 'Fakülte'}</p>
                    <ArrowUpRight className="h-4 w-4 text-navy-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-700" />
                  </div>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </ScrollReveal>
      </section>

      {/* Recent Notes / Followed Courses */}
      <section className="bg-white border-y border-navy-100">
        <div className="container-app py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-1 bg-navy-50 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <button 
                onClick={() => setActiveTab('recent')}
                aria-pressed={activeTab === 'recent'}
                className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${activeTab === 'recent' ? 'bg-white text-teal-800 shadow-sm' : 'text-navy-600 hover:bg-white/60 hover:text-navy-900'}`}
              >
                <Clock className="w-4 h-4" /> Yeni Eklenenler
              </button>
              {session && (
                <button 
                  onClick={() => setActiveTab('followed')}
                  aria-pressed={activeTab === 'followed'}
                  className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${activeTab === 'followed' ? 'bg-white text-teal-800 shadow-sm' : 'text-navy-600 hover:bg-white/60 hover:text-navy-900'}`}
                >
                  <BookOpen className="w-4 h-4" /> Takip Ettiğim Dersler
                </button>
              )}
            </div>
            <Link href={activeTab === 'recent' ? "/kesfet?sort=newest" : "/kesfet?sort=followed_courses"} className="home-text-link shrink-0">
              Tüm notlar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-full" />
                </div>
              ))}
            </div>
          ) : activeTab === 'recent' ? (
            recentNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen className="w-12 h-12" />
                <h3 className="text-lg font-semibold text-navy-800 mt-2">Henüz not eklenmemiş</h3>
                <p className="text-navy-500 mt-1">İlk notu paylaşan sen ol!</p>
                <Link href="/yukle" className="btn btn-teal mt-4">
                  <Upload className="w-4 h-4" /> Not Paylaş
                </Link>
              </div>
            )
          ) : (
            followedNotes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {followedNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <BookOpen className="w-12 h-12" />
                <h3 className="text-lg font-semibold text-navy-800 mt-2">Ders Takibi</h3>
                <p className="text-navy-500 mt-1">Takip ettiğiniz derslerde henüz not yok veya hiç ders takip etmiyorsunuz.</p>
                <Link href="/dersler" className="btn btn-teal mt-4">
                  Dersleri Keşfet
                </Link>
              </div>
            )
          )}
        </div>
      </section>

      {/* Recommended Notes (Sizin İçin) */}
      {session?.user && recommendedNotes.length > 0 && (
        <section className="bg-teal-50/50 border-b border-navy-100">
          <div className="container-app py-10 sm:py-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-teal-600 fill-teal-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Senin İçin Önerilenler</h2>
              </div>
              <Link href="/kesfet?sort=recommended" className="home-text-link">
                Tüm öneriler <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedNotes.map(note => (
                <NoteCard key={`rec-${note.id}`} note={note} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Notes */}
      {popularNotes.length > 0 && (
        <section className="container-app py-10 sm:py-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Popüler Notlar</h2>
            </div>
            <Link href="/kesfet?sort=popular" className="home-text-link">
              Tüm popüler notlar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularNotes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* Active Requests */}
      {recentRequests.length > 0 && (
        <section className="bg-navy-50 border-t border-navy-100">
          <div className="container-app py-10 sm:py-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Güncel Not İstekleri</h2>
              </div>
              <Link href="/istekler" className="home-text-link">
                Tüm istekler <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentRequests.map(req => (
                <Link key={req.id} href="/istekler" className="card p-5 hover:border-teal-300 transition-colors bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-navy-900 text-lg">{req.title}</h3>
                    <span className="badge badge-accent bg-accent-100 text-accent-700">{req.reward_points} Puan</span>
                  </div>
                  <p className="text-sm text-navy-600 line-clamp-2 mb-4">{req.description || 'Açıklama yok'}</p>
                  <div className="flex items-center justify-between text-xs text-navy-500">
                    <span>{req.user_display_name} tarafından istendi</span>
                    <span>{new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-navy-50 border-y border-navy-100">
        <ScrollReveal className="container-app py-10 sm:py-14">
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 text-center mb-8">
            Nasıl Çalışır?
          </h2>
          <ScrollReveal stagger>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { step: '1', title: 'Keşfet', desc: 'Ders veya fakülte seçerek ilgili notları bul.' },
                { step: '2', title: 'İndir', desc: 'İstediğin notu ücretsiz olarak indir.' },
                { step: '3', title: 'Paylaş', desc: 'Kendi notlarını yükleyerek topluluğa katkıda bulun.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-navy-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-navy-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </ScrollReveal>
      </section>

      {/* CTA */}
      <section className="container-app py-10 sm:py-16">
        <ScrollReveal>
          <div className="home-cta relative isolate overflow-hidden rounded-[1.75rem] bg-navy-900 px-6 py-10 text-center text-white shadow-[0_24px_60px_rgba(16,42,67,0.18)] sm:px-12 sm:py-14">
            <div aria-hidden="true" className="home-cta-glow absolute inset-0 -z-10" />
            <div aria-hidden="true" className="home-cta-orbit absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full border border-white/10" />
            <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-teal-200">
              <Sparkles className="h-3.5 w-3.5" /> Topluluğa katıl
            </p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Bir not paylaş, birçok kişiye destek ol.</h2>
            <p className="mx-auto mb-7 mt-3 max-w-lg text-sm leading-6 text-navy-200 sm:text-base">
              Binlerce öğrenciye yardımcı ol. Ders notlarını yükle ve topluluğun bir parçası ol.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/kayit" className="btn btn-teal btn-lg">
                Hemen başla <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/nasil-calisir" className="btn btn-glass btn-lg">
                Daha fazla bilgi
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
