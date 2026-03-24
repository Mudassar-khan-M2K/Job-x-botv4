const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'jobs.db');

let db = null;

// Save DB to disk
function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Auto-save every 60 seconds
setInterval(saveDb, 60000);

// Initialize DB - loads from disk if exists, creates fresh if not
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      organization TEXT,
      location TEXT,
      education TEXT,
      deadline TEXT,
      salary TEXT,
      url TEXT,
      category TEXT,
      source TEXT,
      sent INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cmd_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT,
      number TEXT,
      command TEXT,
      chat_type TEXT,
      chat_jid TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stats (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      source TEXT,
      message TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    );
  `);

  saveDb();
  return db;
}

// ─── Helper to run a query and return rows ───────────────────────────────────
function query(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

// ─── Job Functions ───────────────────────────────────────────────────────────
function insertJob(job) {
  try {
    db.run(`
      INSERT OR IGNORE INTO jobs (id,title,organization,location,education,deadline,salary,url,category,source)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `, [job.id, job.title, job.organization, job.location, job.education, job.deadline, job.salary, job.url, job.category, job.source]);
    saveDb();
    return 1;
  } catch (_) { return 0; }
}

function insertManyJobs(jobs) {
  let inserted = 0;
  for (const job of jobs) {
    try {
      db.run(`
        INSERT OR IGNORE INTO jobs (id,title,organization,location,education,deadline,salary,url,category,source)
        VALUES (?,?,?,?,?,?,?,?,?,?)
      `, [job.id, job.title, job.organization, job.location, job.education, job.deadline, job.salary, job.url, job.category, job.source]);
      inserted++;
    } catch (_) {}
  }
  saveDb();
  return inserted;
}

function getNextUnsentJob() {
  const rows = query(`SELECT * FROM jobs WHERE sent=0 ORDER BY created_at ASC LIMIT 1`);
  return rows[0] || null;
}

function markJobSent(id) {
  run(`UPDATE jobs SET sent=1 WHERE id=?`, [id]);
}

function getJobsByCategory(category) {
  return query(`SELECT * FROM jobs WHERE category=? ORDER BY created_at DESC LIMIT 20`, [category]);
}

function getJobsBySource(source) {
  return query(`SELECT * FROM jobs WHERE source=? ORDER BY created_at DESC LIMIT 20`, [source]);
}

function getJobsByEducation(edu) {
  return query(`SELECT * FROM jobs WHERE education LIKE ? ORDER BY created_at DESC LIMIT 20`, [`%${edu}%`]);
}

function getAllRecentJobs() {
  return query(`SELECT * FROM jobs ORDER BY created_at DESC LIMIT 30`);
}

function cleanOldJobs(maxCount) {
  const rows = query(`SELECT COUNT(*) as c FROM jobs`);
  const count = rows[0]?.c || 0;
  if (count > maxCount) {
    run(`DELETE FROM jobs WHERE id IN (SELECT id FROM jobs WHERE sent=1 ORDER BY created_at ASC LIMIT ?)`, [count - maxCount]);
  }
}

// ─── Stats Functions ─────────────────────────────────────────────────────────
function getStat(key) {
  const rows = query(`SELECT value FROM stats WHERE key=?`, [key]);
  return rows[0]?.value || null;
}

function setStat(key, value) {
  db.run(`INSERT OR REPLACE INTO stats (key,value,updated_at) VALUES (?,?,datetime('now'))`, [key, String(value)]);
  saveDb();
}

function incrementStat(key) {
  const current = parseInt(getStat(key) || '0');
  setStat(key, current + 1);
  return current + 1;
}

function getDashboardStats() {
  const totalJobs = query(`SELECT COUNT(*) as c FROM jobs`)[0]?.c || 0;
  const sentJobs = query(`SELECT COUNT(*) as c FROM jobs WHERE sent=1`)[0]?.c || 0;
  const unsentJobs = query(`SELECT COUNT(*) as c FROM jobs WHERE sent=0`)[0]?.c || 0;
  const todayJobs = query(`SELECT COUNT(*) as c FROM jobs WHERE DATE(created_at)=DATE('now')`)[0]?.c || 0;
  const totalCmds = query(`SELECT COUNT(*) as c FROM cmd_logs`)[0]?.c || 0;
  const todayErrors = query(`SELECT COUNT(*) as c FROM errors WHERE DATE(timestamp)=DATE('now')`)[0]?.c || 0;
  const sourceStats = query(`SELECT source, COUNT(*) as count FROM jobs GROUP BY source ORDER BY count DESC`);
  const recentCmds = query(`SELECT * FROM cmd_logs ORDER BY timestamp DESC LIMIT 50`);

  return {
    totalJobs, sentJobs, unsentJobs, todayJobs,
    totalCmds, todayErrors, sourceStats, recentCmds,
    lastScrape: getStat('last_scrape'),
    startTime: getStat('start_time')
  };
}

// ─── Log Functions ────────────────────────────────────────────────────────────
function logCommand(jid, number, command, chatType, chatJid) {
  db.run(`INSERT INTO cmd_logs (jid,number,command,chat_type,chat_jid) VALUES (?,?,?,?,?)`,
    [jid, number, command, chatType, chatJid]);
  saveDb();
}

function logError(type, source, message) {
  db.run(`INSERT INTO errors (type,source,message) VALUES (?,?,?)`, [type, source, message]);
  saveDb();
}

module.exports = {
  initDb,
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
