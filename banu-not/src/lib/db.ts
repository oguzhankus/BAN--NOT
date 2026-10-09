import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'path';

const configuredDbPath = process.env.BANUNOT_DB_PATH?.trim();
const DB_PATH = configuredDbPath
  ? path.resolve(/*turbopackIgnore: true*/ process.cwd(), configuredDbPath)
  : path.resolve(process.cwd(), 'data', 'banunot.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      university_id TEXT,
      faculty_id TEXT,
      department_id TEXT,
      class_year INTEGER,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
      is_email_verified INTEGER DEFAULT 0,
      email_verify_token TEXT,
      email_verify_expires TEXT,
      email_verification_sent_at TEXT,
      reset_token TEXT,
      reset_token_expiry TEXT,
      is_active INTEGER DEFAULT 1,
      is_banned INTEGER DEFAULT 0,
      profile_public INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      short_name TEXT,
      logo_url TEXT,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS faculties (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      university_id TEXT NOT NULL,
      type TEXT DEFAULT 'faculty' CHECK(type IN ('faculty', 'institute', 'vocational_school', 'conservatory')),
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE,
      UNIQUE(name, university_id)
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT,
      faculty_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE CASCADE,
      UNIQUE(name, faculty_id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      university_id TEXT NOT NULL,
      semester TEXT,
      year INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_departments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
      UNIQUE(course_id, department_id)
    );

    CREATE TABLE IF NOT EXISTS user_courses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      note_type TEXT NOT NULL,
      content_lang TEXT DEFAULT 'tr',
      university_id TEXT,
      faculty_id TEXT,
      department_id TEXT,
      course_id TEXT,
      course_code TEXT,
      semester TEXT,
      academic_year TEXT,
      is_handwritten INTEGER DEFAULT 0,
      topic TEXT,
      user_id TEXT NOT NULL,
      status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'pending_review', 'published', 'rejected', 'removed')),
      rejection_reason TEXT,
      download_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      file_hash TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (university_id) REFERENCES universities(id),
      FOREIGN KEY (faculty_id) REFERENCES faculties(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS note_files (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      original_name TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      storage_key TEXT UNIQUE NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      scan_status TEXT DEFAULT 'pending' CHECK(scan_status IN ('pending', 'clean', 'infected', 'error')),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS note_tags (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(note_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      UNIQUE(user_id, note_id)
    );

    CREATE TABLE IF NOT EXISTS note_collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS collection_notes (
      collection_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (collection_id, note_id),
      FOREIGN KEY (collection_id) REFERENCES note_collections(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_versions (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id),
      UNIQUE(note_id, version_number)
    );

    CREATE TABLE IF NOT EXISTS note_downloads (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flashcard_reviews (
      user_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      card_index INTEGER NOT NULL,
      repetitions INTEGER NOT NULL DEFAULT 0,
      interval_days INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      next_review_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_reviewed_at TEXT,
      PRIMARY KEY (user_id, note_id, card_index),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_ai_chat (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_at TEXT NOT NULL,
      course_id TEXT,
      note_id TEXT,
      is_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      task_id TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES study_tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comment_votes (
      user_id TEXT NOT NULL,
      comment_id TEXT NOT NULL,
      vote INTEGER NOT NULL CHECK(vote IN (1, -1)),
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, comment_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT PRIMARY KEY,
      comments INTEGER NOT NULL DEFAULT 1,
      messages INTEGER NOT NULL DEFAULT 1,
      forum_replies INTEGER NOT NULL DEFAULT 1,
      note_updates INTEGER NOT NULL DEFAULT 1,
      followed_users INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      UNIQUE(user_id, note_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      note_id TEXT NOT NULL,
      parent_id TEXT,
      content TEXT NOT NULL,
      is_hidden INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
      id TEXT PRIMARY KEY,
      comment_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(comment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      note_id TEXT,
      target_type TEXT DEFAULT 'note' CHECK(target_type IN ('note', 'comment', 'user')),
      target_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
      resolution TEXT,
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      last_message_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user1_id, user2_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS note_requests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      course_id TEXT,
      faculty_id TEXT,
      department_id TEXT,
      university_id TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'fulfilled', 'closed')),
      fulfilled_by TEXT,
      fulfilled_note_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (fulfilled_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (fulfilled_note_id) REFERENCES notes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string',
      label TEXT,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS note_ai_analysis (
      id TEXT PRIMARY KEY,
      note_id TEXT UNIQUE NOT NULL,
      summary TEXT,
      key_concepts TEXT,
      potential_questions TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      course_id TEXT,
      faculty_id TEXT,
      department_id TEXT,
      view_count INTEGER DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      is_resolved INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
      FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS forum_replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_accepted INTEGER DEFAULT 0,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS forum_votes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('post', 'reply')),
      target_id TEXT NOT NULL,
      vote_type INTEGER NOT NULL CHECK(vote_type IN (1, -1)),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, target_type, target_id)
    );

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
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL,
      following_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_targets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('upload', 'download', 'study_time')),
      target_value INTEGER NOT NULL,
      period TEXT DEFAULT 'weekly' CHECK(period IN ('daily', 'weekly', 'monthly')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, target_type, period)
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_type TEXT NOT NULL,
      awarded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, badge_type)
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_faculties_university ON faculties(university_id);
    CREATE INDEX IF NOT EXISTS idx_departments_faculty ON departments(faculty_id);
    CREATE INDEX IF NOT EXISTS idx_courses_university ON courses(university_id);
    CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
    CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_university ON notes(university_id);
    CREATE INDEX IF NOT EXISTS idx_notes_faculty ON notes(faculty_id);
    CREATE INDEX IF NOT EXISTS idx_notes_department ON notes(department_id);
    CREATE INDEX IF NOT EXISTS idx_notes_course ON notes(course_id);
    CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
    CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(note_type);
    CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
    CREATE INDEX IF NOT EXISTS idx_note_files_note ON note_files(note_id);
    CREATE INDEX IF NOT EXISTS idx_comments_note ON comments(note_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_note ON reports(note_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target, target_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  `);

  ensureColumn(db, 'users', 'last_seen', 'TEXT');
  ensureColumn(db, 'users', 'email_verify_expires', 'TEXT');
  ensureColumn(db, 'users', 'email_verification_sent_at', 'TEXT');
  ensureColumn(db, 'notes', 'is_handwritten', 'INTEGER DEFAULT 0');
  ensureColumn(db, 'notes', 'ocr_text', 'TEXT');
  ensureColumn(db, 'comments', 'parent_id', 'TEXT');
  ensureColumn(db, 'reports', 'target_type', "TEXT DEFAULT 'note'");
  ensureColumn(db, 'reports', 'target_id', 'TEXT');
  ensureColumn(db, 'note_files', 'file_hash', 'TEXT');
  ensureColumn(db, 'note_ai_analysis', 'flashcards', 'TEXT');
  ensureColumn(db, 'note_ai_analysis', 'quiz', 'TEXT');
  ensureColumn(db, 'note_requests', 'fulfilled_by', 'TEXT');
  ensureColumn(db, 'note_requests', 'fulfilled_note_id', 'TEXT');
}

function ensureColumn(db: Database.Database, table: string, column: string, definition: string) {
  const columns = db.pragma(`table_info(${table})`) as { name: string }[];
  if (!columns.some(existing => existing.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export default getDb;
