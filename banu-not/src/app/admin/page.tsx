'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, FileText, Flag, Settings, BarChart3,
  Check, X, Eye, Ban, Plus, RefreshCw, BookOpen, ChevronDown
} from 'lucide-react';
import { getNoteTypeLabel, getReportReasonLabel, formatDate } from '@/lib/constants';
import { useToast } from '@/components/Toast';

type Tab = 'dashboard' | 'notes' | 'reports' | 'users' | 'catalog' | 'settings';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const user = session?.user as any;

  const [tab, setTab] = useState<Tab>('dashboard');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteStatus, setNoteStatus] = useState('');
  const [reportStatus, setReportStatus] = useState('pending');

  // Catalog add forms
  const [newFaculty, setNewFaculty] = useState({ name: '', universityId: '', type: 'faculty' });
  const [newDept, setNewDept] = useState({ name: '', facultyId: '' });
  const [newCourse, setNewCourse] = useState({ name: '', code: '', universityId: '', departmentIds: [] as string[] });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (user && user.role !== 'admin' && user.role !== 'moderator') router.push('/');
  }, [user, status]);

  useEffect(() => {
    loadData();
  }, [tab, noteStatus, reportStatus]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ section: tab });
      if (tab === 'notes' && noteStatus) params.set('status', noteStatus);
      if (tab === 'reports') params.set('status', reportStatus);
      
      const res = await fetch(`/api/admin?${params.toString()}`);
      const result = await res.json();
      if (result.success) setData(result.data);
    } catch {} finally { setLoading(false); }
  }

  async function adminAction(action: string, body: any) {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const result = await res.json();
      if (result.success) {
        showToast(result.data.message);
        loadData();
      } else {
        showToast(result.error, 'error');
      }
    } catch { showToast('Hata oluştu.', 'error'); }
  }

  if (status === 'loading' || !user) return <div className="container-app py-8"><div className="skeleton h-8 w-64" /></div>;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Panel', icon: BarChart3 },
    { key: 'notes', label: 'Notlar', icon: FileText },
    { key: 'reports', label: 'Raporlar', icon: Flag },
    { key: 'users', label: 'Kullanıcılar', icon: Users },
    { key: 'catalog', label: 'Katalog', icon: BookOpen },
    { key: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="container-app py-6 sm:py-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-teal-600" /> Yönetim Paneli
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 border-b border-navy-100">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors shrink-0 ${
              tab === t.key ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600' : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-20 w-full rounded-lg" />)}</div>
      ) : (
        <>
          {/* Dashboard */}
          {tab === 'dashboard' && data && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Kullanıcı', value: data.totalUsers, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Not', value: data.totalNotes, color: 'bg-teal-50 text-teal-700' },
                  { label: 'İndirme', value: data.totalDownloads, color: 'bg-green-50 text-green-700' },
                  { label: 'Bekleyen Rapor', value: data.pendingReports, color: 'bg-red-50 text-red-700' },
                ].map((stat, i) => (
                  <div key={i} className={`card p-4 ${stat.color}`}>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm opacity-80">{stat.label}</div>
                  </div>
                ))}
              </div>

              {data.pendingNotes > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-4">
                  {data.pendingNotes} not inceleme bekliyor.
                </div>
              )}

              <h3 className="font-semibold text-navy-900 mb-3">Son Eklenen Notlar</h3>
              <div className="space-y-2">
                {data.recentNotes?.map((n: any) => (
                  <div key={n.id} className="card p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-navy-800">{n.title}</p>
                      <p className="text-xs text-navy-500">{n.user_display_name} • {formatDate(n.created_at)}</p>
                    </div>
                    <span className={`badge ${n.status === 'published' ? 'badge-success' : n.status === 'pending_review' ? 'badge-warning' : 'badge-danger'}`}>
                      {n.status === 'published' ? 'Yayında' : n.status === 'pending_review' ? 'İncelemede' : n.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {tab === 'notes' && data && (
            <div>
              <div className="flex gap-2 mb-4">
                {['', 'published', 'pending_review', 'rejected'].map(s => (
                  <button key={s} onClick={() => setNoteStatus(s)}
                    className={`btn btn-sm ${noteStatus === s ? 'btn-primary' : 'btn-secondary'}`}>
                    {s === '' ? 'Tümü' : s === 'published' ? 'Yayında' : s === 'pending_review' ? 'İncelemede' : 'Reddedildi'}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {data.notes?.map((n: any) => (
                  <div key={n.id} className="card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-navy-900 truncate">{n.title}</p>
                        <p className="text-xs text-navy-500">{n.user_display_name} ({n.user_email}) • {formatDate(n.created_at)}</p>
                        <span className="badge badge-navy mt-1">{getNoteTypeLabel(n.note_type)}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {n.status !== 'published' && (
                          <button onClick={() => adminAction('moderate_note', { noteId: n.id, status: 'published' })}
                            className="btn btn-sm btn-teal" title="Onayla">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {n.status !== 'rejected' && (
                          <button onClick={() => {
                            const reason = prompt('Reddetme nedeni:');
                            if (reason) adminAction('moderate_note', { noteId: n.id, status: 'rejected', reason });
                          }} className="btn btn-sm btn-danger" title="Reddet">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => window.open(`/not/${n.id}`, '_blank')} className="btn btn-sm btn-ghost" title="Görüntüle">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports */}
          {tab === 'reports' && data && (
            <div>
              <div className="flex gap-2 mb-4">
                {['pending', 'reviewing', 'resolved', 'dismissed'].map(s => (
                  <button key={s} onClick={() => setReportStatus(s)}
                    className={`btn btn-sm ${reportStatus === s ? 'btn-primary' : 'btn-secondary'}`}>
                    {s === 'pending' ? 'Bekleyen' : s === 'reviewing' ? 'İncelenen' : s === 'resolved' ? 'Çözülen' : 'Reddedilen'}
                  </button>
                ))}
              </div>
              {Array.isArray(data) && data.length > 0 ? (
                <div className="space-y-3">
                  {data.map((r: any) => (
                    <div key={r.id} className="card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-navy-900">Not: {r.note_title}</p>
                          <p className="text-sm text-navy-600 mt-1">
                            <span className="badge badge-danger">{getReportReasonLabel(r.reason)}</span>
                          </p>
                          {r.details && <p className="text-sm text-navy-500 mt-1">{r.details}</p>}
                          <p className="text-xs text-navy-400 mt-1">Bildiren: {r.reporter_name} • {formatDate(r.created_at)}</p>
                        </div>
                        {r.status === 'pending' && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => adminAction('resolve_report', { reportId: r.id, noteAction: 'removed', resolution: 'İçerik kaldırıldı.' })}
                              className="btn btn-sm btn-danger" title="Notu Kaldır">Kaldır</button>
                            <button onClick={() => adminAction('dismiss_report', { reportId: r.id })}
                              className="btn btn-sm btn-ghost" title="Reddet">Reddet</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><Flag className="w-12 h-12" /><p className="text-navy-500 mt-2">Bu durumda rapor yok.</p></div>
              )}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && data && (
            <div className="space-y-2">
              {data.users?.map((u: any) => (
                <div key={u.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy-900">{u.display_name}</p>
                    <p className="text-xs text-navy-500">{u.email} • {u.note_count} not • {u.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${u.is_banned ? 'badge-danger' : u.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {u.is_banned ? 'Engelli' : u.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => adminAction('ban_user', { userId: u.id, ban: !u.is_banned })}
                        className={`btn btn-sm ${u.is_banned ? 'btn-secondary' : 'btn-ghost text-red-600'}`}
                      >
                        <Ban className="w-4 h-4" />
                        {u.is_banned ? 'Engeli Kaldır' : 'Engelle'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Catalog */}
          {tab === 'catalog' && data && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Fakülte Ekle</h3>
                <div className="flex gap-2 flex-wrap">
                  <select value={newFaculty.universityId}
                    onChange={(e) => setNewFaculty(f => ({ ...f, universityId: e.target.value }))}
                    className="input w-auto">
                    <option value="">Üniversite</option>
                    {data.universities?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <input type="text" value={newFaculty.name}
                    onChange={(e) => setNewFaculty(f => ({ ...f, name: e.target.value }))}
                    className="input flex-1 min-w-[200px]" placeholder="Fakülte adı" />
                  <button onClick={() => {
                    if (newFaculty.name && newFaculty.universityId) {
                      adminAction('add_faculty', newFaculty);
                      setNewFaculty({ name: '', universityId: newFaculty.universityId, type: 'faculty' });
                    }
                  }} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Ekle</button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Bölüm Ekle</h3>
                <div className="flex gap-2 flex-wrap">
                  <select value={newDept.facultyId}
                    onChange={(e) => setNewDept(f => ({ ...f, facultyId: e.target.value }))}
                    className="input w-auto">
                    <option value="">Fakülte</option>
                    {data.faculties?.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <input type="text" value={newDept.name}
                    onChange={(e) => setNewDept(f => ({ ...f, name: e.target.value }))}
                    className="input flex-1 min-w-[200px]" placeholder="Bölüm adı" />
                  <button onClick={() => {
                    if (newDept.name && newDept.facultyId) {
                      adminAction('add_department', newDept);
                      setNewDept({ name: '', facultyId: newDept.facultyId });
                    }
                  }} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Ekle</button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Ders Ekle</h3>
                <div className="flex gap-2 flex-wrap">
                  <input type="text" value={newCourse.code}
                    onChange={(e) => setNewCourse(f => ({ ...f, code: e.target.value }))}
                    className="input w-32" placeholder="Ders kodu" />
                  <input type="text" value={newCourse.name}
                    onChange={(e) => setNewCourse(f => ({ ...f, name: e.target.value }))}
                    className="input flex-1 min-w-[200px]" placeholder="Ders adı" />
                  <button onClick={() => {
                    if (newCourse.name && data.universities?.[0]?.id) {
                      adminAction('add_course', { ...newCourse, universityId: data.universities[0].id });
                      setNewCourse({ name: '', code: '', universityId: '', departmentIds: [] });
                    }
                  }} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Ekle</button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-navy-900 mb-3">Mevcut Fakülteler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {data.faculties?.map((f: any) => (
                    <div key={f.id} className="card p-3 text-sm">
                      <p className="font-medium text-navy-800">{f.name}</p>
                      <p className="text-xs text-navy-500">{f.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && data && (
            <div className="space-y-4">
              {Array.isArray(data) && data.map((s: any) => (
                <div key={s.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy-900">{s.label || s.key}</p>
                    {s.description && <p className="text-xs text-navy-500">{s.description}</p>}
                  </div>
                  {s.type === 'boolean' ? (
                    <button
                      onClick={() => adminAction('update_setting', { key: s.key, value: s.value === 'true' ? 'false' : 'true' })}
                      className={`btn btn-sm ${s.value === 'true' ? 'btn-teal' : 'btn-secondary'}`}
                    >
                      {s.value === 'true' ? 'Açık' : 'Kapalı'}
                    </button>
                  ) : (
                    <input type="text" value={s.value} className="input w-24 text-sm"
                      onBlur={(e) => adminAction('update_setting', { key: s.key, value: e.target.value })}
                      onChange={() => {}} />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
