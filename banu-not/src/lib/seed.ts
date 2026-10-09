import { getDb } from './db.ts';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export async function seedDatabase() {
  const db = getDb();
  const existingUni = db.prepare('SELECT id FROM universities LIMIT 1').get();
  if (existingUni) return;

  const passwordHash = await bcrypt.hash('demo1234', 12);
  const seed = db.transaction(() => {
  console.log('🌱 Veritabanı demo verileri oluşturuluyor...');

  // Create university
  const uniId = uuid();
  db.prepare(`
    INSERT INTO universities (id, name, short_name, sort_order) 
    VALUES (?, ?, ?, ?)
  `).run(uniId, 'Bandırma Onyedi Eylül Üniversitesi', 'BANÜ', 1);

  // Create faculties
  const faculties = [
    { id: uuid(), name: 'Mühendislik Fakültesi', short: 'MÜH', type: 'faculty' },
    { id: uuid(), name: 'Fen-Edebiyat Fakültesi', short: 'FEF', type: 'faculty' },
    { id: uuid(), name: 'İktisadi ve İdari Bilimler Fakültesi', short: 'İİBF', type: 'faculty' },
    { id: uuid(), name: 'Tıp Fakültesi', short: 'TIP', type: 'faculty' },
    { id: uuid(), name: 'Eğitim Fakültesi', short: 'EĞT', type: 'faculty' },
    { id: uuid(), name: 'Mimarlık Fakültesi', short: 'MİM', type: 'faculty' },
    { id: uuid(), name: 'Sağlık Bilimleri Fakültesi', short: 'SBF', type: 'faculty' },
    { id: uuid(), name: 'Veteriner Fakültesi', short: 'VET', type: 'faculty' },
    { id: uuid(), name: 'Necatibey Eğitim Fakültesi', short: 'NEF', type: 'faculty' },
    { id: uuid(), name: 'Fen Bilimleri Enstitüsü', short: 'FBE', type: 'institute' },
  ];

  const insertFaculty = db.prepare(`
    INSERT INTO faculties (id, name, short_name, university_id, type, sort_order) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  faculties.forEach((f, i) => {
    insertFaculty.run(f.id, f.name, f.short, uniId, f.type, i);
  });

  // Create departments
  const departments: { id: string; name: string; facultyId: string }[] = [];

  const deptData: Record<string, string[]> = {
    [faculties[0].id]: ['Bilgisayar Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Makine Mühendisliği', 'İnşaat Mühendisliği', 'Endüstri Mühendisliği', 'Çevre Mühendisliği'],
    [faculties[1].id]: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türk Dili ve Edebiyatı', 'Tarih', 'Sosyoloji', 'Psikoloji'],
    [faculties[2].id]: ['İşletme', 'İktisat', 'Kamu Yönetimi', 'Maliye', 'Uluslararası İlişkiler'],
    [faculties[3].id]: ['Temel Tıp Bilimleri', 'Dahili Tıp Bilimleri', 'Cerrahi Tıp Bilimleri'],
    [faculties[4].id]: ['Bilgisayar ve Öğretim Teknolojileri Eğitimi', 'Türkçe Eğitimi', 'İlköğretim Matematik Eğitimi'],
    [faculties[5].id]: ['Mimarlık', 'Şehir ve Bölge Planlama'],
  };

  const insertDept = db.prepare(`
    INSERT INTO departments (id, name, faculty_id, sort_order) 
    VALUES (?, ?, ?, ?)
  `);

  Object.entries(deptData).forEach(([facultyId, depts]) => {
    depts.forEach((name, i) => {
      const id = uuid();
      insertDept.run(id, name, facultyId, i);
      departments.push({ id, name, facultyId });
    });
  });

  // Create courses
  const bilgisayarDeptId = departments.find(d => d.name === 'Bilgisayar Mühendisliği')!.id;
  const matematikDeptId = departments.find(d => d.name === 'Matematik')!.id;
  const isletmeDeptId = departments.find(d => d.name === 'İşletme')!.id;
  const fizikDeptId = departments.find(d => d.name === 'Fizik')!.id;
  const elektrikDeptId = departments.find(d => d.name === 'Elektrik-Elektronik Mühendisliği')!.id;

  const courseData = [
    { name: 'Veri Yapıları ve Algoritmalar', code: 'BLM2011', depts: [bilgisayarDeptId] },
    { name: 'Nesne Yönelimli Programlama', code: 'BLM2021', depts: [bilgisayarDeptId] },
    { name: 'Veritabanı Yönetim Sistemleri', code: 'BLM3011', depts: [bilgisayarDeptId] },
    { name: 'İşletim Sistemleri', code: 'BLM3021', depts: [bilgisayarDeptId] },
    { name: 'Bilgisayar Ağları', code: 'BLM3031', depts: [bilgisayarDeptId] },
    { name: 'Yapay Zeka', code: 'BLM4011', depts: [bilgisayarDeptId] },
    { name: 'Web Programlama', code: 'BLM3041', depts: [bilgisayarDeptId] },
    { name: 'Lineer Cebir', code: 'MAT2011', depts: [matematikDeptId, bilgisayarDeptId] },
    { name: 'Diferansiyel Denklemler', code: 'MAT2021', depts: [matematikDeptId] },
    { name: 'Olasılık ve İstatistik', code: 'MAT2031', depts: [matematikDeptId, bilgisayarDeptId] },
    { name: 'Calculus I', code: 'MAT1011', depts: [matematikDeptId, bilgisayarDeptId, fizikDeptId, elektrikDeptId] },
    { name: 'Calculus II', code: 'MAT1021', depts: [matematikDeptId, bilgisayarDeptId, fizikDeptId, elektrikDeptId] },
    { name: 'Genel Fizik I', code: 'FİZ1011', depts: [fizikDeptId, bilgisayarDeptId, elektrikDeptId] },
    { name: 'Genel Fizik II', code: 'FİZ1021', depts: [fizikDeptId, bilgisayarDeptId, elektrikDeptId] },
    { name: 'Genel İşletme', code: 'İŞL1011', depts: [isletmeDeptId] },
    { name: 'Muhasebe', code: 'İŞL1021', depts: [isletmeDeptId] },
    { name: 'Pazarlama İlkeleri', code: 'İŞL2011', depts: [isletmeDeptId] },
    { name: 'Devre Analizi', code: 'EEM2011', depts: [elektrikDeptId] },
    { name: 'Sinyal ve Sistemler', code: 'EEM3011', depts: [elektrikDeptId] },
  ];

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, name, code, university_id) 
    VALUES (?, ?, ?, ?)
  `);

  const insertCourseDept = db.prepare(`
    INSERT INTO course_departments (id, course_id, department_id) 
    VALUES (?, ?, ?)
  `);

  const courses: { id: string; name: string; code: string }[] = [];

  courseData.forEach(c => {
    const id = uuid();
    insertCourse.run(id, c.name, c.code, uniId);
    courses.push({ id, name: c.name, code: c.code });
    c.depts.forEach(deptId => {
      insertCourseDept.run(uuid(), id, deptId);
    });
  });

  // Create demo users
  const adminId = uuid();
  const user1Id = uuid();
  const user2Id = uuid();
  const user3Id = uuid();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, first_name, last_name, role, is_email_verified, university_id, faculty_id, department_id, class_year, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
  `);

  insertUser.run(adminId, 'admin@banunot.com', passwordHash, 'Yönetici', 'Admin', 'BANÜ NOT', 'admin', uniId, faculties[0].id, bilgisayarDeptId, null, 'Platform yöneticisi');
  insertUser.run(user1Id, 'elif@ornek.com', passwordHash, 'Elif Yılmaz', 'Elif', 'Yılmaz', 'user', uniId, faculties[0].id, bilgisayarDeptId, 3, 'Bilgisayar Mühendisliği 3. sınıf öğrencisi');
  insertUser.run(user2Id, 'ahmet@ornek.com', passwordHash, 'Ahmet Kaya', 'Ahmet', 'Kaya', 'user', uniId, faculties[1].id, matematikDeptId, 2, 'Matematik bölümü öğrencisi');
  insertUser.run(user3Id, 'zeynep@ornek.com', passwordHash, 'Zeynep Demir', 'Zeynep', 'Demir', 'moderator', uniId, faculties[2].id, isletmeDeptId, 4, 'İşletme bölümü son sınıf');

  // Create tags
  const tagNames = ['final', 'vize', 'ödev', 'formül', 'özet', 'çıkmış', 'slayt', 'çözümlü', 'teorik', 'pratik', 'kaynak'];
  const tags: Record<string, string> = {};

  const insertTag = db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
  tagNames.forEach(name => {
    const id = uuid();
    insertTag.run(id, name);
    tags[name] = id;
  });

  // Create demo notes
  const insertNote = db.prepare(`
    INSERT INTO notes (id, title, description, note_type, university_id, faculty_id, department_id, course_id, course_code, semester, academic_year, topic, user_id, status, download_count, view_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
  `);

  const insertNoteTag = db.prepare('INSERT INTO note_tags (id, note_id, tag_id) VALUES (?, ?, ?)');

  const demoNotes = [
    {
      title: 'Veri Yapıları - Ağaçlar ve Graflar Ders Notu',
      description: 'İkili ağaçlar, AVL ağaçları, graf temsili ve BFS/DFS algoritmaları hakkında kapsamlı ders notu. Örnek kodlar ve açıklamalar içerir.',
      noteType: 'ders_notu',
      courseIdx: 0,
      userId: user1Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'guz',
      year: '2025-2026',
      topic: 'Ağaçlar ve Graflar',
      downloads: 45,
      views: 120,
      tags: ['özet', 'teorik', 'çözümlü'],
      date: '2025-11-15T10:00:00Z',
    },
    {
      title: 'Nesne Yönelimli Programlama - Java Çıkmış Sorular',
      description: '2023-2024 güz dönemi vize ve final çıkmış soruları. Çözümlü örnekler dahildir.',
      noteType: 'cikmis_soru',
      courseIdx: 1,
      userId: user1Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'guz',
      year: '2024-2025',
      topic: 'Kalıtım ve Polimorfizm',
      downloads: 78,
      views: 210,
      tags: ['çıkmış', 'final', 'vize', 'çözümlü'],
      date: '2025-10-20T14:00:00Z',
    },
    {
      title: 'Veritabanı Yönetim Sistemleri Özet',
      description: 'SQL temelleri, normalizasyon, ER diyagramları ve ilişkisel cebir konularını kapsayan ders özeti.',
      noteType: 'ozet',
      courseIdx: 2,
      userId: user2Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'bahar',
      year: '2024-2025',
      topic: 'SQL ve Normalizasyon',
      downloads: 62,
      views: 180,
      tags: ['özet', 'final'],
      date: '2025-12-01T09:00:00Z',
    },
    {
      title: 'Lineer Cebir - Matris İşlemleri ve Determinantlar',
      description: 'Matris çarpımı, tersi, determinant hesaplama yöntemleri ve örnekleri.',
      noteType: 'ders_notu',
      courseIdx: 7,
      userId: user2Id,
      deptId: matematikDeptId,
      facId: faculties[1].id,
      semester: 'guz',
      year: '2025-2026',
      topic: 'Matrisler ve Determinantlar',
      downloads: 33,
      views: 95,
      tags: ['formül', 'çözümlü', 'teorik'],
      date: '2025-11-28T16:00:00Z',
    },
    {
      title: 'Calculus I - Limit ve Süreklilik Sunum',
      description: 'Derste kullanılan limit tanımı, limit kuralları ve süreklilik kavramlarını anlatan sunum dosyası.',
      noteType: 'sunum',
      courseIdx: 10,
      userId: user1Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'guz',
      year: '2025-2026',
      topic: 'Limit ve Süreklilik',
      downloads: 91,
      views: 250,
      tags: ['slayt', 'teorik'],
      date: '2025-09-20T11:00:00Z',
    },
    {
      title: 'İşletim Sistemleri - Process Yönetimi',
      description: 'Process oluşturma, zamanlama algoritmaları, thread kavramları ve senkronizasyon.',
      noteType: 'ders_notu',
      courseIdx: 3,
      userId: user3Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'bahar',
      year: '2024-2025',
      topic: 'Process ve Thread',
      downloads: 28,
      views: 88,
      tags: ['teorik', 'pratik'],
      date: '2026-02-14T13:00:00Z',
    },
    {
      title: 'Genel İşletme Final Özeti',
      description: 'İşletme fonksiyonları, organizasyon yapıları, yönetim teorileri kısa özet.',
      noteType: 'ozet',
      courseIdx: 14,
      userId: user3Id,
      deptId: isletmeDeptId,
      facId: faculties[2].id,
      semester: 'guz',
      year: '2025-2026',
      topic: 'Tüm Konular',
      downloads: 56,
      views: 145,
      tags: ['final', 'özet'],
      date: '2025-12-20T15:00:00Z',
    },
    {
      title: 'Yapay Zeka - Makine Öğrenmesi Çalışma Rehberi',
      description: 'Denetimli ve denetimsiz öğrenme algoritmaları, karar ağaçları, SVM, k-means kümeleme.',
      noteType: 'calisma_rehberi',
      courseIdx: 5,
      userId: user1Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'bahar',
      year: '2025-2026',
      topic: 'Makine Öğrenmesi',
      downloads: 40,
      views: 130,
      tags: ['kaynak', 'pratik', 'çözümlü'],
      date: '2026-03-10T12:00:00Z',
    },
    {
      title: 'Bilgisayar Ağları - OSI Modeli ve TCP/IP',
      description: 'OSI katmanları, TCP/IP protokol ailesi, IP adresleme ve alt ağ hesaplamaları.',
      noteType: 'ders_notu',
      courseIdx: 4,
      userId: user2Id,
      deptId: bilgisayarDeptId,
      facId: faculties[0].id,
      semester: 'guz',
      year: '2025-2026',
      topic: 'Ağ Protokolleri',
      downloads: 37,
      views: 102,
      tags: ['teorik', 'formül'],
      date: '2025-10-05T10:30:00Z',
    },
    {
      title: 'Olasılık ve İstatistik - Olasılık Dağılımları',
      description: 'Normal dağılım, binom, Poisson dağılımları ve uygulamaları.',
      noteType: 'ders_notu',
      courseIdx: 9,
      userId: user2Id,
      deptId: matematikDeptId,
      facId: faculties[1].id,
      semester: 'bahar',
      year: '2024-2025',
      topic: 'Dağılımlar',
      downloads: 29,
      views: 76,
      tags: ['formül', 'çözümlü', 'vize'],
      date: '2025-04-10T09:00:00Z',
    },
  ];

  const noteIds: { id: string }[] = [];
  demoNotes.forEach(note => {
    const noteId = uuid();
    const course = courses[note.courseIdx];
    if (!course) {
      throw new Error(`Demo seed ders referansı bulunamadı: ${note.courseIdx}`);
    }
    insertNote.run(
      noteId, note.title, note.description, note.noteType,
      uniId, note.facId, note.deptId, course.id, course.code,
      note.semester, note.year, note.topic, note.userId,
      note.downloads, note.views, note.date
    );
    noteIds.push({ id: noteId });
    note.tags.forEach(tagName => {
      if (tags[tagName]) {
        insertNoteTag.run(uuid(), noteId, tags[tagName]);
      }
    });
  });

  // Create some demo ratings
  const insertRating = db.prepare('INSERT INTO ratings (id, user_id, note_id, score) VALUES (?, ?, ?, ?)');
  
  noteIds.slice(0, 5).forEach(({ id }, index) => {
    insertRating.run(uuid(), user1Id, id, 4 + (index % 2));
  });
  noteIds.slice(2, 8).forEach(({ id }, index) => {
    insertRating.run(uuid(), user2Id, id, 3 + (index % 2));
  });
  noteIds.slice(0, 4).forEach(({ id }, index) => {
    insertRating.run(uuid(), user3Id, id, 3 + (index % 3));
  });

  // Create demo comments
  const insertComment = db.prepare('INSERT INTO comments (id, user_id, note_id, content) VALUES (?, ?, ?, ?)');
  
  if (noteIds.length > 0) {
    insertComment.run(uuid(), user2Id, noteIds[0].id, 'Çok faydalı bir kaynak olmuş, teşekkürler!');
    insertComment.run(uuid(), user3Id, noteIds[0].id, 'Örnekler gayet anlaşılır, eline sağlık.');
    insertComment.run(uuid(), user1Id, noteIds[2].id, 'Normalizasyon kısmı çok iyi özetlenmiş.');
    insertComment.run(uuid(), user3Id, noteIds[4].id, 'Sunum çok temiz hazırlanmış, hocamız da beğenmişti.');
  }

  // Create some bookmarks
  const insertBookmark = db.prepare('INSERT INTO bookmarks (id, user_id, note_id) VALUES (?, ?, ?)');
  
  if (noteIds.length > 2) {
    insertBookmark.run(uuid(), user1Id, noteIds[2].id);
    insertBookmark.run(uuid(), user1Id, noteIds[3].id);
    insertBookmark.run(uuid(), user2Id, noteIds[0].id);
    insertBookmark.run(uuid(), user2Id, noteIds[4].id);
  }

  // Create site settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO site_settings (id, key, value, type, label, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertSetting.run(uuid(), 'auto_publish', 'true', 'boolean', 'Otomatik Yayınlama', 'Yüklenen notlar otomatik olarak yayınlansın mı?');
  insertSetting.run(uuid(), 'require_login_download', 'true', 'boolean', 'İndirme İçin Üyelik', 'Not indirmek için üyelik gereksin mi?');
  insertSetting.run(uuid(), 'max_upload_size_mb', '50', 'number', 'Maks. Dosya Boyutu (MB)', 'İzin verilen en büyük dosya boyutu.');
  insertSetting.run(uuid(), 'require_login_register', 'true', 'boolean', 'Kayıt Açık', 'Yeni kullanıcı kaydı açık mı?');

  });

  seed();
  console.log('✅ Demo verileri başarıyla oluşturuldu.');
  console.log('');
  console.log('📋 Demo hesaplar:');
  console.log('  Yönetici: admin@banunot.com / demo1234');
  console.log('  Kullanıcı: elif@ornek.com / demo1234');
  console.log('  Kullanıcı: ahmet@ornek.com / demo1234');
  console.log('  Moderatör: zeynep@ornek.com / demo1234');
}
