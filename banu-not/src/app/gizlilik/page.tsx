export default function PrivacyPolicyPage() {
  return (
    <div className="container-app py-8 max-w-4xl mx-auto prose prose-navy">
      <h1>Gizlilik Politikası</h1>
      <p>Son güncellenme tarihi: {new Date().toLocaleDateString('tr-TR')}</p>

      <h2>1. Toplanan Veriler</h2>
      <p>Platformumuzu kullanırken aşağıdaki veriler toplanabilir:</p>
      <ul>
        <li>Kayıt bilgileri (E-posta, İsim, Üniversite bilgisi)</li>
        <li>Platform içi hareketler (İndirilen notlar, yorumlar, favoriler)</li>
        <li>Sistem logları ve IP adresleri (Güvenlik amacıyla kısıtlı süre tutulur)</li>
      </ul>

      <h2>2. Verilerin Kullanımı</h2>
      <p>Toplanan veriler yalnızca şu amaçlarla kullanılır:</p>
      <ul>
        <li>Kullanıcı hesabının yönetimi</li>
        <li>Platformun işleyişinin sağlanması (Örn: bildirim gönderimi, kişiselleştirilmiş içerik)</li>
        <li>Sistem güvenliğinin sağlanması</li>
        <li>Anonim istatistiksel analizler</li>
      </ul>

      <h2>3. Veri Paylaşımı</h2>
      <p>
        Kişisel verileriniz, yasal zorunluluklar haricinde hiçbir üçüncü taraf kişi, kurum veya kuruluşla paylaşılmaz ve satılmaz.
      </p>

      <h2>4. Çerezler (Cookies)</h2>
      <p>
        Platform, oturum yönetimi ve site performansını analiz etmek amacıyla temel çerezleri kullanır.
      </p>

      <h2>5. Kullanıcı Hakları</h2>
      <p>
        Kullanıcılar istedikleri zaman hesaplarının ve kişisel verilerinin silinmesini talep edebilirler. Bunun için iletişim kanallarımızdan bize ulaşabilirsiniz.
      </p>
    </div>
  );
}
