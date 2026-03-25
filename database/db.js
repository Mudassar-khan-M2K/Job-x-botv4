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

// Initialize DB
async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`...`); // (your full CREATE TABLE block stays same, I didn't paste it again to keep short)

  saveDb();

  // ← NOW start auto-save (after db is ready)
  setInterval(saveDb, 60000);

  return db;
}

// ... rest of your functions (query, run, insertJob, getNextUnsentJob, getDashboardStats etc.) stay EXACTLY same

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
