import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function PrivacyPolicyPage() {
  return (
    <PolicyPageLayout
      title="Gizlilik Politikası"
      description="BANÜ NOT'u kullanırken hangi bilgilerin işlenebileceğini ve bunların hangi amaçlarla kullanıldığını açıkça anlatıyoruz."
      updatedAt={new Date().toLocaleDateString('tr-TR')}
      sections={[
        {
          id: 'toplanan-veriler',
          title: 'Toplanan veriler',
          content: (
            <>
              <p>Platformu kullanırken hizmetin çalışması ve güvenliğinin sağlanması için aşağıdaki veriler işlenebilir:</p>
              <ul>
                <li>Kayıt ve profil bilgileri (e-posta, isim ve üniversite bilgisi).</li>
                <li>Platform içi işlemler (indirilen notlar, yorumlar ve favoriler).</li>
                <li>Güvenlik amacıyla sistem kayıtları ve IP adresi; bu bilgiler kısıtlı süre tutulur.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'veri-kullanimi',
          title: 'Verilerin kullanım amaçları',
          content: (
            <>
              <p>Toplanan bilgiler yalnızca hizmetin sunulması ve geliştirilmesi için kullanılır:</p>
              <ul>
                <li>Kullanıcı hesabının oluşturulması ve yönetilmesi.</li>
                <li>Bildirimler ve kişiselleştirilmiş içerik gibi platform özelliklerinin çalıştırılması.</li>
                <li>Sistem güvenliğinin korunması ve kötüye kullanımın önlenmesi.</li>
                <li>Kimlik belirleyici bilgilerden arındırılmış istatistiksel analizler.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'veri-paylasimi',
          title: 'Verilerin paylaşılması',
          content: (
            <p>
              Kişisel verileriniz yasal zorunluluklar haricinde üçüncü taraf kişi, kurum veya kuruluşlarla paylaşılmaz ve satılmaz.
            </p>
          ),
        },
        {
          id: 'cerezler',
          title: 'Çerezler',
          content: (
            <p>
              Platform, oturum yönetimi ve site performansını analiz etmek amacıyla temel çerezleri kullanır.
            </p>
          ),
        },
        {
          id: 'kullanici-haklari',
          title: 'Hesap ve veri talepleri',
          content: (
            <p>
              Hesabınızın ve kişisel verilerinizin silinmesini istediğiniz zaman talep edebilirsiniz. Bunun için <a href="mailto:iletisim@banunot.com">iletisim@banunot.com</a> adresinden bize ulaşabilirsiniz.
            </p>
          ),
        },
      ]}
    />
  );
}
