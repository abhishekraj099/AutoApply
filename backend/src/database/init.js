const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

const DB_PATH = path.join(__dirname, '../../database/autoapply.db');
const dbDir = path.dirname(DB_PATH);

let db = null;

function getDbSync() {
  if (!db) throw new Error('Database not initialized. Call initializeDatabase() first.');
  return db;
}

function saveToFile() {
  try {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    logger.error('Failed to save database', { error: err.message });
  }
}

async function initializeDatabase() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    logger.info('SQLite database loaded from file', { path: DB_PATH });
  } else {
    db = new SQL.Database();
    logger.info('New SQLite database created', { path: DB_PATH });
  }

  db.run('PRAGMA foreign_keys = ON');

  const tables = [
    `CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, subject TEXT NOT NULL,
      body TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS email_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS email_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, list_id INTEGER NOT NULL, email TEXT NOT NULL,
      name TEXT, company TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (list_id) REFERENCES email_lists(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, original_name TEXT NOT NULL, file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL, mime_type TEXT NOT NULL DEFAULT 'application/pdf',
      is_default INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('bulk','custom')),
      template_id INTEGER, email_list_id INTEGER, resume_id INTEGER,
      subject TEXT, body TEXT, scheduled_at DATETIME,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','running','completed','failed','cancelled')),
      total_emails INTEGER DEFAULT 0, sent_count INTEGER DEFAULT 0, failed_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL,
      FOREIGN KEY (email_list_id) REFERENCES email_lists(id) ON DELETE SET NULL,
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS campaign_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id INTEGER NOT NULL, to_email TEXT NOT NULL,
      to_name TEXT, company TEXT, subject TEXT NOT NULL, body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','cancelled')),
      retry_count INTEGER DEFAULT 0, error_message TEXT, smtp_message_id TEXT,
      sent_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_email_id INTEGER, campaign_id INTEGER,
      event TEXT NOT NULL, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_email_id) REFERENCES campaign_emails(id) ON DELETE SET NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS send_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT, to_email TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  for (const sql of tables) db.run(sql);

  db.run('CREATE INDEX IF NOT EXISTS idx_ce_campaign ON campaign_emails(campaign_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_ce_status ON campaign_emails(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_ec_list ON email_contacts(list_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_st_email ON send_tracking(to_email, sent_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_el_campaign ON email_logs(campaign_id)');

  saveToFile();
  logger.info('Database schema initialized');
}

function closeDatabase() {
  if (db) {
    saveToFile();
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

// --- Query helpers ---
function queryAll(sql, params = []) {
  const d = getDbSync();
  const stmt = d.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runSql(sql, params = []) {
  const d = getDbSync();
  d.run(sql, params);
  saveToFile();
}

function getLastInsertId() {
  const row = queryOne('SELECT last_insert_rowid() as id');
  return row ? row.id : null;
}

module.exports = { getDbSync, initializeDatabase, closeDatabase, queryAll, queryOne, runSql, getLastInsertId, saveToFile };
