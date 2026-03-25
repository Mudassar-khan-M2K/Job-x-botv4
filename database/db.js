const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'jobs.db');
let db = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT,
      organization TEXT,
      location TEXT,
      education TEXT,
      deadline TEXT,
      salary TEXT,
      url TEXT,
      category TEXT,
      source TEXT,
      posted_at INTEGER,
      sent INTEGER DEFAULT 0
    )
  `);

  db.run(`CREATE TABLE IF NOT EXISTS stats (key TEXT PRIMARY KEY, value INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS command_logs (id INTEGER PRIMARY KEY, command TEXT, user TEXT, timestamp INTEGER)`);
  db.run(`CREATE TABLE IF NOT EXISTS error_logs (id INTEGER PRIMARY KEY, type TEXT, source TEXT, error TEXT, timestamp INTEGER)`);

  saveDb();
  setInterval(saveDb, 60000);

  return db;
}

function query(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  const result = stmt.all ? stmt.all(...params) : stmt.get(...params) || [];  // fixed for sql.js
  stmt.free();
  return Array.isArray(result) ? result : [result].filter(Boolean);
}

function run(sql, params = []) {
  if (!db) throw new Error('DB not initialized');
  const stmt = db.prepare(sql);
  stmt.run(...params);
  stmt.free();
  saveDb();
}

function insertJob(job) {
  const id = `${job.source}-${Date.now()}`;
  run(`
    INSERT OR IGNORE INTO jobs 
    (id, title, organization, location, education, deadline, salary, url, category, source, posted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, job.title, job.organization, job.location, job.education, job.deadline, job.salary, job.url, job.category, job.source, Date.now()]);
}

function insertManyJobs(jobs) {
  jobs.forEach(insertJob);
}

function getNextUnsentJob() {
  const rows = query('SELECT * FROM jobs WHERE sent = 0 ORDER BY posted_at ASC LIMIT 1');
  return rows[0] || null;
}

function markJobSent(id) {
  run('UPDATE jobs SET sent = 1 WHERE id = ?', [id]);
}

function getJobsByCategory(cat) {
  return query('SELECT * FROM jobs WHERE category = ? ORDER BY posted_at DESC', [cat]);
}

function getJobsBySource(src) {
  return query('SELECT * FROM jobs WHERE source = ? ORDER BY posted_at DESC', [src]);
}

function getJobsByEducation(edu) {
  return query('SELECT * FROM jobs WHERE education LIKE ? ORDER BY posted_at DESC', [`%${edu}%`]);
}

function getAllRecentJobs() {
  return query('SELECT * FROM jobs ORDER BY posted_at DESC LIMIT 50');
}
function cleanOldJobs() {
  run('DELETE FROM jobs WHERE posted_at < ?', [Date.now() - 7 * 24 * 60 * 60 * 1000]);
}

function getStat(key) {
  const rows = query('SELECT value FROM stats WHERE key = ?', [key]);
  return rows[0] ? rows[0].value : 0;
}

function setStat(key, value) {
  run('INSERT OR REPLACE INTO stats (key, value) VALUES (?, ?)', [key, value]);
}

function incrementStat(key) {
  const current = getStat(key);
  setStat(key, current + 1);
}

function getDashboardStats() {
  return {
    totalJobs: query('SELECT COUNT(*) as c FROM jobs')[0]?.c || 0,
    unsentJobs: query('SELECT COUNT(*) as c FROM jobs WHERE sent = 0')[0]?.c || 0,
    sentToday: getStat('total_sent'),
    lastScrape: new Date().toISOString()
  };
}

function logCommand(cmd, user) {
  run('INSERT INTO command_logs (command, user, timestamp) VALUES (?, ?, ?)', [cmd, user, Date.now()]);
}

function logError(type, source, error) {
  run('INSERT INTO error_logs (type, source, error, timestamp) VALUES (?, ?, ?, ?)', 
      [type, source, error.message || String(error), Date.now()]);
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
