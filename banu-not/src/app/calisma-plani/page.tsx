'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, Check, Clock3, Download, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

type StudyTask = {
  id: string;
  title: string;
  due_at: string;
  is_done: number;
  course_id: string | null;
  course_name: string | null;
  note_id: string | null;
};

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export default function StudyPlanPage() {
  const { status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  const [weeklySessions, setWeeklySessions] = useState(0);

  const loadPlan = useCallback(async () => {
    try {
      const response = await fetch('/api/study-plan');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Çalışma planı yüklenemedi.');
      setTasks(result.data.tasks);
      setWeeklyMinutes(result.data.weeklyStudyMinutes);
      setWeeklySessions(result.data.weeklySessions);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Çalışma planı yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (status === 'authenticated') void Promise.resolve().then(loadPlan);
  }, [status, router, loadPlan]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(current => {
        if (current > 1) return current - 1;
        window.clearInterval(timer);
        setRunning(false);
        if (!onBreak) {
          const durationMinutes = Math.ceil(FOCUS_SECONDS / 60);
          void fetch('/api/study-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationMinutes, taskId: selectedTaskId || undefined }),
          }).then(async response => {
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Oturum kaydedilemedi.');
            showToast('Pomodoro tamamlandı. Çalışma süren kaydedildi.');
            await loadPlan();
          }).catch(error => showToast(error instanceof Error ? error.message : 'Oturum kaydedilemedi.', 'error'));
          setOnBreak(true);
          setSecondsLeft(BREAK_SECONDS);
        } else {
          setOnBreak(false);
          setSecondsLeft(FOCUS_SECONDS);
          showToast('Mola bitti. Yeni bir odak oturumuna başlayabilirsin.');
        }
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, onBreak, selectedTaskId, loadPlan, showToast]);

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueAt: new Date(dueAt).toISOString() }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Görev eklenemedi.');
      setTitle('');
      setDueAt('');
      await loadPlan();
      showToast('Çalışma görevi eklendi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Görev eklenemedi.', 'error');
    }
  }

  async function toggleTask(task: StudyTask) {
    try {
      const response = await fetch('/api/study-plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, isDone: task.is_done !== 1 }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Görev güncellenemedi.');
      await loadPlan();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Görev güncellenemedi.', 'error');
    }
  }

  async function deleteTask(task: StudyTask) {
    try {
      const response = await fetch(`/api/study-plan?id=${encodeURIComponent(task.id)}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Görev silinemedi.');
      await loadPlan();
      showToast('Görev silindi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Görev silinemedi.', 'error');
    }
  }

  const visibleTasks = selectedTaskId ? tasks.filter(task => task.id === selectedTaskId) : tasks;
  const displaySeconds = secondsLeft === 0 && running ? 0 : secondsLeft;
  const timeLabel = `${String(Math.floor(displaySeconds / 60)).padStart(2, '0')}:${String(displaySeconds % 60).padStart(2, '0')}`;

  if (status === 'loading' || loading) {
    return <main className="container-app py-10"><div className="skeleton h-64 rounded-2xl" /></main>;
  }

  return (
    <main className="container-app max-w-5xl py-7 sm:py-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-teal-700">Düzenli tekrar, daha iyi öğrenme</p>
          <h1 className="mt-1 text-3xl font-bold text-navy-900">Çalışma planı</h1>
        </div>
        <a href="/api/study-plan/calendar" className="btn btn-secondary">
          <Download className="h-4 w-4" /> Takvime aktar (.ics)
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <section className="card p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900"><Clock3 className="h-5 w-5 text-teal-700" /> Pomodoro</h2>
            <span className="badge badge-teal">{onBreak ? 'Mola' : 'Odak'}</span>
          </div>
          <p className="text-sm text-navy-500">25 dakika odaklan, ardından 5 dakika mola ver.</p>
          <div className="py-8 text-center">
            <p className="font-mono text-6xl font-bold tabular-nums tracking-tight text-navy-900" aria-live="off">{timeLabel}</p>
            <p className="mt-2 text-sm text-navy-500">{onBreak ? 'Kısa molanın tadını çıkar.' : 'Bu oturum tamamlanınca süre kaydedilir.'}</p>
          </div>
          {!onBreak && tasks.some(task => task.is_done !== 1) && (
            <label className="mb-4 block">
              <span className="label">Oturumun görevi (isteğe bağlı)</span>
              <select className="input w-full" value={selectedTaskId} onChange={event => setSelectedTaskId(event.target.value)} disabled={running}>
                <option value="">Görev seçme</option>
                {tasks.filter(task => task.is_done !== 1).map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
              </select>
            </label>
          )}
          <div className="flex justify-center gap-2">
            <button type="button" className="btn btn-teal" onClick={() => setRunning(value => !value)}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Duraklat' : 'Başlat'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => { setRunning(false); setOnBreak(false); setSecondsLeft(FOCUS_SECONDS); }}>
              <RotateCcw className="h-4 w-4" /> Sıfırla
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-navy-100 pt-4 text-center">
            <div><p className="text-xl font-bold text-navy-900">{weeklyMinutes}</p><p className="text-xs text-navy-500">Bu haftaki dakika</p></div>
            <div><p className="text-xl font-bold text-navy-900">{weeklySessions}</p><p className="text-xs text-navy-500">Tamamlanan oturum</p></div>
          </div>
        </section>

        <section className="card p-5 sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-teal-700" />
            <h2 className="text-lg font-bold text-navy-900">Görev ve sınav tarihleri</h2>
          </div>
          <form onSubmit={addTask} className="space-y-3 rounded-xl bg-navy-50 p-4">
            <label className="block">
              <span className="label">Görev veya sınav</span>
              <input className="input w-full" value={title} onChange={event => setTitle(event.target.value)} placeholder="Örn. Fizik-1 vize tekrarını tamamla" minLength={2} maxLength={160} required />
            </label>
            <label className="block">
              <span className="label">Tarih ve saat</span>
              <input className="input w-full" type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} required />
            </label>
            <button type="submit" className="btn btn-teal w-full"><Plus className="h-4 w-4" /> Plana ekle</button>
          </form>

          <div className="mt-5 space-y-2">
            {visibleTasks.length ? visibleTasks.map(task => (
              <article key={task.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-3">
                <button type="button" onClick={() => void toggleTask(task)} aria-label={task.is_done ? 'Görevi tamamlanmadı olarak işaretle' : 'Görevi tamamlandı olarak işaretle'} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${task.is_done ? 'border-teal-600 bg-teal-600 text-white' : 'border-navy-200 text-navy-400 hover:border-teal-500'}`}>
                  {task.is_done ? <Check className="h-4 w-4" /> : <span className="sr-only">Tamamla</span>}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${task.is_done ? 'text-navy-400 line-through' : 'text-navy-800'}`}>{task.title}</p>
                  <p className="text-xs text-navy-500">{new Date(task.due_at).toLocaleString('tr-TR')}{task.course_name ? ` · ${task.course_name}` : ''}</p>
                  {task.note_id && <Link href={`/not/${task.note_id}`} className="text-xs font-semibold text-teal-700">İlgili not</Link>}
                </div>
                <button type="button" onClick={() => void deleteTask(task)} className="rounded-lg p-2 text-navy-400 hover:bg-red-50 hover:text-red-600" aria-label={`Görevi sil: ${task.title}`}><Trash2 className="h-4 w-4" /></button>
              </article>
            )) : <p className="rounded-xl border border-dashed border-navy-200 p-5 text-center text-sm text-navy-500">Henüz görev eklenmedi. İlk çalışma hedefini oluştur.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
