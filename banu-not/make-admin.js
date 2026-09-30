const db = require('better-sqlite3')('data/banunot.db');
const email = process.argv[2];

if (!email) {
  console.log('Lütfen e-posta adresinizi girin.');
  console.log('Kullanım: node make-admin.js <email-adresiniz>');
  process.exit(1);
}

const result = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);

if (result.changes > 0) {
  console.log(`✅ Başarılı! ${email} hesabı artık SÜPER ADMIN.`);
  console.log('Yönetim paneline erişmek için çıkış yapıp tekrar giriş yapın.');
} else {
  console.log(`❌ Hata: ${email} adresiyle kayıtlı bir kullanıcı bulunamadı.`);
  console.log('Lütfen önce site üzerinden bu e-posta ile kayıt olun.');
}
