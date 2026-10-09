import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';
import { ToastProvider } from '@/components/Toast';
import { UNIVERSITY } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'BANÜ NOT — Ders Notları Paylaşım Platformu',
  description: `${UNIVERSITY.name} öğrencileri için ders notları paylaşım platformu. Notlarını paylaş, keşfet ve başarını artır.`,
  keywords: `ders notu, üniversite, ${UNIVERSITY.name}, ${UNIVERSITY.shortName}, not paylaşım, öğrenci`,
  openGraph: {
    title: 'BANÜ NOT — Ders Notları Paylaşım Platformu',
    description: 'Üniversite öğrencileri için not paylaşım platformu',
    type: 'website',
    locale: 'tr_TR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#102a43" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <ToastProvider>
            <Header />
            <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
