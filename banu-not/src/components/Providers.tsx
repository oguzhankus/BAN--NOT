'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';

function ProfileCheck({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      if (!user.universityId && pathname !== '/profil-tamamla' && pathname !== '/giris' && pathname !== '/kayit') {
        router.push('/profil-tamamla');
      }
    }
  }, [status, session, pathname, router]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="data-theme" defaultTheme="light">
        <ProfileCheck>
          {children}
        </ProfileCheck>
      </ThemeProvider>
    </SessionProvider>
  );
}
