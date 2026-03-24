const { getDashboardStats } = require('../../database/db');
const config = require('../../config/config');

async function statsCmd(sock, msg) {
  const chatJid = msg.key.remoteJid;
  const s = getDashboardStats();

  const text = `📊 *${config.bot.name} — Stats*\n\n` +
    `📦 *Total Jobs Fetched:* ${s.totalJobs}\n` +
    `✅ *Jobs Sent to Channel:* ${s.sentJobs}\n` +
    `🔄 *Jobs in Queue:* ${s.unsentJobs}\n` +
    `📅 *Today's Jobs:* ${s.todayJobs}\n` +
    `⌨️ *Total Commands Used:* ${s.totalCmds}\n` +
    `❌ *Errors Today:* ${s.todayErrors}\n` +
    `🕐 *Last Scrape:* ${s.lastScrape ? new Date(s.lastScrape).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }) : 'Never'}\n\n` +
    `📈 *Jobs by Source:*\n` +
    s.sourceStats.slice(0, 10).map(r => `  • ${r.source}: ${r.count}`).join('\n') +
    `\n━━━━━━━━━━━━━━━\n🤖 ${config.bot.name} v${config.bot.version}`;

  await sock.sendMessage(chatJid, { text }, { quoted: msg });
}

module.exports = statsCmd;
