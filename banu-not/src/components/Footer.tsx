'use client';

import Link from 'next/link';
import { BookOpen, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname === '/mesajlar') {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-white/5 bg-gradient-to-br from-navy-900 to-navy-950 text-navy-300">
      <div className="container-app py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-[0_5px_14px_rgba(49,151,149,0.24)]">
                <BookOpen className="h-[18px] w-[18px] text-white" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                BANÜ <span className="text-teal-400">NOT</span>
              </span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-navy-400">
              Üniversite öğrencilerinin ders notlarını kolayca paylaşıp
              bulabildiği açık not platformu.
            </p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" /> Birlikte öğreniyoruz
            </span>
          </div>

          {/* Hızlı Bağlantılar */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2.5">
              <li><Link href="/kesfet" className="footer-link">Keşfet</Link></li>
              <li><Link href="/soru-cevap" className="footer-link">Soru-Cevap</Link></li>
              <li><Link href="/dersler" className="footer-link">Dersler</Link></li>
              <li><Link href="/liderlik-tablosu" className="footer-link">Liderlik Tablosu</Link></li>
              <li><Link href="/nasil-calisir" className="footer-link">Nasıl Çalışır</Link></li>
              <li><Link href="/yukle" className="footer-link">Not Paylaş</Link></li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Yasal</h3>
            <ul className="space-y-2.5">
              <li><Link href="/hakkimizda" className="footer-link">Hakkımızda</Link></li>
              <li><Link href="/kullanim-kosullari" className="footer-link">Kullanım Koşulları</Link></li>
              <li><Link href="/gizlilik" className="footer-link">Gizlilik Politikası</Link></li>
              <li><Link href="/icerik-kurallari" className="footer-link">İçerik Kuralları</Link></li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">İletişim</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:iletisim@banunot.com" className="footer-link inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  iletisim@banunot.com
                </a>
              </li>
              <li><Link href="/yardim" className="footer-link">Yardım & Destek</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row">
          <p className="text-xs text-navy-500">
            © {new Date().getFullYear()} BANÜ NOT. Tüm hakları saklıdır. Bu platformda paylaşılan
            içeriklerden yükleyenler sorumludur.
          </p>
          <p className="text-xs text-navy-600">
            Bu platform, herhangi bir üniversitenin resmi platformu değildir.
          </p>
        </div>
      </div>
    </footer>
  );
}
