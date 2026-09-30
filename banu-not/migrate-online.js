const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.resolve(__dirname, 'data/banunot.db'));
try {
  db.exec(`ALTER TABLE users ADD COLUMN last_seen TEXT`);
  console.log('Added last_seen to users');
} catch (e) {
  console.log('last_seen already exists');
}
