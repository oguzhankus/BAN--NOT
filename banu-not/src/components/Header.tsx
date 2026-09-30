'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, Search, Upload, BookOpen, User, LogOut, Settings, Bell, ChevronDown, Bookmark, FileText, Shield, Moon, Sun, MessageSquare } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const user = session?.user as any;
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator';

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setNotificationsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleMessagesRead = () => {
      if (session?.user) loadNotifications();
    };
    window.addEventListener('messagesRead', handleMessagesRead);
    return () => window.removeEventListener('messagesRead', handleMessagesRead);
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      loadNotifications();
      fetch('/api/ping', { method: 'POST' }).catch(() => {});
      const pingInterval = setInterval(() => {
        fetch('/api/ping', { method: 'POST' }).catch(() => {});
        loadNotifications();
      }, 60000);
      return () => clearInterval(pingInterval);
    }
  }, [session]);

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.items || []);
        setUnreadCount((data.data.items || []).filter((n: any) => !n.is_read).length);
        setUnreadMessages(data.data.unreadMessagesCount || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  }

  async function markAsRead(id?: string) {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      });
      loadNotifications();
    } catch (e) {}
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/kesfet?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-navy-100 shadow-sm">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Ana sayfa">
            <div className="w-8 h-8 bg-navy-800 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-900 hidden sm:block">
              BANÜ <span className="text-teal-600">NOT</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Ana navigasyon">
            <Link
              href="/kesfet"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/kesfet') ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Keşfet
            </Link>
            <Link
              href="/soru-cevap"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/soru-cevap') ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Soru - Cevap
            </Link>
            <Link
              href="/dersler"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname?.startsWith('/dersler') ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Dersler
            </Link>
            <Link
              href="/nasil-calisir"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/nasil-calisir' ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Nasıl Çalışır
            </Link>
            <Link
              href="/liderlik-tablosu"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/liderlik-tablosu' ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Liderlik Tablosu
            </Link>
            <Link
              href="/not-hesaplama"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/not-hesaplama' ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Not Hesapla
            </Link>
            <Link
              href="/istekler"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/istekler' ? 'text-teal-700 bg-teal-50' : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
              }`}
            >
              Not İstekleri
            </Link>
          </nav>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
              <input
                type="search"
                placeholder="Not veya ders ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 pr-3 py-2 text-sm"
                aria-label="Arama"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Link
                  href="/yukle"
                  className="btn btn-teal btn-sm hidden sm:inline-flex"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden md:inline">Not Paylaş</span>
                </Link>

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  aria-label="Karanlık Modu Aç/Kapat"
                >
                  {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
                </button>

                {/* Messages */}
                <Link
                  href="/mesajlar"
                  className="relative p-2 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  aria-label="Mesajlar"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  )}
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifMenuRef}>
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      if (!notificationsOpen && unreadCount > 0) markAsRead();
                    }}
                    className="relative p-2 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                    aria-label="Bildirimler"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute -right-16 sm:right-0 mt-2 w-[320px] max-w-[90vw] bg-white rounded-xl border border-navy-100 shadow-lg py-1 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-navy-100 flex justify-between items-center bg-navy-50/50">
                        <span className="font-semibold text-navy-900">Bildirimler</span>
                        {unreadCount > 0 && (
                          <button onClick={() => markAsRead()} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Tümünü Okundu İşaretle</button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif: any) => (
                            <Link
                              key={notif.id}
                              href={notif.link || '#'}
                              className={`block px-4 py-3 border-b border-navy-50 hover:bg-navy-50 transition-colors ${!notif.is_read ? 'bg-teal-50/30' : ''}`}
                            >
                              <p className={`text-sm ${!notif.is_read ? 'font-semibold text-navy-900' : 'font-medium text-navy-800'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-navy-600 mt-1 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-navy-400 mt-1.5">{new Date(notif.created_at).toLocaleDateString('tr-TR')} {new Date(notif.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </Link>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-navy-500">
                            Bildiriminiz yok.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-50 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    aria-label="Kullanıcı menüsü"
                  >
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-teal-700">
                        {user?.name?.charAt(0)?.toUpperCase() || 'K'}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-navy-400 hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute -right-4 sm:right-0 mt-2 w-56 bg-white rounded-xl border border-navy-100 shadow-lg py-1 z-50">
                      <div className="px-4 py-3 border-b border-navy-100">
                        <p className="text-sm font-semibold text-navy-900">{user?.name}</p>
                        <p className="text-xs text-navy-500 truncate">{user?.email}</p>
                      </div>
                      <Link href="/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors">
                        <User className="w-4 h-4" /> Profilim
                      </Link>
                      <Link href="/notlarim" className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors">
                        <FileText className="w-4 h-4" /> Notlarım
                      </Link>
                      <Link href="/kaydedilenler" className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors">
                        <Bookmark className="w-4 h-4" /> Kaydedilenler
                      </Link>
                      {isAdmin && (
                        <>
                          <div className="border-t border-navy-100 my-1" />
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50 transition-colors">
                            <Shield className="w-4 h-4" /> Yönetim Paneli
                          </Link>
                        </>
                      )}
                      <div className="border-t border-navy-100 my-1" />
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Çıkış Yap
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Theme Toggle for non-logged in users */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 mr-1 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  aria-label="Karanlık Modu Aç/Kapat"
                >
                  {mounted ? (theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />) : <div className="w-5 h-5" />}
                </button>
                <Link href="/giris" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="btn btn-primary btn-sm">
                  Kayıt Ol
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
              aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-navy-100 bg-white">
          <div className="container-app py-4 space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="search"
                  placeholder="Not veya ders ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-9"
                  aria-label="Arama"
                />
              </div>
            </form>
            <nav className="space-y-1" aria-label="Mobil navigasyon">
              <Link href="/dersler" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50">
                Dersler
              </Link>
              <Link href="/nasil-calisir" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50">
                Nasıl Çalışır
              </Link>
              <Link href="/liderlik-tablosu" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50">
                Liderlik Tablosu
              </Link>
              <Link href="/not-hesaplama" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50">
                Not Hesapla
              </Link>
              <Link href="/istekler" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-navy-700 hover:bg-navy-50">
                Not İstekleri
              </Link>
              {session ? (
                <Link href="/yukle" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-teal-700 bg-teal-50">
                  <span className="flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Not Paylaş
                  </span>
                </Link>
              ) : (
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/giris" className="block text-center px-3 py-2 rounded-lg text-sm font-medium text-navy-700 border border-navy-200 hover:bg-navy-50">
                    Giriş Yap
                  </Link>
                  <Link href="/kayit" className="block text-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
