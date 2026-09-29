import { Info, Upload, Download, Search, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="container-app py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-navy-900 mb-6">Nasıl Çalışır?</h1>
      
      <div className="space-y-8">
        <section className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
              <Search className="w-6 h-6 text-teal-700" />
            </div>
            <h2 className="text-xl font-semibold text-navy-900">1. Notları Keşfedin</h2>
          </div>
          <p className="text-navy-600 mb-4 pl-16">
            Ana sayfadan veya Keşfet sayfasından ihtiyacınız olan ders notlarını arayabilirsiniz. Fakülte, bölüm veya derse göre filtreleme yaparak tam olarak aradığınız içeriğe ulaşabilirsiniz.
          </p>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <Download className="w-6 h-6 text-blue-700" />
            </div>
            <h2 className="text-xl font-semibold text-navy-900">2. İndirin ve Çalışın</h2>
          </div>
          <p className="text-navy-600 mb-4 pl-16">
            Bulduğunuz notları inceleyebilir, ücretsiz olarak cihazınıza indirebilirsiniz. Beğendiğiniz notları kaydederek daha sonra profilinizden kolayca erişebilirsiniz. (İndirme işlemi için giriş yapmanız gerekebilir.)
          </p>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center shrink-0">
              <Upload className="w-6 h-6 text-accent-700" />
            </div>
            <h2 className="text-xl font-semibold text-navy-900">3. Kendi Notlarınızı Paylaşın</h2>
          </div>
          <p className="text-navy-600 mb-4 pl-16">
            Topluluğa katkıda bulunmak için kendi ders notlarınızı platforma yükleyebilirsiniz. Yüklediğiniz notlar moderasyon sürecinden geçtikten sonra diğer öğrencilerin erişimine açılır.
          </p>
          <div className="pl-16">
            <Link href="/yukle" className="btn btn-teal">
              Hemen Not Yükle
            </Link>
          </div>
        </section>

        <section className="card p-6 bg-navy-50">
          <div className="flex items-center gap-4 mb-4">
            <Info className="w-6 h-6 text-navy-600" />
            <h2 className="text-lg font-semibold text-navy-900">Neden BANÜ NOT?</h2>
          </div>
          <ul className="space-y-2 text-navy-600 pl-10 list-disc">
            <li>Tamamen ücretsiz ve öğrencilere özel</li>
            <li>Sadece doğrulanmış ve kaliteli içerikler</li>
            <li>Kolay arama ve gelişmiş filtreleme seçenekleri</li>
            <li>Mobil uyumlu modern arayüz</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
