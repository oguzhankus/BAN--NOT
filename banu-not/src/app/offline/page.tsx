import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Çevrimdışısın | BANÜ NOT',
  description: 'Bağlantı geldiğinde tekrar deneyebilirsin.',
};

export default function OfflinePage() {
  return (
    <section className="container-app flex min-h-[65vh] items-center justify-center py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy-900">Şu an çevrimdışısın</h1>
        <p className="mt-2 text-sm leading-6 text-navy-600">
          Bağlantın geldiğinde tekrar deneyebilirsin. Daha önce açtığın bazı sayfalar çevrimdışı da kullanılabilir.
        </p>
        <Link href="/" className="btn btn-teal mt-6">
          Ana sayfaya dön
        </Link>
      </div>
    </section>
  );
}
