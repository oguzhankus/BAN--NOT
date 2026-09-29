import { BookOpen, Users, ShieldCheck, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container-app py-8 sm:py-12 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-6">Biz Kimiz?</h1>
        <p className="text-lg text-navy-600 leading-relaxed">
          BANÜ NOT, Balıkesir Üniversitesi öğrencileri tarafından, yine Balıkesir Üniversitesi öğrencileri için geliştirilmiş, kar amacı gütmeyen eğitim odaklı bir bilgi paylaşım platformudur.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900 mb-4">Hikayemiz</h2>
          <div className="space-y-4 text-navy-600 leading-relaxed">
            <p>
              Üniversite hayatının zorluklarından biri de kaliteli ders materyallerine, sınav özetlerine ve çıkmış sorulara ulaşmaktır. Çoğu zaman bu notlar WhatsApp gruplarında kaybolur ya da üst sınıflarla iletişim kuramayan öğrencilerin erişiminden uzak kalır.
            </p>
            <p>
              Bu problemi çözmek, bilginin serbestçe ve kolayca paylaşılmasını sağlamak amacıyla yola çıktık. İstiyoruz ki her öğrenci, vize veya final haftasında aradığı nota tek bir tıkla ulaşabilsin.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-6 bg-teal-50 border-none text-center">
            <Users className="w-10 h-10 text-teal-600 mx-auto mb-3" />
            <div className="font-bold text-2xl text-navy-900 mb-1">100%</div>
            <div className="text-sm text-navy-600">Öğrenci Odaklı</div>
          </div>
          <div className="card p-6 bg-blue-50 border-none text-center">
            <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <div className="font-bold text-2xl text-navy-900 mb-1">Ücretsiz</div>
            <div className="text-sm text-navy-600">Açık Kaynak Bilgi</div>
          </div>
          <div className="card p-6 bg-accent-50 border-none text-center col-span-2">
            <Heart className="w-10 h-10 text-accent-600 mx-auto mb-3" />
            <div className="text-sm text-navy-800 font-medium">Birlikte daha güçlü, birlikte daha başarılıyız.</div>
          </div>
        </div>
      </div>

      <div className="bg-navy-900 rounded-2xl p-8 sm:p-12 text-white text-center">
        <ShieldCheck className="w-12 h-12 text-teal-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-4">Misyonumuz & Değerlerimiz</h2>
        <div className="grid sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto mt-8">
          <div>
            <h3 className="font-semibold text-teal-300 mb-2">Paylaşım</h3>
            <p className="text-sm text-navy-300">Bilgi paylaştıkça çoğalır. Emek verilmiş her notun yeni bir öğrenciye ışık tutacağına inanıyoruz.</p>
          </div>
          <div>
            <h3 className="font-semibold text-teal-300 mb-2">Güvenilirlik</h3>
            <p className="text-sm text-navy-300">Platformdaki içeriklerin kalitesini moderasyon sistemimiz ve öğrenci değerlendirmeleriyle yüksek tutuyoruz.</p>
          </div>
          <div>
            <h3 className="font-semibold text-teal-300 mb-2">Erişilebilirlik</h3>
            <p className="text-sm text-navy-300">Sade ve modern arayüzümüzle herkesin aradığına en hızlı şekilde, her cihazdan ulaşmasını sağlıyoruz.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
