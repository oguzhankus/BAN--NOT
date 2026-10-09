'use client';

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Smartphone } from 'lucide-react';

interface PushConfig {
  configured: boolean;
  publicKey: string | null;
}

function decodeVapidKey(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const raw = window.atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes.buffer;
}

export default function PushNotificationSettings() {
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPushState() {
      try {
        const browserSupportsPush = 'serviceWorker' in navigator && 'PushManager' in window;
        if (active) setSupported(browserSupportsPush);

        const response = await fetch('/api/push/subscriptions');
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Push ayarları yüklenemedi.');
        }
        if (!active) return;

        setConfig(result.data);
        if (browserSupportsPush) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (active) setEnabled(Boolean(subscription));
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'Push ayarları yüklenemedi.');
        }
      } finally {
        if (active) setBusy(false);
      }
    }

    void loadPushState();
    return () => {
      active = false;
    };
  }, []);

  async function togglePush() {
    if (!('serviceWorker' in navigator) || (!enabled && (!config?.configured || !config.publicKey))) return;
    setBusy(true);
    setMessage('');

    try {
      if (enabled) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch('/api/push/subscriptions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Push bildirimleri kapatılamadı.');
          }
          await subscription.unsubscribe();
        }
        setEnabled(false);
        setMessage('Bu cihazda push bildirimleri kapatıldı.');
      } else {
        if (!config?.publicKey) {
          throw new Error('Push bildirim anahtarı sunucuda yapılandırılmamış.');
        }
        if (!('Notification' in window) || !('PushManager' in window)) {
          throw new Error('Bu tarayıcı push bildirimlerini desteklemiyor.');
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsin.');
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidKey(config.publicKey),
        });
        const response = await fetch('/api/push/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          await subscription.unsubscribe();
          throw new Error(result.error || 'Push bildirimleri açılamadı.');
        }
        setEnabled(true);
        setMessage('Bu cihazda push bildirimleri açıldı.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Push ayarları güncellenemedi.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Smartphone className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold text-navy-900">Cihaz bildirimleri</h2>
          <p className="mt-1 text-sm text-navy-600">
            Yeni mesaj ve topluluk bildirimlerini tarayıcı veya yüklü uygulama üzerinden al.
          </p>
          {message && <p role="status" className="mt-2 text-xs font-medium text-teal-700">{message}</p>}
          {!supported && <p className="mt-2 text-xs text-navy-500">Bu tarayıcı push bildirimlerini desteklemiyor.</p>}
          {config && !config.configured && (
            <p className="mt-2 text-xs text-navy-500">Sunucu yöneticisinin VAPID anahtarlarını yapılandırması gerekiyor.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={togglePush}
        disabled={busy || (!enabled && !config?.configured) || !supported}
        className={`btn shrink-0 ${enabled ? 'btn-secondary' : 'btn-teal'}`}
      >
        {enabled ? <BellOff className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
        {busy ? 'Yükleniyor…' : enabled ? 'Bildirimleri kapat' : 'Bildirimleri aç'}
      </button>
    </section>
  );
}
