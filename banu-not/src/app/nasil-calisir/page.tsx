import { Info, Upload, Download, Search } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';

export default function HowItWorksPage() {
  return (
    <div className="container-app mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-bold text-navy-900">Nasıl Çalışır?</h1>

      <div className="space-y-8">
        <ScrollReveal>
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100">
                <Search className="h-6 w-6 text-teal-700" />
              </div>
              <h2 className="text-xl font-semibold text-navy-900">1. Notları Keşfedin</h2>
            </div>
            <p className="mb-4 pl-16 text-navy-600">
              Ana sayfadan veya Keşfet sayfasından ihtiyacınız olan ders notlarını arayabilirsiniz. Fakülte, bölüm veya derse göre filtreleme yaparak tam olarak aradığınız içeriğe ulaşabilirsiniz.
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
                <Download className="h-6 w-6 text-blue-700" />
              </div>
              <h2 className="text-xl font-semibold text-navy-900">2. İndirin ve Çalışın</h2>
            </div>
            <p className="mb-4 pl-16 text-navy-600">
              Bulduğunuz notları inceleyebilir, ücretsiz olarak cihazınıza indirebilirsiniz. Beğendiğiniz notları kaydederek daha sonra profilinizden kolayca erişebilirsiniz. (İndirme işlemi için giriş yapmanız gerekebilir.)
            </p>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-100">
                <Upload className="h-6 w-6 text-accent-700" />
              </div>
              <h2 className="text-xl font-semibold text-navy-900">3. Kendi Notlarınızı Paylaşın</h2>
            </div>
            <p className="mb-4 pl-16 text-navy-600">
              Topluluğa katkıda bulunmak için kendi ders notlarınızı platforma yükleyebilirsiniz. Yüklediğiniz notlar moderasyon sürecinden geçtikten sonra diğer öğrencilerin erişimine açılır.
            </p>
            <div className="pl-16">
              <Link href="/yukle" className="btn btn-teal">
                Hemen Not Yükle
              </Link>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="card bg-navy-50 p-6">
            <div className="mb-4 flex items-center gap-4">
              <Info className="h-6 w-6 text-navy-600" />
              <h2 className="text-lg font-semibold text-navy-900">Neden BANÜ NOT?</h2>
            </div>
            <ul className="list-disc space-y-2 pl-10 text-navy-600">
              <li>Tamamen ücretsiz ve öğrencilere özel</li>
              <li>Sadece doğrulanmış ve kaliteli içerikler</li>
              <li>Kolay arama ve gelişmiş filtreleme seçenekleri</li>
              <li>Mobil uyumlu modern arayüz</li>
            </ul>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
