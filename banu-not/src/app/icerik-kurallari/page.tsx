export default function ContentRulesPage() {
  return (
    <div className="container-app py-8 max-w-4xl mx-auto prose prose-navy">
      <h1>İçerik Kuralları</h1>
      <p>Platformumuzun kalitesini ve güvenliğini korumak için içerik yüklerken aşağıdaki kurallara dikkat etmeniz gerekmektedir.</p>

      <h2>1. Yüklenebilir İçerikler</h2>
      <ul>
        <li><strong>Kendi Ders Notlarınız:</strong> Derste tuttuğunuz, kendi emeğinizle hazırladığınız notlar.</li>
        <li><strong>Özetler ve Çalışma Kağıtları:</strong> Sınavlara hazırlık için oluşturduğunuz materyaller.</li>
        <li><strong>Çözümlü Örnekler:</strong> Telif hakkı içermeyen, kendi ürettiğiniz soru ve çözümler.</li>
      </ul>

      <h2>2. Kesinlikle Yasak Olan İçerikler</h2>
      <ul>
        <li><strong>Telifli Materyaller:</strong> Kitapların, ücretli kurs materyallerinin PDF'leri veya fotoğrafları.</li>
        <li><strong>Hoca Sunumları:</strong> Hocaların izni olmadan onlara ait slayt veya sınav kağıtları.</li>
        <li><strong>Kişisel Veriler:</strong> İçinde öğrenci numarası, TC kimlik no gibi kişisel veriler barındıran belgeler.</li>
        <li><strong>Zararlı İçerik:</strong> Virüs, malware veya alakasız reklam/spam içeren dosyalar.</li>
      </ul>

      <h2>3. Moderasyon Süreci</h2>
      <p>
        Yüklenen notlar genellikle "İncelemede" durumuna düşer. Yönetici veya moderatörler tarafından incelendikten sonra kurallara uygunsa yayınlanır.
        Kuralları tekrar tekrar ihlal eden kullanıcıların hesapları askıya alınabilir.
      </p>
      
      <h2>4. Dosya Formatları ve Boyutları</h2>
      <p>
        Sisteme sadece belirli dosya formatları (PDF, DOCX, PPTX, JPG, PNG vb.) yüklenebilir. Yüklenecek bir dosyanın maksimum boyutu 50 MB olarak belirlenmiştir. Lütfen notlarınızı okunaklı bir şekilde tarayarak yüklemeye özen gösterin.
      </p>
    </div>
  );
}
