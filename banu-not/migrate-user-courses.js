const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve(__dirname, 'data/banunot.db'));

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_courses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
    );
  `);
  console.log('user_courses table created successfully.');
} catch (e) {
  console.error('Error creating user_courses table:', e);
}
