const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'data/banunot.db'));

try {
  try {
    db.exec(`ALTER TABLE note_files ADD COLUMN file_hash TEXT`);
    console.log('Added file_hash to note_files');
  } catch (e) {
    console.log('file_hash exists or error:', e.message);
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        link TEXT,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Created announcements table');
  } catch (e) {
    console.log('Error creating announcements:', e.message);
  }

  console.log('Migration Phase 2 complete.');
} catch (error) {
  console.error('Migration failed:', error);
}
