const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.resolve(__dirname, 'data/banunot.db'));

try {
  // Update note_ai_analysis
  try {
    db.exec(`ALTER TABLE note_ai_analysis ADD COLUMN flashcards TEXT`);
    console.log('Added flashcards column.');
  } catch (e) {
    console.log('flashcards column exists:', e.message);
  }
  
  try {
    db.exec(`ALTER TABLE note_ai_analysis ADD COLUMN quiz TEXT`);
    console.log('Added quiz column.');
  } catch (e) {
    console.log('quiz column exists:', e.message);
  }

  console.log('AI Migration successful!');
} catch (error) {
  console.error('Migration failed:', error);
}
