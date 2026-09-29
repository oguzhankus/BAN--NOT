import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'BANÜ NOT — Ders Notları Paylaşım Platformu',
  description: 'Balıkesir Üniversitesi öğrencileri için ders notları paylaşım platformu. Notlarını paylaş, keşfet ve başarını artır.',
  keywords: 'ders notu, üniversite, Balıkesir Üniversitesi, BANÜ, not paylaşım, öğrenci',
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
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <ToastProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
