import PolicyPageLayout from '@/components/PolicyPageLayout';
import { UNIVERSITY } from '@/lib/constants';

export default function TermsOfUsePage() {
  return (
    <PolicyPageLayout
      title="Kullanım Koşulları"
      description="BANÜ NOT'u kullanmadan önce platformun amacı, kullanıcı sorumlulukları ve içerik paylaşımına ilişkin temel koşulları gözden geçirin."
      updatedAt={new Date().toLocaleDateString('tr-TR')}
      sections={[
        {
          id: 'kabul',
          title: 'Koşulların kabulü',
          content: (
            <p>
              BANÜ NOT (bundan böyle &quot;Platform&quot; olarak anılacaktır) web sitesine erişerek ve kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız. Kabul etmiyorsanız platformu kullanmayınız.
            </p>
          ),
        },
        {
          id: 'hizmetin-amaci',
          title: 'Hizmetin amacı',
          content: (
            <p>
              BANÜ NOT, başta {UNIVERSITY.name} öğrencileri olmak üzere üniversite öğrencilerinin kendi hazırladıkları ders notlarını paylaşmalarına yardımcı olan ücretsiz bir eğitim platformudur.
            </p>
          ),
        },
        {
          id: 'kullanici-sorumluluklari',
          title: 'Kullanıcı sorumlulukları',
          content: (
            <ul>
              <li>Kayıt sırasında doğru ve güncel bilgiler vermek.</li>
              <li>Yalnızca size ait olan veya paylaşma hakkına sahip olduğunuz içerikleri yüklemek.</li>
              <li>Platform üzerinde hakaret, nefret söylemi, yasa dışı içerik veya spam paylaşmamak.</li>
            </ul>
          ),
        },
        {
          id: 'telif',
          title: 'Telif hakları',
          content: (
            <p>
              Kullanıcılar, telif hakkı başkasına (örneğin hocalara, yayınevlerine) ait materyalleri (sunumlar, ders kitapları vb.) platforma yükleyemezler. Bu tür içerikler tespit edildiğinde veya şikayet üzerine haber verilmeksizin kaldırılır.
            </p>
          ),
        },
        {
          id: 'sorumluluk',
          title: 'İçerik ve sorumluluk',
          content: (
            <p>
              Platform yönetimi, kullanıcılar tarafından yüklenen notların doğruluğunu veya kalitesini garanti etmez. Notların kullanımından doğacak akademik sonuçlar tamamen kullanıcının kendi sorumluluğundadır.
            </p>
          ),
        },
        {
          id: 'degisiklikler',
          title: 'Koşullardaki değişiklikler',
          content: (
            <p>
              Platform yönetimi, önceden haber vermeksizin kullanım koşullarını değiştirme hakkını saklı tutar.
            </p>
          ),
        },
      ]}
    />
  );
}
