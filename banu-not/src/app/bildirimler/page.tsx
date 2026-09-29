'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { timeAgo } from '@/lib/constants';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (session?.user) loadNotifications();
  }, [session, status]);

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch {} finally { setLoading(false); }
  }

  async function markRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch {}
  }

  return (
    <div className="container-app py-6 sm:py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
        <Bell className="w-6 h-6" /> Bildirimler
      </h1>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`card p-4 flex items-start gap-3 ${!n.is_read ? 'bg-teal-50 border-teal-200' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-900">{n.title}</p>
                <p className="text-sm text-navy-600 mt-0.5">{n.message}</p>
                <p className="text-xs text-navy-400 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {n.link && <Link href={n.link} className="btn btn-ghost btn-sm text-xs">Görüntüle</Link>}
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="btn btn-ghost btn-sm" title="Okundu"><Check className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><Bell className="w-12 h-12" /><p className="text-navy-500 mt-2">Bildiriminiz yok.</p></div>
      )}
    </div>
  );
}
