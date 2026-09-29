import { HelpCircle, Mail, MessageCircle, FileQuestion, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  const faqs = [
    {
      q: "Not indirmek ücretli mi?",
      a: "Hayır, BANÜ NOT üzerindeki tüm ders notları, özetler ve materyaller tamamen ücretsizdir ve her zaman ücretsiz kalacaktır."
    },
    {
      q: "Not yüklemek için üye olmam gerekiyor mu?",
      a: "Evet, not yüklemek, not indirmek ve notlara yorum yapıp puan verebilmek için ücretsiz bir hesap oluşturmanız gerekmektedir."
    },
    {
      q: "Yüklediğim not hemen yayınlanır mı?",
      a: "Platform kalitesini korumak için yüklenen notlar öncelikle moderasyon ekibimiz tarafından incelenir. İnceleme genellikle 24 saat içinde tamamlanır ve uygun görülen notlar yayınlanır."
    },
    {
      q: "Hocaların slaytlarını yükleyebilir miyim?",
      a: "Hayır, telif hakları gereği hocalara ait slaytlar, sınav kağıtları veya ders kitaplarının PDF'leri paylaşılamaz. Sadece kendi tuttuğunuz notları ve hazırladığınız özetleri paylaşabilirsiniz."
    },
    {
      q: "Yanlış veya hatalı bir not gördüm, ne yapmalıyım?",
      a: "Not detay sayfasındaki 'Bildir' butonunu kullanarak hatalı içeriği bize iletebilirsiniz. Moderatörlerimiz en kısa sürede inceleyip gerekli işlemi yapacaktır."
    }
  ];

  return (
    <div className="container-app py-8 sm:py-12 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">Nasıl Yardımcı Olabiliriz?</h1>
        <p className="text-lg text-navy-600">
          Sık sorulan soruları inceleyebilir veya aklınıza takılan diğer konular için bizimle iletişime geçebilirsiniz.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
            <FileQuestion className="w-6 h-6 text-teal-600" /> Sık Sorulan Sorular
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-5 hover:border-teal-300 transition-colors">
                <h3 className="font-semibold text-lg text-navy-900 mb-2">{faq.q}</h3>
                <p className="text-navy-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 bg-navy-50 border-none">
            <h3 className="font-bold text-lg text-navy-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" /> Bize Ulaşın
            </h3>
            <p className="text-sm text-navy-600 mb-4">
              Cevabını bulamadığınız sorular, önerileriniz veya şikayetleriniz için bizimle e-posta yoluyla iletişime geçebilirsiniz.
            </p>
            <a href="mailto:iletisim@banunot.com" className="btn btn-teal w-full">
              iletisim@banunot.com
            </a>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-lg text-navy-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-600" /> Topluluk
            </h3>
            <p className="text-sm text-navy-600 mb-4">
              Platform kuralları hakkında daha fazla bilgi almak için içerik kurallarımızı inceleyin.
            </p>
            <Link href="/icerik-kurallari" className="text-sm font-semibold text-teal-600 flex items-center gap-1 hover:gap-2 transition-all">
              Kuralları İncele <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
