# BANÜ NOT

Bandırma Onyedi Eylül Üniversitesi öğrencileri için ders notu paylaşım ve akademik dayanışma platformu. Uygulama Next.js App Router, SQLite ve NextAuth kullanır.

## Gereksinimler

- Node.js 22 veya üzeri
- npm

## Yerel geliştirme

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde açılır. Geliştirme ortamında veritabanı ilk API isteğinde oluşturulur ve boşsa demo verileri eklenir. Varsayılan SQLite dosyası `data/banunot.db` konumundadır; `BANUNOT_DB_PATH` ile başka bir dosya yolu seçilebilir.

İlk yerel kurulumda demo verisini açıkça eklemek için:

```powershell
npm run db:seed
```

Seed komutu var olan bir üniversite kaydı bulursa veriyi tekrar eklemez. Demo seed; `admin@banunot.com`, `elif@ornek.com`, `ahmet@ornek.com` ve `zeynep@ornek.com` hesaplarını `demo1234` parolasıyla oluşturur. Bu hesaplar yalnızca yerel geliştirme ve izole test veritabanı içindir; üretim ortamında demo seed çalıştırılmaz.

Bir kullanıcı hesabını yönetici yapmak için önce site üzerinden hesap oluşturun, ardından proje dizininde çalıştırın:

```powershell
node make-admin.js kullanici@ogr.bandirma.edu.tr
```

Komut varsayılan SQLite dosyasını kullanır; farklı bir veritabanı seçtiyseniz `BANUNOT_DB_PATH` değerini de verin. Rol değişikliğinden sonra hesabın oturumunu kapatıp yeniden açması gerekir.

## Ortam değişkenleri

`.env.example` dosyasındaki değerleri kendi ortamınıza göre düzenleyin:

| Değişken | Amaç |
| --- | --- |
| `NEXTAUTH_SECRET` | Oturum imzalama anahtarı; üretimde güçlü ve gizli bir değer kullanın. |
| `NEXTAUTH_URL` | Uygulamanın kök adresi. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | İsteğe bağlı web push bildirimleri. Push anahtarlarını bir kez üretip güvenli biçimde saklayın. |
| `BANUNOT_DB_PATH` | Çalışma zamanındaki SQLite dosyası; varsayılan `./data/banunot.db`. |
| `DATABASE_URL` | Prisma şemasının SQLite bağlantısı; şema `prisma/` altında olduğu için örnek yol `file:../data/banunot.db` şeklindedir. |
| `UPLOAD_DIR` | Kullanıcı dosyalarının kalıcı olarak saklanacağı dizin. |
| `MAX_FILE_SIZE_MB` | Yükleme boyutu sınırı. |
| `GEMINI_API_KEY` | İsteğe bağlı yapay zekâ not analizi. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | İsteğe bağlı Google ile giriş. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Kayıt ve doğrulama e-postaları için SMTP. `SMTP_USER` ve `SMTP_PASS` birlikte verilmelidir. |

Uygulamanın çalışma zamanı SQLite erişimi `BANUNOT_DB_PATH` kullanır. Prisma CLI kullanıldığında `.env` içindeki `DATABASE_URL` değerini aynı veritabanını gösterecek şekilde tutun.

Web push anahtarlarını bir kez üretmek için proje dizininde şu komutu çalıştırın ve çıktıyı `.env` dosyasına aktarın:

```powershell
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Çıktıdaki `publicKey` değerini `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `privateKey` değerini yalnızca sunucuda tutulan `VAPID_PRIVATE_KEY` olarak kaydedin. `VAPID_SUBJECT` için uygulama sahibine ait erişilebilir bir `mailto:` adresi kullanın. Üretim ortamında `.env` dosyasını depoya eklemeyin; değişkenleri dağıtım sağlayıcısının gizli ortam değişkenleri bölümünde ayarlayın. Push bildirimleri HTTPS ve kullanıcı izni gerektirir. Manifest ve service worker yüklü uygulama/çevrimdışı kabuğu sağlar; API yanıtları ve yüklenen dosyalar çevrimdışı önbelleğe alınmaz.

Yeni parola hesabı oluşturmak için SMTP değişkenlerini yapılandırın. Kayıttan sonra öğrenci adresine gönderilen bağlantı 24 saat geçerlidir; giriş için e-posta doğrulaması gerekir. E-postaya ulaşamayan kullanıcı `/dogrulama-e-postasi` sayfasından dakikada bir yeni bağlantı isteyebilir. Google ile girişte yalnızca üniversite öğrenci adresi ve Google tarafından doğrulanmış e-posta kabul edilir. Yerel SMTP ayarı yapılmadıysa kayıt endpoint'i e-posta gönderemediği için hesabı oluşturmadan `503` döndürür.

## Veritabanı ve seed

- Tablolar uygulamanın ilk açılışında `CREATE TABLE IF NOT EXISTS` ile hazırlanır.
- Önceki kurulumlardan kalan SQLite dosyaları için eksik sütunlar açılışta geriye uyumlu biçimde eklenir.
- Demo seed tek transaction içinde çalışır; hata oluşursa yarım demo veri bırakmaz.
- Seed kayıtları tekrarlanabilir ve gerçek dosya olmayan sahte PDF referansları oluşturmaz.
- Üretim veritabanı otomatik demo kullanıcılarıyla doldurulmaz. Üretimde yönetici hesabı için kullanıcı kaydı ve `make-admin.js` akışını kullanın.

Mevcut kullanıcı verisini değiştirmeden önce SQLite dosyasının yedeğini alın. `BANUNOT_DB_PATH` ayarını değiştirmeniz uygulamanın kullandığı veritabanını değiştirir.

## Kalite kontrolleri

```powershell
npm run lint
npm run build
```

Üretim derlemesi ve geçici SQLite veritabanıyla gerçek HTTP istekleri yapan canlı smoke test akışı:

```powershell
npm run test:live
```

Bu komut izole bir demo veritabanı oluşturur, production build alır, Next.js sunucusunu geçici bir portta başlatır; ana sayfa, akademik katalog, not API'si, auth sağlayıcıları, admin sayfası ve yetkisiz admin erişimini doğruladıktan sonra test sunucusunu ve geçici veriyi temizler.

Çalışan başka bir ortama karşı yalnızca smoke testleri yürütmek için:

```powershell
$env:LIVE_TEST_URL = "https://test.example.com"
npm run test:live
```

GitHub Actions, her push ve pull request'te lint ile izole canlı smoke testini çalıştırır.

## Üretim notları

Uygulamanın SQLite veritabanı ve `UPLOAD_DIR` dizini dağıtımlar arasında kalıcı diskte tutulmalıdır. Geçici dosya sistemi kullanan serverless ortamlarda yerel SQLite ve dosya yükleme depolaması kalıcı olmayabilir; bu durumda dağıtım öncesinde kalıcı veritabanı/dosya depolaması yapılandırın.
