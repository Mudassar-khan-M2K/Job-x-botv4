require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { getDashboardStats } = require('../database/db');
const { isConnected } = require('../config/state');
const config = require('../config/config');
const logger = require('../config/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send(getDashboardHTML());
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = getDashboardStats();
    res.json({
      ...stats,
      connected: isConnected(),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.floor(process.uptime())
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Push stats to all clients every 10 seconds
setInterval(() => {
  try {
    const stats = getDashboardStats();
    io.emit('stats', {
      ...stats,
      connected: isConnected(),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.floor(process.uptime())
    });
  } catch (_) {}
}, 10000);

const PORT = config.dashboard.port;
server.listen(PORT, () => logger.info(`📊 Dashboard running on port ${PORT}`));

function getDashboardHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>🇵🇰 Pakistan Jobs Bot Dashboard</title>
<script src="/socket.io/socket.io.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; background: #0a0e2e; color: #e0e8ff; min-height: 100vh; }
  .header { background: linear-gradient(135deg, #1a237e, #0d47a1, #1565c0); padding: 20px 30px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px rgba(0,100,255,0.3); }
  .header h1 { font-size: 1.6rem; color: #fff; }
  .header .status { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: #4caf50; box-shadow: 0 0 8px #4caf50; animation: pulse 2s infinite; }
  .dot.offline { background: #f44336; box-shadow: 0 0 8px #f44336; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; padding: 24px; }
  .card { background: linear-gradient(145deg, #0d1b4b, #112266); border: 1px solid #1e3a8a; border-radius: 12px; padding: 20px; text-align: center; transition: transform .2s; }
  .card:hover { transform: translateY(-3px); }
  .card .num { font-size: 2.4rem; font-weight: 700; color: #42a5f5; }
  .card .label { font-size: 0.8rem; color: #90caf9; margin-top: 6px; text-transform: uppercase; letter-spacing: 1px; }
  .card .icon { font-size: 1.8rem; margin-bottom: 8px; }
  .section { margin: 0 24px 24px; }
  .section h2 { color: #42a5f5; margin-bottom: 12px; font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #1e3a8a; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; background: #0d1b4b; border-radius: 10px; overflow: hidden; font-size: 0.85rem; }
  th { background: #1a237e; padding: 10px 14px; text-align: left; color: #90caf9; font-weight: 600; }
  td { padding: 9px 14px; border-bottom: 1px solid #1e3a8a; color: #ccd9ff; }
  tr:last-child td { border: none; }
  tr:hover td { background: #112266; }
  .badge { padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; font-weight: 600; }
  .badge.govt { background: #1b5e20; color: #a5d6a7; }
  .badge.defence { background: #b71c1c; color: #ef9a9a; }
  .badge.private { background: #0d47a1; color: #90caf9; }
  .badge.group { background: #4a148c; color: #ce93d8; }
  .badge.private-chat { background: #006064; color: #80deea; }
  .badge.channel { background: #e65100; color: #ffcc80; }
  .source-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .source-item { background: #0d1b4b; border: 1px solid #1e3a8a; border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; font-size: 0.82rem; }
  .source-item span:last-child { color: #42a5f5; font-weight: 700; }
  .footer { text-align: center; padding: 20px; color: #3a5a9a; font-size: 0.8rem; border-top: 1px solid #1e3a8a; }
  .uptime { color: #42a5f5; }
  .mem { color: #ffb74d; }
</style>
</head>
<body>
<div class="header">
  <h1>🇵🇰 Pakistan Jobs Bot Dashboard</h1>
  <div class="status">
    <div class="dot" id="statusDot"></div>
    <span id="statusText">Connecting...</span>
    &nbsp;|&nbsp;
    <span>Uptime: <span class="uptime" id="uptime">-</span></span>
    &nbsp;|&nbsp;
    <span>RAM: <span class="mem" id="mem">-</span> MB</span>
  </div>
</div>

<div class="grid">
  <div class="card"><div class="icon">📦</div><div class="num" id="totalJobs">-</div><div class="label">Total Jobs Fetched</div></div>
  <div class="card"><div class="icon">✅</div><div class="num" id="sentJobs">-</div><div class="label">Sent to Channel</div></div>
  <div class="card"><div class="icon">🔄</div><div class="num" id="unsentJobs">-</div><div class="label">In Queue</div></div>
  <div class="card"><div class="icon">📅</div><div class="num" id="todayJobs">-</div><div class="label">Today's Jobs</div></div>
  <div class="card"><div class="icon">⌨️</div><div class="num" id="totalCmds">-</div><div class="label">Commands Used</div></div>
  <div class="card"><div class="icon">❌</div><div class="num" id="todayErrors">-</div><div class="label">Errors Today</div></div>
</div>

<div class="section">
  <h2>📡 Jobs by Source</h2>
  <div class="source-grid" id="sourceGrid">Loading...</div>
</div>

<div class="section">
  <h2>📋 Recent Commands Log</h2>
  <table>
    <thead><tr><th>#</th><th>Number</th><th>Command</th><th>Chat Type</th><th>Time</th></tr></thead>
    <tbody id="cmdLog"><tr><td colspan="5" style="text-align:center;color:#3a5a9a">Loading...</td></tr></tbody>
  </table>
</div>

<div class="footer">
  🤖 Pakistan Jobs Bot v${config.bot.version} &nbsp;|&nbsp; 👨‍💻 ${config.bot.developer} &nbsp;|&nbsp;
  Last updated: <span id="lastUpdate">-</span> &nbsp;|&nbsp;
  Last scrape: <span id="lastScrape">-</span>
</div>

<script>
const socket = io();

function formatUptime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h+'h '+m+'m '+sec+'s';
}

function formatTime(ts) {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', hour12: true });
}

function updateUI(data) {
  document.getElementById('totalJobs').textContent = data.totalJobs ?? '-';
  document.getElementById('sentJobs').textContent = data.sentJobs ?? '-';
  document.getElementById('unsentJobs').textContent = data.unsentJobs ?? '-';
  document.getElementById('todayJobs').textContent = data.todayJobs ?? '-';
  document.getElementById('totalCmds').textContent = data.totalCmds ?? '-';
  document.getElementById('todayErrors').textContent = data.todayErrors ?? '-';
  document.getElementById('uptime').textContent = formatUptime(data.uptime || 0);
  document.getElementById('mem').textContent = data.memory ?? '-';
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('en-PK');
  document.getElementById('lastScrape').textContent = formatTime(data.lastScrape);

  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (data.connected) { dot.className='dot'; txt.textContent='WhatsApp Connected 🟢'; }
  else { dot.className='dot offline'; txt.textContent='WhatsApp Disconnected 🔴'; }

  // Source grid
  if (data.sourceStats?.length) {
    document.getElementById('sourceGrid').innerHTML = data.sourceStats.map(s =>
      '<div class="source-item"><span>'+s.source+'</span><span>'+s.count+'</span></div>'
    ).join('');
  }

  // Command log
  if (data.recentCmds?.length) {
    document.getElementById('cmdLog').innerHTML = data.recentCmds.slice(0,30).map((c, i) =>
      '<tr><td>'+(i+1)+'</td><td>+'+c.number+'</td><td><b>!'+c.command+'</b></td>' +
      '<td><span class="badge '+c.chat_type+'">'+c.chat_type+'</span></td>' +
      '<td>'+formatTime(c.timestamp)+'</td></tr>'
    ).join('');
  }
}

socket.on('stats', updateUI);

// Initial load
fetch('/api/stats').then(r => r.json()).then(updateUI).catch(console.error);
</script>
</body>
</html>`;
}

module.exports = app;
