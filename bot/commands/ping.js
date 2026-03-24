const config = require('../../config/config');

async function pingCmd(sock, msg) {
  const start = Date.now();
  const chatJid = msg.key.remoteJid;

  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = Math.floor(uptime % 60);

  const ping = Date.now() - start;

  const text = `🤖 *${config.bot.name}*\n\n` +
    `✅ *Status:* Online & Active\n` +
    `⚡ *Speed:* ${ping}ms\n` +
    `⏱️ *Uptime:* ${hours}h ${mins}m ${secs}s\n` +
    `📦 *Version:* ${config.bot.version}\n` +
    `👨‍💻 *Dev:* ${config.bot.developer}\n\n` +
    `🇵🇰 Pakistan Jobs Bot is running!`;

  await sock.sendMessage(chatJid, { text }, { quoted: msg });
}

module.exports = pingCmd;
