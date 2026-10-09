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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark-nav-bar border-t border-navy-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-teal-600' : 'text-navy-400 hover:text-navy-600'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-teal-50' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-teal-700' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
