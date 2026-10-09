'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, MessageCircle, MessageSquare, User, LogIn } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide on auth pages or desktop
  if (pathname?.startsWith('/giris') || pathname?.startsWith('/kayit')) {
    return null;
  }

  const navItems = session
    ? [
        { name: 'Ana Sayfa', href: '/', icon: Home },
        { name: 'Keşfet', href: '/kesfet', icon: Search },
        { name: 'Soru-Cevap', href: '/soru-cevap', icon: MessageCircle },
        { name: 'Mesajlar', href: '/mesajlar', icon: MessageSquare },
        { name: 'Profil', href: '/profil', icon: User },
      ]
    : [
        { name: 'Ana Sayfa', href: '/', icon: Home },
        { name: 'Keşfet', href: '/kesfet', icon: Search },
        { name: 'Soru-Cevap', href: '/soru-cevap', icon: MessageCircle },
        { name: 'Giriş', href: '/giris', icon: LogIn },
      ];

  return (
    <div className="site-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-navy-100 bg-white pb-safe shadow-[0_-8px_24px_rgba(16,42,67,0.07)]">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`site-bottom-nav-link flex h-full w-full flex-col items-center justify-center space-y-1 ${
                isActive ? 'text-teal-800' : 'text-navy-400 hover:text-navy-700'
              }`}
            >
              <div className={`relative rounded-xl p-1 ${isActive ? 'bg-teal-50' : ''}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-teal-800' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
