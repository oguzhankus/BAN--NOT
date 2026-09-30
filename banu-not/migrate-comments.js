const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'data/banunot.db'));

try {
  // Add parent_id to comments for replies
  try {
    db.exec(`ALTER TABLE comments ADD COLUMN parent_id TEXT`);
  } catch (e) {
    console.log('parent_id already exists or error:', e.message);
  }

  // Add comment_likes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id TEXT PRIMARY KEY,
      comment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(comment_id, user_id)
    );
  `);

  // Update reports table to support reporting comments
  try {
    db.exec(`ALTER TABLE reports ADD COLUMN target_type TEXT DEFAULT 'note'`);
  } catch (e) {
    console.log('target_type already exists or error:', e.message);
  }
  try {
    db.exec(`ALTER TABLE reports ADD COLUMN target_id TEXT`);
  } catch (e) {
    console.log('target_id already exists or error:', e.message);
  }

  // Migrate existing reports to use target_id = note_id
  db.exec(`UPDATE reports SET target_type = 'note', target_id = note_id WHERE target_id IS NULL`);

  console.log('Migration successful!');
} catch (error) {
  console.error('Migration failed:', error);
}
