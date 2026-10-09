async function makeAdmin() {
  const [{ default: path }, { default: Database }] = await Promise.all([
    import('node:path'),
    import('better-sqlite3'),
  ]);
  const dbPath = path.resolve(process.cwd(), process.env.BANUNOT_DB_PATH || 'data/banunot.db');
  const db = new Database(dbPath);
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    db.close();
    throw new Error('Kullanım: node make-admin.js <email-adresiniz>');
  }

  const result = db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  db.close();

  if (!result.changes) {
    throw new Error(`${email} adresiyle kayıtlı kullanıcı bulunamadı. Önce site üzerinden kayıt olun.`);
  }

  console.log(`✅ Başarılı! ${email} hesabı artık yönetici.`);
  console.log('Yönetim paneline erişmek için çıkış yapıp tekrar giriş yapın.');
}

makeAdmin().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
