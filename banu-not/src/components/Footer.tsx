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
    <footer className="bg-navy-900 text-navy-300 mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                BANÜ <span className="text-teal-400">NOT</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-navy-400">
              Üniversite öğrencilerinin ders notlarını kolayca paylaşıp
              bulabildiği açık not platformu.
            </p>
          </div>

          {/* Hızlı Bağlantılar */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2.5">
              <li><Link href="/kesfet" className="text-sm hover:text-teal-400 transition-colors">Keşfet</Link></li>
              <li><Link href="/dersler" className="text-sm hover:text-teal-400 transition-colors">Dersler</Link></li>
              <li><Link href="/liderlik-tablosu" className="text-sm hover:text-teal-400 transition-colors">Liderlik Tablosu</Link></li>
              <li><Link href="/nasil-calisir" className="text-sm hover:text-teal-400 transition-colors">Nasıl Çalışır</Link></li>
              <li><Link href="/yukle" className="text-sm hover:text-teal-400 transition-colors">Not Paylaş</Link></li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Yasal</h3>
            <ul className="space-y-2.5">
              <li><Link href="/hakkimizda" className="text-sm hover:text-teal-400 transition-colors">Hakkımızda</Link></li>
              <li><Link href="/kullanim-kosullari" className="text-sm hover:text-teal-400 transition-colors">Kullanım Koşulları</Link></li>
              <li><Link href="/gizlilik" className="text-sm hover:text-teal-400 transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/icerik-kurallari" className="text-sm hover:text-teal-400 transition-colors">İçerik Kuralları</Link></li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">İletişim</h3>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:iletisim@banunot.com" className="text-sm hover:text-teal-400 transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  iletisim@banunot.com
                </a>
              </li>
              <li><Link href="/yardim" className="text-sm hover:text-teal-400 transition-colors">Yardım & Destek</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
