'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpRight, Ban, BarChart3,
  BookOpen, Building2, CalendarDays, Check, CheckCircle2, ChevronLeft,
  ChevronRight, Clock3, Download, Eye, FileText, Flag, GraduationCap,
  LayoutDashboard, LockKeyhole, MessageSquare, Plus, RefreshCw, Search,
  Settings, Shield, SlidersHorizontal, Unlock, Users, X, type LucideIcon,
} from 'lucide-react';
import { getNoteTypeLabel, getReportReasonLabel, formatDate } from '@/lib/constants';
import { useToast } from '@/components/Toast';

type Tab = 'dashboard' | 'notes' | 'requests' | 'reports' | 'users' | 'catalog' | 'settings';
type AdminData = {
  id?: string;
  role?: string;
  status?: string;
  name?: string;
  title?: string;
  description?: string;
  value?: string;
  key?: string;
  type?: string;
  label?: string;
  email?: string;
  display_name?: string;
  user_display_name?: string;
  user_email?: string;
  note_type?: string;
  course_code?: string;
  code?: string;
  course_name?: string;
  rejection_reason?: string;
  created_at?: string;
  note_count?: number;
  is_active?: number | boolean;
  is_banned?: number | boolean;
  totalUsers?: number;
  activeUsers?: number;
  totalNotes?: number;
  publishedNotes?: number;
  totalDownloads?: number;
  pendingNotes?: number;
  pendingReports?: number;
  recentUsers?: number;
  view_count?: number;
  download_count?: number;
  total?: number;
  page?: number;
  totalPages?: number;
  day?: string;
  dailyUploads?: AdminData[];
  recentNotes?: AdminData[];
  popularNotes?: AdminData[];
  notes?: AdminData[];
  users?: AdminData[];
  requests?: AdminData[];
  universities?: AdminData[];
  faculties?: AdminData[];
  departments?: AdminData[];
  courses?: AdminData[];
  dept_ids?: string | null;
  university_id?: string;
  universityId?: string;
  faculty_id?: string;
  departmentIds?: string[];
  reason?: string;
  details?: string;
  reporter_name?: string;
  target_type?: string;
  note_title?: string;
  comment_content?: string;
  note_id?: string | null;
  fulfilled_note_title?: string;
  noteId?: string;
  reportId?: string;
  userId?: string;
  requestId?: string;
  ban?: boolean;
  active?: boolean;
  resolution?: string;
  noteAction?: string;
};

const TAB_ITEMS: { key: Tab; label: string; icon: LucideIcon; description: string }[] = [
  { key: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard, description: 'Platformun güncel özeti' },
  { key: 'notes', label: 'Not Moderasyonu', icon: FileText, description: 'İçerik ve yayın durumu' },
  { key: 'requests', label: 'Not İstekleri', icon: MessageSquare, description: 'Öğrenci talepleri' },
  { key: 'reports', label: 'Şikayetler', icon: Flag, description: 'Topluluk bildirimleri' },
  { key: 'users', label: 'Kullanıcılar', icon: Users, description: 'Hesap ve erişim yönetimi' },
  { key: 'catalog', label: 'Akademik Katalog', icon: BookOpen, description: 'Fakülte, bölüm ve dersler' },
  { key: 'settings', label: 'Platform Ayarları', icon: Settings, description: 'Yayın ve erişim tercihleri' },
];

const NOTE_FILTERS = [
  { value: '', label: 'Tümü' },
  { value: 'pending_review', label: 'İncelemede' },
  { value: 'published', label: 'Yayında' },
  { value: 'rejected', label: 'Reddedildi' },
] as const;

const REPORT_FILTERS = [
  { value: 'pending', label: 'Bekleyen' },
  { value: 'reviewing', label: 'İnceleniyor' },
  { value: 'resolved', label: 'Çözüldü' },
  { value: 'dismissed', label: 'Kapatıldı' },
] as const;

function getInitials(name?: string) {
  return name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR') || 'BN';
}

function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold text-navy-900">{title}</h3>
      <p className="mt-1 text-sm text-navy-500">{detail}</p>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const userName = session?.user?.name;
  const isAdmin = userRole === 'admin';
  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [reportStatus, setReportStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [rejectingNote, setRejectingNote] = useState<AdminData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [settingValues, setSettingValues] = useState<Record<string, string>>({});
  const [newFaculty, setNewFaculty] = useState({ name: '', universityId: '', type: 'faculty' });
  const [newDept, setNewDept] = useState({ name: '', facultyId: '' });
  const [newCourse, setNewCourse] = useState({ name: '', code: '', universityId: '', departmentIds: [] as string[] });

  const allowedTabs = useMemo(
    () => isAdmin ? TAB_ITEMS : TAB_ITEMS.filter(item => ['dashboard', 'notes', 'requests', 'reports'].includes(item.key)),
    [isAdmin]
  );

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ section: tab });
      if (tab === 'notes') {
        if (noteStatus) params.set('status', noteStatus);
        if (search) params.set('q', search);
        params.set('page', String(page));
      }
      if (tab === 'reports') params.set('status', reportStatus);
      if (tab === 'users') {
        if (search) params.set('q', search);
        params.set('page', String(page));
      }

      const response = await fetch(`/api/admin?${params.toString()}`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Panel verileri yüklenemedi.');
      }
      setData(result.data);
      setLoadError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Panel verileri yüklenemedi.';
      setLoadError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [noteStatus, page, reportStatus, search, tab]);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/giris');
    if (status === 'authenticated' && userRole !== 'admin' && userRole !== 'moderator') router.replace('/');
  }, [router, status, userRole]);

  useEffect(() => {
    if (status === 'authenticated' && (userRole === 'admin' || userRole === 'moderator')) {
      const timer = window.setTimeout(() => { void loadData(); }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadData, status, userRole]);

  async function adminAction(action: string, body: AdminData) {
    setLoading(true);
    setPendingAction(action + (body.noteId || body.reportId || body.userId || body.requestId || body.key || ''));
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'İşlem tamamlanamadı.');
      }
      showToast(result.data.message, 'success');
      await loadData();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'İşlem tamamlanamadı.';
      showToast(message, 'error');
      return false;
    } finally {
      setPendingAction('');
    }
  }

  function changeTab(nextTab: Tab) {
    setLoading(true);
    setData(null);
    setTab(nextTab);
    setPage(1);
    setSearch('');
    setSearchInput('');
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setPage(nextPage);
  }

  async function submitRejection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectingNote) return;
    const completed = await adminAction('moderate_note', {
      noteId: rejectingNote.id,
      status: 'rejected',
      reason: rejectionReason.trim(),
    });
    if (completed) {
      setRejectingNote(null);
      setRejectionReason('');
    }
  }

  if (status === 'loading' || !session?.user) {
    return (
      <div className="container-app py-10">
        <div className="skeleton h-9 w-56 rounded-xl" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const currentTab = TAB_ITEMS.find(item => item.key === tab) || TAB_ITEMS[0];
  const content: AdminData = Array.isArray(data) ? {} : data || {};
  const pageData: AdminData[] = content.notes ?? content.users ?? [];
  const pagination = content.totalPages
    ? { page: content.page || page, totalPages: content.totalPages, total: content.total || 0 }
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f5f7fa]">
      <div className="container-app py-6 sm:py-9">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              BANÜ NOT <span className="text-teal-300">/</span> {isAdmin ? 'Yönetim alanı' : 'Moderasyon'}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-950 sm:text-4xl">Kontrol merkezi</h1>
            <p className="mt-2 max-w-2xl text-sm text-navy-500 sm:text-base">
              Platformu, içerikleri ve öğrenci topluluğunu tek bir yerden yönetin.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-navy-100 bg-white px-3 py-2 text-sm text-navy-500 shadow-sm sm:flex">
              <CalendarDays className="h-4 w-4 text-teal-700" />
              {new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date())}
            </div>
            <button
              type="button"
              onClick={() => { setLoading(true); void loadData(); }}
              disabled={loading}
              className="btn btn-secondary"
              aria-label="Panel verilerini yenile"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Yenile</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-navy-100 bg-white p-3 shadow-[0_8px_30px_rgba(16,42,67,0.04)] xl:sticky xl:top-24">
            <div className="hidden items-center gap-3 rounded-xl bg-navy-950 p-4 text-white xl:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Shield className="h-5 w-5 text-teal-300" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName || 'Yönetici'}</p>
                <p className="mt-0.5 text-xs text-navy-300">{isAdmin ? 'Platform yöneticisi' : 'İçerik moderatörü'}</p>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto xl:mt-3 xl:flex-col" aria-label="Yönetim bölümleri">
              {allowedTabs.map(item => {
                const Icon = item.icon;
                const selected = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => changeTab(item.key)}
                    aria-current={selected ? 'page' : undefined}
                    className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors xl:w-full ${
                      selected ? 'bg-teal-50 text-teal-800' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-teal-700' : 'text-navy-400 group-hover:text-navy-600'}`} />
                    <span className="whitespace-nowrap text-sm font-semibold">{item.label}</span>
                    {selected && <ChevronRight className="ml-auto hidden h-4 w-4 xl:block" />}
                  </button>
                );
              })}
            </nav>
            <div className="mt-3 hidden rounded-xl border border-navy-100 bg-navy-50/70 p-3 xl:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-navy-700">
                <Activity className="h-3.5 w-3.5 text-teal-700" /> Sistem durumu
              </div>
              <p className="mt-1 text-xs leading-relaxed text-navy-500">Veritabanı ve API yanıtları izleniyor.</p>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-400">{currentTab.description}</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-navy-900">{currentTab.label}</h2>
              </div>
              {tab !== 'dashboard' && (
                <span className="hidden rounded-full border border-navy-100 bg-white px-3 py-1.5 text-xs text-navy-500 sm:inline-flex">
                  {loading ? 'Güncelleniyor…' : 'Canlı veriler'}
                </span>
              )}
            </div>

            {loadError && (
              <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1">{loadError}</div>
                <button type="button" onClick={() => { setLoading(true); void loadData(); }} className="font-semibold underline underline-offset-2">Tekrar dene</button>
              </div>
            )}

            {loading && !data ? (
              <div className="space-y-4">
                <div className="skeleton h-36 rounded-2xl" />
                <div className="grid gap-4 sm:grid-cols-2"><div className="skeleton h-40 rounded-2xl" /><div className="skeleton h-40 rounded-2xl" /></div>
              </div>
            ) : (
              <>
                {tab === 'dashboard' && data && (
                  <Dashboard data={content} onNavigate={changeTab} />
                )}

                {tab === 'notes' && (
                  <section className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-1 overflow-x-auto">
                        {NOTE_FILTERS.map(filter => (
                          <button
                            key={filter.value}
                            type="button"
                            onClick={() => { setLoading(true); setNoteStatus(filter.value); setPage(1); }}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                              noteStatus === filter.value ? 'bg-navy-950 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800'
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                      <SearchForm value={searchInput} onChange={setSearchInput} onSubmit={submitSearch} placeholder="Not, ders veya öğrenci ara" />
                    </div>
                    {pageData.length ? (
                      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
                        <div className="hidden grid-cols-[minmax(0,1.8fr)_minmax(130px,1fr)_110px_140px] gap-4 border-b border-navy-100 bg-navy-50/70 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-navy-400 lg:grid">
                          <span>Not ve ders</span><span>Paylaşan</span><span>Durum</span><span className="text-right">İşlemler</span>
                        </div>
                        {pageData.map((note: AdminData) => (
                          <div key={note.id || note.title} className="grid gap-3 border-b border-navy-100 p-4 last:border-b-0 sm:p-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(130px,1fr)_110px_140px] lg:items-center lg:gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="badge badge-navy">{getNoteTypeLabel(note.note_type || '')}</span>
                                {note.course_code && <span className="text-xs font-semibold text-teal-800">{note.course_code}</span>}
                              </div>
                              <p className="mt-2 truncate font-semibold text-navy-900">{note.title}</p>
                              <p className="mt-1 text-xs text-navy-500">{note.course_name || 'Ders belirtilmemiş'} · {formatDate(note.created_at || new Date())}</p>
                              {note.rejection_reason && <p className="mt-1 line-clamp-2 text-xs text-red-700">{note.rejection_reason}</p>}
                            </div>
                            <div className="text-sm text-navy-700">
                              <p className="font-medium">{note.user_display_name}</p>
                              <p className="mt-0.5 truncate text-xs text-navy-400">{note.user_email}</p>
                            </div>
                            <StatusBadge status={note.status || ''} />
                            <div className="flex items-center gap-1 lg:justify-end">
                              {note.status !== 'published' && (
                                <button
                                  type="button"
                                  title="Yayınla"
                                  aria-label={`${note.title} notunu yayınla`}
                                  disabled={Boolean(pendingAction)}
                                  onClick={() => void adminAction('moderate_note', { noteId: note.id || '', status: 'published' })}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-800 transition-colors hover:bg-teal-100 disabled:opacity-50"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              {note.status !== 'rejected' && (
                                <button
                                  type="button"
                                  title="Reddet"
                                  aria-label={`${note.title} notunu reddet`}
                                  disabled={Boolean(pendingAction)}
                                  onClick={() => { setRejectingNote(note); setRejectionReason(''); }}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                              <a
                                href={`/not/${note.id || ''}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Notu görüntüle"
                                aria-label={`${note.title} notunu görüntüle`}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-900"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={FileText} title="Bu filtrede not yok" detail="Durum filtresini değiştirebilir veya aramanızı temizleyebilirsiniz." />
                    )}
                    {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={changePage} />}
                  </section>
                )}

                {tab === 'reports' && (
                  <section className="space-y-4">
                    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-navy-100 bg-white p-2 shadow-sm">
                      {REPORT_FILTERS.map(filter => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => { setLoading(true); setReportStatus(filter.value); }}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            reportStatus === filter.value ? 'bg-navy-950 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-800'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                    {Array.isArray(data) && data.length ? data.map((report: AdminData) => (
                      <article key={report.id || report.title} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="badge badge-danger">{getReportReasonLabel(report.reason || '')}</span>
                              <StatusBadge status={report.status || ''} />
                              <span className="text-xs text-navy-400">{formatDate(report.created_at || new Date())}</span>
                            </div>
                            <h3 className="mt-3 font-semibold text-navy-900">
                              {report.target_type === 'comment' ? 'Yorum bildirimi' : report.target_type === 'user' ? 'Kullanıcı bildirimi' : 'Not bildirimi'}
                            </h3>
                            {report.comment_content && <p className="mt-2 rounded-xl bg-navy-50 p-3 text-sm text-navy-700">“{report.comment_content}”</p>}
                            {report.note_title && <p className="mt-1 text-sm text-navy-600">İlgili not: <span className="font-medium text-navy-800">{report.note_title}</span></p>}
                            {report.details && <p className="mt-2 text-sm leading-relaxed text-navy-600">{report.details}</p>}
                            <p className="mt-3 text-xs text-navy-400">Bildirimi yapan {report.reporter_name}</p>
                          </div>
                          {['pending', 'reviewing'].includes(report.status || '') && (
                            <div className="flex shrink-0 flex-wrap gap-2">
                              {report.status === 'pending' && (
                                <button type="button" disabled={Boolean(pendingAction)} onClick={() => void adminAction('review_report', { reportId: report.id || '' })} className="btn btn-secondary btn-sm">
                                  <Eye className="h-4 w-4" /> İncele
                                </button>
                              )}
                              <button type="button" disabled={Boolean(pendingAction)} onClick={() => void adminAction('resolve_report', { reportId: report.id || '', noteAction: 'removed', resolution: 'İçerik kaldırıldı.' })} className="btn btn-danger btn-sm">
                                <X className="h-4 w-4" /> Kaldır
                              </button>
                              <button type="button" disabled={Boolean(pendingAction)} onClick={() => void adminAction('dismiss_report', { reportId: report.id || '' })} className="btn btn-ghost btn-sm">
                                Kapat
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    )) : (
                      <EmptyState icon={Flag} title="Şikayet bulunmuyor" detail="Seçili durumdaki bildirimler burada listelenir." />
                    )}
                  </section>
                )}

                {tab === 'requests' && (
                  <RequestList requests={content.requests ?? []} pendingAction={pendingAction} onAction={adminAction} />
                )}

                {tab === 'users' && (
                  <section className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-navy-500">Hesap durumlarını inceleyin ve kötüye kullanımı yönetin.</p>
                      <SearchForm value={searchInput} onChange={setSearchInput} onSubmit={submitSearch} placeholder="Ad veya e-posta ara" />
                    </div>
                    {pageData.length ? (
                      <div className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
                        {pageData.map((account: AdminData) => (
                          <div key={account.id} className="flex flex-col gap-4 border-b border-navy-100 p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-blue-100 text-sm font-bold text-teal-900">
                                {getInitials(account.display_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-navy-900">{account.display_name}</p>
                                <p className="truncate text-sm text-navy-500">{account.email}</p>
                                <p className="mt-1 text-xs text-navy-400">{account.note_count || 0} not · {formatDate(account.created_at || new Date())} · {account.role || 'user'}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge status={account.is_banned ? 'banned' : account.is_active ? 'active' : 'inactive'} />
                              {account.role !== 'admin' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={Boolean(pendingAction)}
                                    onClick={() => void adminAction('ban_user', { userId: account.id || '', ban: !account.is_banned })}
                                    className={`btn btn-sm ${account.is_banned ? 'btn-secondary' : 'btn-ghost text-red-700'}`}
                                  >
                                    {account.is_banned ? <Unlock className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                                    {account.is_banned ? 'Engeli kaldır' : 'Engelle'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={Boolean(pendingAction)}
                                    onClick={() => void adminAction('set_user_active', { userId: account.id || '', active: !account.is_active })}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    {account.is_active ? <LockKeyhole className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    {account.is_active ? 'Pasifleştir' : 'Etkinleştir'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <EmptyState icon={Users} title="Kullanıcı bulunamadı" detail="Arama ölçütlerinizi değiştirip yeniden deneyin." />}
                    {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={changePage} />}
                  </section>
                )}

                {tab === 'catalog' && (
                  <CatalogManager
                    data={content}
                    newFaculty={newFaculty}
                    setNewFaculty={setNewFaculty}
                    newDept={newDept}
                    setNewDept={setNewDept}
                    newCourse={newCourse}
                    setNewCourse={setNewCourse}
                    pendingAction={pendingAction}
                    onAction={adminAction}
                  />
                )}

                {tab === 'settings' && (
                  <SettingsManager settings={Array.isArray(data) ? data : []} values={settingValues} onChange={setSettingValues} onSave={adminAction} pendingAction={pendingAction} />
                )}
              </>
            )}
          </section>
        </div>
      </div>

      {rejectingNote && (
        <div className="modal-overlay" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setRejectingNote(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="reject-title" className="modal-content p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red-700">İçerik moderasyonu</p>
                <h2 id="reject-title" className="mt-1 text-xl font-bold text-navy-900">Notu reddet</h2>
              </div>
              <button type="button" onClick={() => setRejectingNote(null)} className="rounded-lg p-2 text-navy-400 hover:bg-navy-50 hover:text-navy-700" aria-label="Pencereyi kapat"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-navy-600">{rejectingNote.title}</p>
            <form onSubmit={submitRejection}>
              <label htmlFor="rejection-reason" className="label">Kullanıcıya iletilecek açıklama</label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={event => setRejectionReason(event.target.value)}
                className="input min-h-28 resize-y"
                maxLength={500}
                placeholder="Eksik veya düzeltilmesi gereken noktaları yazın…"
                required
              />
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setRejectingNote(null)} className="btn btn-secondary">Vazgeç</button>
                <button type="submit" disabled={!rejectionReason.trim() || Boolean(pendingAction)} className="btn btn-danger">
                  {pendingAction ? 'Kaydediliyor…' : 'Reddet ve bildir'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function Dashboard({ data, onNavigate }: { data: AdminData; onNavigate: (tab: Tab) => void }) {
  const metrics = [
    { label: 'Aktif öğrenci', value: data.activeUsers || 0, note: `${data.recentUsers || 0} son 7 günde katıldı`, icon: Users, tone: 'text-blue-700 bg-blue-50' },
    { label: 'Yayındaki not', value: data.publishedNotes || 0, note: `${data.totalNotes || 0} toplam içerik`, icon: FileText, tone: 'text-teal-800 bg-teal-50' },
    { label: 'Not indirme', value: data.totalDownloads || 0, note: 'Topluluk etkileşimi', icon: Download, tone: 'text-violet-700 bg-violet-50' },
    { label: 'İnceleme kuyruğu', value: data.pendingNotes || 0, note: `${data.pendingReports || 0} bekleyen şikayet`, icon: Clock3, tone: 'text-amber-800 bg-amber-50' },
  ];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { key, label: new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(date) };
  });
  const counts = new Map<string, number>();
  (data.dailyUploads || []).forEach(row => {
    if (row.day && typeof row.total === 'number') counts.set(row.day, row.total);
  });
  const chartValues = days.map(day => ({ ...day, count: Number(counts.get(day.key) || 0) }));
  const maxCount = Math.max(1, ...chartValues.map(day => day.count));
  const popularNotes = data.popularNotes || [];
  const recentNotes = data.recentNotes || [];

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-[#174f5a] p-6 text-white shadow-[0_18px_45px_rgba(16,42,67,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
            <Activity className="h-3.5 w-3.5" /> Platform özeti
          </div>
          <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">Merhaba, {data.totalUsers ? 'ekip' : 'yönetici'}.</h3>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-200 sm:text-base">
            Öğrenci katkıları büyümeye devam ediyor. Bekleyen içerikleri gözden geçirerek paylaşım deneyimini canlı tutun.
          </p>
          <button type="button" onClick={() => onNavigate('notes')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-teal-50">
            İnceleme kuyruğuna git <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute bottom-5 right-6 hidden h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 sm:flex">
          <GraduationCap className="h-11 w-11 text-teal-200" strokeWidth={1.4} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-[0_5px_20px_rgba(16,42,67,0.035)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-navy-500 sm:text-sm">{metric.label}</span>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-navy-950 sm:text-3xl">{Number(metric.value).toLocaleString('tr-TR')}</p>
              <p className="mt-1 truncate text-xs text-navy-400">{metric.note}</p>
            </article>
          );
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 2xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-400">İçerik hareketi</p>
              <h3 className="mt-1 text-lg font-bold text-navy-900">Son 7 gün</h3>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><BarChart3 className="h-4 w-4" /></span>
          </div>
          <div className="flex h-44 items-end gap-2 border-b border-navy-100 pb-2 sm:gap-4">
            {chartValues.map(day => (
              <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-semibold text-navy-400">{day.count || ''}</span>
                <div className="flex h-[72%] w-full items-end justify-center">
                  <div
                    title={`${day.label}: ${day.count} yeni not`}
                    className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-teal-700 to-teal-400 transition-[height] duration-200"
                    style={{ height: `${Math.max(day.count ? 13 : 4, day.count / maxCount * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium capitalize text-navy-400">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-navy-400"><span className="h-2 w-2 rounded-full bg-teal-500" /> Yeni paylaşılan notlar</div>
        </section>

        <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-400">Topluluk</p>
              <h3 className="mt-1 text-lg font-bold text-navy-900">En çok indirilenler</h3>
            </div>
            <Download className="h-4 w-4 text-navy-400" />
          </div>
          <div className="space-y-1">
            {popularNotes.length ? popularNotes.map((note, index) => (
              <a key={note.id || note.title} href={`/not/${note.id || ''}`} className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-navy-50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-xs font-bold text-navy-500 group-hover:bg-white">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-800">{note.title}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-800"><Download className="h-3.5 w-3.5" />{note.download_count}</span>
              </a>
            )) : <p className="py-8 text-center text-sm text-navy-400">Henüz indirme verisi yok.</p>}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-400">Yeni katkılar</p>
            <h3 className="mt-1 font-bold text-navy-900">Son eklenen notlar</h3>
          </div>
          <button type="button" onClick={() => onNavigate('notes')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-950">
            Tüm notlar <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          {recentNotes.length ? recentNotes.map(note => (
            <div key={note.id || note.title} className="flex items-center gap-3 border-b border-navy-50 px-5 py-4 last:border-0 sm:px-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500"><FileText className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900">{note.title}</p>
                <p className="mt-1 truncate text-xs text-navy-400">{note.user_display_name} · {note.course_name || 'Ders belirtilmemiş'} · {formatDate(note.created_at || new Date())}</p>
              </div>
              <StatusBadge status={note.status || ''} />
            </div>
          )) : <div className="p-10 text-center text-sm text-navy-400">Henüz not paylaşılmamış.</div>}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string | undefined }) {
  const statusKey = status || '';
  const labels: Record<string, string> = {
    published: 'Yayında', pending_review: 'İncelemede', rejected: 'Reddedildi', removed: 'Kaldırıldı',
    pending: 'Bekliyor', reviewing: 'İnceleniyor', resolved: 'Çözüldü', dismissed: 'Kapatıldı',
    open: 'Açık', closed: 'Kapalı', fulfilled: 'Karşılandı', active: 'Aktif', inactive: 'Pasif', banned: 'Engelli',
  };
  const tones: Record<string, string> = {
    published: 'bg-teal-50 text-teal-800 ring-teal-200', active: 'bg-teal-50 text-teal-800 ring-teal-200',
    pending_review: 'bg-amber-50 text-amber-800 ring-amber-200', pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    reviewing: 'bg-blue-50 text-blue-800 ring-blue-200', open: 'bg-blue-50 text-blue-800 ring-blue-200',
    resolved: 'bg-slate-100 text-slate-700 ring-slate-200', fulfilled: 'bg-teal-50 text-teal-800 ring-teal-200',
    rejected: 'bg-red-50 text-red-800 ring-red-200', removed: 'bg-red-50 text-red-800 ring-red-200',
    dismissed: 'bg-slate-100 text-slate-600 ring-slate-200', banned: 'bg-red-50 text-red-800 ring-red-200',
    inactive: 'bg-slate-100 text-slate-600 ring-slate-200', closed: 'bg-slate-100 text-slate-600 ring-slate-200',
  };
  return <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tones[statusKey] || 'bg-navy-50 text-navy-700 ring-navy-200'}`}>{labels[statusKey] || statusKey}</span>;
}

function SearchForm({
  value,
  onChange,
  onSubmit,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  placeholder: string;
}) {
  return (
    <form onSubmit={onSubmit} className="flex w-full gap-2 sm:max-w-sm">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input value={value} onChange={event => onChange(event.target.value)} className="input pl-9" placeholder={placeholder} />
      </label>
      <button type="submit" className="btn btn-primary btn-sm">Ara</button>
    </form>
  );
}

function Pagination({ page, totalPages, total, onChange }: { page: number | undefined; totalPages: number | undefined; total: number; onChange: (page: number) => void }) {
  const currentPage = page || 1;
  const pageCount = totalPages || 1;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-navy-100 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-navy-500">Toplam <span className="font-semibold text-navy-800">{total}</span> kayıt · Sayfa {currentPage}/{pageCount}</p>
      <div className="flex gap-2">
        <button type="button" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)} className="btn btn-secondary btn-sm"><ChevronLeft className="h-4 w-4" /> Önceki</button>
        <button type="button" disabled={currentPage >= pageCount} onClick={() => onChange(currentPage + 1)} className="btn btn-secondary btn-sm">Sonraki <ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function RequestList({ requests, pendingAction, onAction }: { requests: AdminData[]; pendingAction: string; onAction: (action: string, body: AdminData) => Promise<boolean> }) {
  if (!requests.length) return <EmptyState icon={MessageSquare} title="Henüz not isteği yok" detail="Öğrencilerin açtığı talepler burada görüntülenir." />;
  return (
    <div className="space-y-3">
      {requests.map(request => (
        <article key={request.id || request.title} className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={request.status} /><span className="text-xs text-navy-400">{formatDate(request.created_at || new Date())}</span></div>
              <h3 className="mt-3 font-semibold text-navy-900">{request.title}</h3>
              {request.description && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-navy-600">{request.description}</p>}
              <p className="mt-3 text-xs text-navy-400">İsteyen: {request.user_display_name || 'Silinmiş kullanıcı'}</p>
              {request.fulfilled_note_title && <p className="mt-1 text-xs text-teal-800">Paylaşılan not: {request.fulfilled_note_title}</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              {(request.status === 'open' || request.status === 'closed') && (
                <button type="button" disabled={Boolean(pendingAction)} onClick={() => void onAction('update_request_status', { requestId: request.id || '', status: request.status === 'open' ? 'closed' : 'open' })} className="btn btn-secondary btn-sm">
                  {request.status === 'open' ? 'Kapat' : 'Yeniden aç'}
                </button>
              )}
              <button type="button" disabled={Boolean(pendingAction)} onClick={() => {
                if (window.confirm('Bu not isteğini silmek istediğinizden emin misiniz?')) {
                  void onAction('delete_request', { requestId: request.id || '' });
                }
              }} className="btn btn-ghost btn-sm text-red-700"><X className="h-4 w-4" /> Sil</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function CatalogManager({
  data,
  newFaculty,
  setNewFaculty,
  newDept,
  setNewDept,
  newCourse,
  setNewCourse,
  pendingAction,
  onAction,
}: {
  data: AdminData;
  newFaculty: { name: string; universityId: string; type: string };
  setNewFaculty: (value: { name: string; universityId: string; type: string }) => void;
  newDept: { name: string; facultyId: string };
  setNewDept: (value: { name: string; facultyId: string }) => void;
  newCourse: { name: string; code: string; universityId: string; departmentIds: string[] };
  setNewCourse: (value: { name: string; code: string; universityId: string; departmentIds: string[] }) => void;
  pendingAction: string;
  onAction: (action: string, body: AdminData) => Promise<boolean>;
}) {
  const universities = data.universities || [];
  const facultyList = data.faculties || [];
  const departments = data.departments || [];
  const courses = data.courses || [];
  const selectedUniversityId = newCourse.universityId || universities[0]?.id || '';
  const visibleFaculties = facultyList.filter((faculty: AdminData) => faculty.university_id === selectedUniversityId);
  const visibleDepartments = departments.filter((department: AdminData) => visibleFaculties.some((faculty: AdminData) => faculty.id === department.faculty_id));
  return (
    <div className="space-y-5">
      <div className="grid gap-4 2xl:grid-cols-3">
        <CatalogForm title="Fakülte / birim ekle" icon={Building2}>
          <select value={newFaculty.universityId || universities[0]?.id || ''} onChange={event => setNewFaculty({ ...newFaculty, universityId: event.target.value })} className="input">
            <option value="">Üniversite seçin</option>
            {universities.map((university: AdminData) => <option key={university.id || university.name} value={university.id || ''}>{university.name}</option>)}
          </select>
          <input value={newFaculty.name} onChange={event => setNewFaculty({ ...newFaculty, name: event.target.value })} className="input" placeholder="Örn. Mühendislik Fakültesi" maxLength={120} />
          <select value={newFaculty.type} onChange={event => setNewFaculty({ ...newFaculty, type: event.target.value })} className="input">
            <option value="faculty">Fakülte</option><option value="institute">Enstitü</option><option value="vocational_school">Yüksekokul</option><option value="conservatory">Konservatuvar</option>
          </select>
          <button type="button" disabled={!newFaculty.name.trim() || Boolean(pendingAction)} onClick={async () => {
            const done = await onAction('add_faculty', { ...newFaculty, universityId: newFaculty.universityId || universities[0]?.id });
            if (done) setNewFaculty({ ...newFaculty, name: '' });
          }} className="btn btn-primary w-full"><Plus className="h-4 w-4" /> Birim ekle</button>
        </CatalogForm>

        <CatalogForm title="Bölüm ekle" icon={GraduationCap}>
          <select value={newDept.facultyId} onChange={event => setNewDept({ ...newDept, facultyId: event.target.value })} className="input">
            <option value="">Fakülte seçin</option>
            {facultyList.map((faculty: AdminData) => <option key={faculty.id || faculty.name} value={faculty.id || ''}>{faculty.name}</option>)}
          </select>
          <input value={newDept.name} onChange={event => setNewDept({ ...newDept, name: event.target.value })} className="input" placeholder="Örn. Bilgisayar Mühendisliği" maxLength={120} />
          <p className="text-xs leading-relaxed text-navy-400">Bölüm, seçilen fakültenin akademik kataloğuna eklenir.</p>
          <button type="button" disabled={!newDept.name.trim() || !newDept.facultyId || Boolean(pendingAction)} onClick={async () => {
            const done = await onAction('add_department', newDept);
            if (done) setNewDept({ ...newDept, name: '' });
          }} className="btn btn-primary w-full"><Plus className="h-4 w-4" /> Bölüm ekle</button>
        </CatalogForm>

        <CatalogForm title="Ders ekle" icon={BookOpen}>
          <select value={selectedUniversityId} onChange={event => setNewCourse({ ...newCourse, universityId: event.target.value, departmentIds: [] })} className="input">
            <option value="">Üniversite seçin</option>
            {universities.map((university: AdminData) => <option key={university.id || university.name} value={university.id || ''}>{university.name}</option>)}
          </select>
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <input value={newCourse.code} onChange={event => setNewCourse({ ...newCourse, code: event.target.value })} className="input" placeholder="Ders kodu" maxLength={30} />
            <input value={newCourse.name} onChange={event => setNewCourse({ ...newCourse, name: event.target.value })} className="input" placeholder="Ders adı" maxLength={120} />
          </div>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-navy-100 p-2">
            {visibleDepartments.length ? visibleDepartments.map((department: AdminData) => {
              const departmentId = department.id;
              if (!departmentId) return null;
              return (
                <label key={departmentId} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-navy-600 hover:bg-navy-50">
                  <input
                    type="checkbox"
                    checked={newCourse.departmentIds.includes(departmentId)}
                    onChange={event => setNewCourse({
                      ...newCourse,
                      departmentIds: event.target.checked
                        ? [...newCourse.departmentIds, departmentId]
                        : newCourse.departmentIds.filter(id => id !== departmentId),
                    })}
                  />
                  <span className="truncate">{department.name}</span>
                </label>
              );
            }) : <p className="p-2 text-xs text-navy-400">Önce bu üniversite için bölüm ekleyin.</p>}
          </div>
          <button type="button" disabled={!newCourse.name.trim() || !selectedUniversityId || Boolean(pendingAction)} onClick={async () => {
            const done = await onAction('add_course', { ...newCourse, universityId: selectedUniversityId });
            if (done) setNewCourse({ ...newCourse, name: '', code: '', departmentIds: [] });
          }} className="btn btn-teal w-full"><Plus className="h-4 w-4" /> Dersi kataloğa ekle</button>
        </CatalogForm>
      </div>

      <section className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-navy-400">Katalog</p><h3 className="mt-1 font-bold text-navy-900">Mevcut akademik yapı</h3></div>
          <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-600">{facultyList.length} birim · {departments.length} bölüm · {courses.length} ders</span>
        </div>
        <div className="space-y-2">
          {facultyList.map((faculty: AdminData) => {
            const childDepartments = departments.filter((department: AdminData) => department.faculty_id === faculty.id);
            return (
              <details key={faculty.id || faculty.name} className="group rounded-xl border border-navy-100 bg-white open:bg-navy-50/40">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 sm:p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Building2 className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-navy-900">{faculty.name}</span><span className="mt-0.5 block text-xs text-navy-400">{childDepartments.length} bölüm</span></span>
                  <ChevronRight className="h-4 w-4 text-navy-400 transition-transform group-open:rotate-90" />
                </summary>
                <div className="grid gap-2 border-t border-navy-100 px-3 py-3 sm:grid-cols-2 sm:px-4">
                  {childDepartments.map((department: AdminData) => (
                    <div key={department.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-navy-600">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0 text-teal-700" />{department.name}
                    </div>
                  ))}
                  {courses.filter((course: AdminData) => (course.dept_ids || '').split(',').some((id: string) => childDepartments.some((department: AdminData) => department.id === id))).map((course: AdminData) => (
                    <div key={course.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs text-navy-600 sm:col-span-2">
                      <span className="truncate"><BookOpen className="mr-2 inline h-3.5 w-3.5 text-teal-700" />{course.name}</span>
                      <span className="shrink-0 font-semibold text-navy-400">{course.code || 'Kodsuz'}</span>
                    </div>
                  ))}
                  {!childDepartments.length && <p className="text-xs text-navy-400">Bu birimde henüz bölüm yok.</p>}
                </div>
              </details>
            );
          })}
          {!facultyList.length && <p className="py-8 text-center text-sm text-navy-400">Katalog henüz boş.</p>}
        </div>
      </section>
    </div>
  );
}

function CatalogForm({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-800"><Icon className="h-4 w-4" /></span>
        <h3 className="font-bold text-navy-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SettingsManager({
  settings,
  values,
  onChange,
  onSave,
  pendingAction,
}: {
  settings: AdminData[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onSave: (action: string, body: AdminData) => Promise<boolean>;
  pendingAction: string;
}) {
  if (!settings.length) return <EmptyState icon={SlidersHorizontal} title="Ayar bulunamadı" detail="Veritabanında henüz platform ayarı tanımlanmamış." />;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-navy-950 p-5 text-white sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal-200"><SlidersHorizontal className="h-5 w-5" /></div>
          <div><h3 className="font-bold">Platform tercihleri</h3><p className="mt-1 text-sm text-navy-300">Değişiklikler kaydedildiği anda ilgili akışlarda uygulanır.</p></div>
        </div>
      </div>
      {settings.map(setting => {
        const settingKey = setting.key;
        if (!settingKey) return null;
        const value = values[settingKey] ?? setting.value ?? '';
        const changed = value !== (setting.value ?? '');
        return (
          <section key={setting.id || settingKey} className="flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0 sm:max-w-xl">
              <p className="font-semibold text-navy-900">{setting.label || settingKey}</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-500">{setting.description || settingKey}</p>
              <code className="mt-2 inline-block rounded bg-navy-50 px-2 py-1 text-[10px] text-navy-500">{settingKey}</code>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {setting.type === 'boolean' ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={value === 'true'}
                  onClick={() => onChange({ ...values, [settingKey]: value === 'true' ? 'false' : 'true' })}
                  className={`relative h-8 w-14 rounded-full transition-colors ${value === 'true' ? 'bg-teal-700' : 'bg-navy-200'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${value === 'true' ? 'translate-x-7' : 'translate-x-1'}`} />
                  <span className="sr-only">{value === 'true' ? 'Açık' : 'Kapalı'}</span>
                </button>
              ) : (
                <input
                  type={setting.type === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={event => onChange({ ...values, [settingKey]: event.target.value })}
                  className="input w-28"
                  min={setting.type === 'number' ? 1 : undefined}
                  max={setting.type === 'number' ? 100 : undefined}
                  aria-label={setting.label || settingKey}
                />
              )}
              <button
                type="button"
                disabled={!changed || Boolean(pendingAction)}
                onClick={() => void onSave('update_setting', { key: settingKey, value })}
                className={`btn btn-sm ${changed ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Check className="h-4 w-4" /> Kaydet
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
