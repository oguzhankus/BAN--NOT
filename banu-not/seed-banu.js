const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new Database('data/banunot.db');

// Update University Name
db.prepare("UPDATE universities SET name = 'Bandırma Onyedi Eylül Üniversitesi'").run();
const uni = db.prepare("SELECT id FROM universities LIMIT 1").get();
const uniId = uni.id;

// Delete old faculties and departments
db.prepare('DELETE FROM departments').run();
db.prepare('DELETE FROM faculties').run();

// Insert new faculties and departments for BANÜ
const faculties = [
  {
    name: 'Mühendislik ve Doğa Bilimleri Fakültesi',
    short_name: 'MDBF',
    type: 'faculty',
    departments: ['Bilgisayar Mühendisliği', 'Yazılım Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Endüstri Mühendisliği', 'İnşaat Mühendisliği']
  },
  {
    name: 'İktisadi ve İdari Bilimler Fakültesi',
    short_name: 'İİBF',
    type: 'faculty',
    departments: ['İşletme', 'İktisat', 'Siyaset Bilimi ve Kamu Yönetimi', 'Uluslararası İlişkiler', 'Maliye', 'Ekonometri']
  },
  {
    name: 'İnsan ve Toplum Bilimleri Fakültesi',
    short_name: 'İTBF',
    type: 'faculty',
    departments: ['Tarih', 'Türk Dili ve Edebiyatı', 'Sosyoloji', 'Coğrafya', 'Psikoloji']
  },
  {
    name: 'Sağlık Bilimleri Fakültesi',
    short_name: 'SBF',
    type: 'faculty',
    departments: ['Hemşirelik', 'Fizyoterapi ve Rehabilitasyon', 'Beslenme ve Diyetetik', 'Sağlık Yönetimi']
  },
  {
    name: 'Denizcilik Fakültesi',
    short_name: 'DF',
    type: 'faculty',
    departments: ['Denizcilik İşletmeleri Yönetimi', 'Gemi İnşaatı ve Gemi Makineleri Mühendisliği']
  },
  {
    name: 'Spor Bilimleri Fakültesi',
    short_name: 'SPO',
    type: 'faculty',
    departments: ['Beden Eğitimi ve Spor Öğretmenliği', 'Antrenörlük Eğitimi', 'Spor Yöneticiliği']
  },
  {
    name: 'Bandırma Meslek Yüksekokulu',
    short_name: 'BMYO',
    type: 'vocational_school',
    departments: ['Bilgisayar Programcılığı', 'Dış Ticaret', 'Gıda Teknolojisi', 'İşletme Yönetimi']
  }
];

const insertFaculty = db.prepare(`
  INSERT INTO faculties (id, university_id, name, short_name, type) 
  VALUES (?, ?, ?, ?, ?)
`);

const insertDept = db.prepare(`
  INSERT INTO departments (id, faculty_id, name) 
  VALUES (?, ?, ?)
`);

faculties.forEach(f => {
  const fId = uuidv4();
  insertFaculty.run(fId, uniId, f.name, f.short_name, f.type);
  
  f.departments.forEach(d => {
    insertDept.run(uuidv4(), fId, d);
  });
});

console.log('BANÜ faculties and departments seeded successfully.');
