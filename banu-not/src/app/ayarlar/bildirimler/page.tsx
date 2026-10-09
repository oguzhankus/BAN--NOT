'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

const options = [
  { key: 'comments', label: 'Not yorumları', description: 'Notlarıma yeni yorum veya yanıt geldiğinde' },
  { key: 'messages', label: 'Mesajlar', description: 'Başka kullanıcılar bana mesaj gönderdiğinde' },
  { key: 'forum_replies', label: 'Soru-cevap', description: 'Sorularıma yanıt veya çözüm geldiğinde' },
  { key: 'note_updates', label: 'Not güncellemeleri', description: 'Kaydettiğim notların yeni sürümü yayınlandığında' },
  { key: 'followed_users', label: 'Takip ettiklerim', description: 'Takip ettiğim kişiler yeni not paylaştığında' },
] as const;
type PreferenceKey = typeof options[number]['key'];
type Preferences = Record<PreferenceKey, boolean>;

export default function NotificationSettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (status === 'authenticated') {
      fetch('/api/notification-preferences')
        .then(async response => {
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || 'Tercihler alınamadı.');
          setPreferences(Object.fromEntries(options.map(option => [option.key, Boolean(result.data[option.key])])) as Preferences);
        })
        .catch(error => showToast(error instanceof Error ? error.message : 'Tercihler alınamadı.', 'error'));
    }
  }, [status, router, showToast]);

  async function save() {
    if (!preferences) return;
    setSaving(true);
    try {
      const response = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Tercihler kaydedilemedi.');
      showToast('Bildirim tercihleri kaydedildi.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Tercihler kaydedilemedi.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="container-app max-w-3xl py-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Bell className="h-5 w-5" /></span>
        <div><h1 className="text-2xl font-bold text-navy-900">Bildirim tercihleri</h1><p className="text-sm text-navy-500">Uygulama içi bildirim konularını seç.</p></div>
      </div>
      <section className="card divide-y divide-navy-100 p-5">
        {preferences ? options.map(option => (
          <label key={option.key} className="flex cursor-pointer items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <span><span className="block text-sm font-semibold text-navy-900">{option.label}</span><span className="mt-1 block text-xs text-navy-500">{option.description}</span></span>
            <input
              type="checkbox"
              className="h-5 w-5 accent-teal-700"
              checked={preferences[option.key]}
              onChange={event => setPreferences(current => current ? { ...current, [option.key]: event.target.checked } : current)}
              aria-label={`${option.label} bildirimlerini aç`}
            />
          </label>
        )) : <div className="skeleton h-44" />}
      </section>
      <p className="mt-3 text-xs text-navy-500">Bu ayarlar bildirim merkezinde hangi kategorilerin gösterileceğini belirler. E-posta özeti ve cihaz anlık bildirim tercihleri ayrıca yönetilir.</p>
      <button type="button" className="btn btn-teal mt-4" onClick={() => void save()} disabled={!preferences || saving}><Check className="h-4 w-4" /> {saving ? 'Kaydediliyor…' : 'Tercihleri kaydet'}</button>
    </main>
  );
}
