import PolicyPageLayout from '@/components/PolicyPageLayout';

export default function ContentRulesPage() {
  return (
    <PolicyPageLayout
      title="İçerik Kuralları"
      description="Paylaşılan her not, bir başka öğrencinin öğrenme yolculuğuna katkı sağlar. Güvenli ve faydalı bir arşiv için içerik paylaşırken bu kuralları takip edin."
      sections={[
        {
          id: 'paylasilabilir-icerikler',
          title: 'Paylaşılabilir içerikler',
          content: (
            <>
              <p>Platformda kendi hazırladığınız ve paylaşma hakkına sahip olduğunuz eğitim materyallerini paylaşabilirsiniz:</p>
              <ul>
                <li><strong>Kendi ders notlarınız:</strong> Derste tuttuğunuz veya kendi emeğinizle hazırladığınız notlar.</li>
                <li><strong>Özetler ve çalışma kağıtları:</strong> Sınavlara hazırlanmak için oluşturduğunuz materyaller.</li>
                <li><strong>Çözümlü örnekler:</strong> Telif hakkı içermeyen, kendi ürettiğiniz soru ve çözümler.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'yasak-icerikler',
          title: 'Paylaşılması yasak içerikler',
          content: (
            <ul>
              <li><strong>Telifli materyaller:</strong> Kitapların veya ücretli kurs materyallerinin izinsiz PDF ve görselleri.</li>
              <li><strong>İzinsiz sunum ve sınavlar:</strong> Öğretim üyelerine ait slaytlar veya sınav kağıtları.</li>
              <li><strong>Kişisel veriler:</strong> Öğrenci numarası, T.C. kimlik numarası gibi kişiyi tanımlayabilecek bilgiler.</li>
              <li><strong>Zararlı ve alakasız içerik:</strong> Virüs, kötü amaçlı yazılım, reklam veya spam içeren dosyalar.</li>
            </ul>
          ),
        },
        {
          id: 'moderasyon',
          title: 'İnceleme ve moderasyon',
          content: (
            <p>
              Yüklenen notlar inceleme durumuna alınabilir. Yönetici veya moderatörler içeriği kurallara uygunluk açısından değerlendirir; uygun bulunan notlar yayımlanır. Kuralların tekrar tekrar ihlal edilmesi hesabın kısıtlanmasına veya askıya alınmasına neden olabilir.
            </p>
          ),
        },
        {
          id: 'dosya-standartlari',
          title: 'Dosya biçimi ve okunabilirlik',
          content: (
            <>
              <p>PDF, DOCX, PPTX, JPG ve PNG gibi desteklenen biçimleri kullanın. Dosyanın boyutu 50 MB sınırını aşmamalıdır.</p>
              <p>Başlık ve açıklamayı içeriği doğru yansıtacak şekilde yazın; taranmış belgelerin okunaklı olduğundan ve kişisel bilgileri içermediğinden emin olun.</p>
            </>
          ),
        },
      ]}
    />
  );
}
