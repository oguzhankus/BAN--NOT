'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2 } from 'lucide-react';
import { timeAgo } from '@/lib/constants';

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/giris');
    } else if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, router]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {}
  };

  const clearAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="container-app py-8 max-w-3xl mx-auto">
        <div className="skeleton h-8 w-64 mb-6" />
        <div className="space-y-4">
          <div className="skeleton h-24 w-full rounded-xl" />
          <div className="skeleton h-24 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-teal-600" />
          Bildirimler
        </h1>
        {notifications.length > 0 && (
          <button onClick={clearAll} className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Hepsini Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`card p-5 flex gap-4 ${!notification.is_read ? 'border-l-4 border-l-teal-500 bg-teal-50/10' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-navy-900">{notification.title}</h3>
                  {!notification.is_read && (
                    <span className="badge badge-teal">Yeni</span>
                  )}
                </div>
                <p className="text-sm text-navy-600 mb-2">{notification.message}</p>
                <span className="text-xs text-navy-400">{timeAgo(notification.created_at)}</span>
              </div>
              {!notification.is_read && (
                <button 
                  onClick={() => markAsRead(notification.id)}
                  className="shrink-0 w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center text-navy-500 hover:bg-teal-50 hover:text-teal-600 transition-colors self-center"
                  aria-label="Okundu olarak işaretle"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 card bg-navy-50/50 border-dashed">
            <Bell className="w-12 h-12 text-navy-300 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-navy-800">Bildirim Yok</h3>
            <p className="text-navy-500 mt-1">Şu anda okunmamış yeni bildiriminiz bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
