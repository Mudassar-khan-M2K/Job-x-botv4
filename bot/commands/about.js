const config = require('../../config/config');

async function aboutCmd(sock, msg) {
  const chatJid = msg.key.remoteJid;

  const text = `ℹ️ *About ${config.bot.name}*\n\n` +
    `👨‍💻 *Developer:* ${config.bot.developer}\n` +
    `📲 *Contact:* +92 347 7262704\n` +
    `📦 *Version:* ${config.bot.version}\n` +
    `🇵🇰 *Made for:* Pakistan Job Seekers\n\n` +
    `📡 *30 Job Sources:*\n\n` +
    `🏛️ *Government (12):*\n` +
    `NJP • FPSC • PPSC • SPSC • NADRA\nPAEC • HEC • FBR • WAPDA • PIA\nRailways • Punjab Govt\n\n` +
    `⚔️ *Defence (5):*\n` +
    `Army • Navy • PAF • ANF • Rangers\n\n` +
    `🏢 *Private (13):*\n` +
    `Rozee • Mustakbil • Bayt • Engro\nPSO • HBL • MCB • Unilever • Nestle\nPTCL • SNGPL • Telenor • Jazz\n\n` +
    `━━━━━━━━━━━━━━━\n` +
    `🤖 Auto-posts jobs every 20 minutes\n` +
    `🇵🇰 Made with ❤️ for Pakistan`;

  await sock.sendMessage(chatJid, { text }, { quoted: msg });
}

module.exports = aboutCmd;
