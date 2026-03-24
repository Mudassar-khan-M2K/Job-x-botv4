const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'jobs.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables on first run - fully automatic
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT,
    location TEXT,
    education TEXT,
    deadline TEXT,
    salary TEXT,
    url TEXT,
    category TEXT CHECK(category IN ('govt', 'defence', 'private')),
    source TEXT,
    sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cmd_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT,
    number TEXT,
    command TEXT,
    chat_type TEXT,
    chat_jid TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stats (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    source TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_sent ON jobs(sent);
  CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
  CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
  CREATE INDEX IF NOT EXISTS idx_cmd_logs_timestamp ON cmd_logs(timestamp);
`);

// ─── Job Functions ─────────────────────────────────────────────────────────

function insertJob(job) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO jobs (id, title, organization, location, education, deadline, salary, url, category, source)
    VALUES (@id, @title, @organization, @location, @education, @deadline, @salary, @url, @category, @source)
  `);
  return stmt.run(job);
}

function insertManyJobs(jobs) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO jobs (id, title, organization, location, education, deadline, salary, url, category, source)
    VALUES (@id, @title, @organization, @location, @education, @deadline, @salary, @url, @category, @source)
  `);
  const insertAll = db.transaction((jobList) => {
    let inserted = 0;
    for (const job of jobList) {
      const result = insert.run(job);
      inserted += result.changes;
    }
    return inserted;
  });
  return insertAll(jobs);
}

function getNextUnsentJob() {
  return db.prepare(`
    SELECT * FROM jobs WHERE sent = 0 ORDER BY created_at ASC LIMIT 1
  `).get();
}

function markJobSent(id) {
  return db.prepare(`UPDATE jobs SET sent = 1 WHERE id = ?`).run(id);
}

function getJobsByCategory(category) {
  return db.prepare(`
    SELECT * FROM jobs WHERE category = ? ORDER BY created_at DESC LIMIT 20
  `).all(category);
}

function getJobsBySource(source) {
  return db.prepare(`
    SELECT * FROM jobs WHERE source = ? ORDER BY created_at DESC LIMIT 20
  `).all(source);
}

function getJobsByEducation(edu) {
  return db.prepare(`
    SELECT * FROM jobs WHERE education LIKE ? ORDER BY created_at DESC LIMIT 20
  `).all(`%${edu}%`);
}

function getAllRecentJobs() {
  return db.prepare(`
    SELECT * FROM jobs ORDER BY created_at DESC LIMIT 30
  `).all();
}

function cleanOldJobs(maxCount) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM jobs`).get().c;
  if (count > maxCount) {
    db.prepare(`
      DELETE FROM jobs WHERE id IN (
        SELECT id FROM jobs WHERE sent = 1 ORDER BY created_at ASC LIMIT ?
      )
    `).run(count - maxCount);
  }
}

// ─── Stats Functions ────────────────────────────────────────────────────────

function getStat(key) {
  const row = db.prepare(`SELECT value FROM stats WHERE key = ?`).get(key);
  return row ? row.value : null;
}

function setStat(key, value) {
  db.prepare(`
    INSERT OR REPLACE INTO stats (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(key, String(value));
}

function incrementStat(key) {
  const current = parseInt(getStat(key) || '0');
  setStat(key, current + 1);
  return current + 1;
}

function getDashboardStats() {
  const totalJobs = db.prepare(`SELECT COUNT(*) as c FROM jobs`).get().c;
  const sentJobs = db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE sent = 1`).get().c;
  const unsentJobs = db.prepare(`SELECT COUNT(*) as c FROM jobs WHERE sent = 0`).get().c;
  const todayJobs = db.prepare(`
    SELECT COUNT(*) as c FROM jobs WHERE DATE(created_at) = DATE('now')
  `).get().c;
  const totalCmds = db.prepare(`SELECT COUNT(*) as c FROM cmd_logs`).get().c;
  const todayErrors = db.prepare(`
    SELECT COUNT(*) as c FROM errors WHERE DATE(timestamp) = DATE('now')
  `).get().c;

  const sourceStats = db.prepare(`
    SELECT source, COUNT(*) as count FROM jobs GROUP BY source ORDER BY count DESC
  `).all();

  const recentCmds = db.prepare(`
    SELECT * FROM cmd_logs ORDER BY timestamp DESC LIMIT 50
  `).all();

  return {
    totalJobs, sentJobs, unsentJobs, todayJobs,
    totalCmds, todayErrors, sourceStats, recentCmds,
    lastScrape: getStat('last_scrape'),
    startTime: getStat('start_time')
  };
}

// ─── Log Functions ──────────────────────────────────────────────────────────

function logCommand(jid, number, command, chatType, chatJid) {
  db.prepare(`
    INSERT INTO cmd_logs (jid, number, command, chat_type, chat_jid)
    VALUES (?, ?, ?, ?, ?)
  `).run(jid, number, command, chatType, chatJid);
}

function logError(type, source, message) {
  db.prepare(`
    INSERT INTO errors (type, source, message) VALUES (?, ?, ?)
  `).run(type, source, message);
}

module.exports = {
  db,
  insertJob,
  insertManyJobs,
  getNextUnsentJob,
  markJobSent,
  getJobsByCategory,
  getJobsBySource,
  getJobsByEducation,
  getAllRecentJobs,
  cleanOldJobs,
  getStat,
  setStat,
  incrementStat,
  getDashboardStats,
  logCommand,
  logError
};
