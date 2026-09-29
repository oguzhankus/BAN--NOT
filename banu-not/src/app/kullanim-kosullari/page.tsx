export default function TermsOfUsePage() {
  return (
    <div className="container-app py-8 max-w-4xl mx-auto prose prose-navy">
      <h1>Kullanım Koşulları</h1>
      <p>Son güncellenme tarihi: {new Date().toLocaleDateString('tr-TR')}</p>

      <h2>1. Kabul Beyanı</h2>
      <p>
        BANÜ NOT (bundan böyle "Platform" olarak anılacaktır) web sitesine erişerek ve kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız. 
        Kabul etmiyorsanız platformu kullanmayınız.
      </p>

      <h2>2. Hizmetin Amacı</h2>
      <p>
        Platform, Balıkesir Üniversitesi öğrencileri başta olmak üzere üniversite öğrencilerinin kendi hazırladıkları ders notlarını paylaşmalarını sağlayan eğitim amaçlı ücretsiz bir sosyal platformdur.
      </p>

      <h2>3. Kullanıcı Yükümlülükleri</h2>
      <ul>
        <li>Kullanıcı, platforma kayıt olurken doğru ve güncel bilgiler vermekle yükümlüdür.</li>
        <li>Kullanıcı, sadece kendisine ait veya paylaşım hakkına sahip olduğu içerikleri yükleyebilir.</li>
        <li>Platform üzerinde hakaret, nefret söylemi, yasa dışı içerik veya spam paylaşımı kesinlikle yasaktır.</li>
      </ul>

      <h2>4. Telif Hakları</h2>
      <p>
        Kullanıcılar, telif hakkı başkasına (örneğin hocalara, yayınevlerine) ait materyalleri (sunumlar, ders kitapları vb.) platforma yükleyemezler. 
        Bu tür içerikler tespit edildiğinde veya şikayet üzerine haber verilmeksizin kaldırılır.
      </p>

      <h2>5. Sorumluluk Reddi</h2>
      <p>
        Platform yönetimi, kullanıcılar tarafından yüklenen notların doğruluğunu veya kalitesini garanti etmez. Notların kullanımından doğacak akademik sonuçlar tamamen kullanıcının kendi sorumluluğundadır.
      </p>

      <h2>6. Değişiklikler</h2>
      <p>
        Platform yönetimi, önceden haber vermeksizin kullanım koşullarını değiştirme hakkını saklı tutar.
      </p>
    </div>
  );
}
