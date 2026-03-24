const config = require('../../config/config');

async function helpCmd(sock, msg) {
  const p = config.bot.prefix;
  const chatJid = msg.key.remoteJid;

  const text = `╔══════════════════════╗
║  🇵🇰 *PAKISTAN JOBS BOT* 🇵🇰  ║
╚══════════════════════╝

*⚙️ GENERAL*
${p}ping — Bot status & speed
${p}stats — Job statistics
${p}about — About & sources
${p}menu — This menu

*🏛️ GOVERNMENT JOBS*
${p}govt — All government jobs
${p}njp — NJP Portal jobs
${p}fpsc — FPSC jobs
${p}ppsc — PPSC jobs
${p}spsc — SPSC jobs
${p}nadra — NADRA jobs
${p}paec — Atomic Energy jobs
${p}hec — HEC jobs
${p}fbr — FBR jobs
${p}wapda — WAPDA jobs
${p}pia — PIA jobs
${p}railways — Railways jobs

*⚔️ DEFENCE JOBS*
${p}defence — All defence jobs
${p}army — Pakistan Army
${p}navy — Pakistan Navy
${p}paf — Pakistan Air Force
${p}anf — Anti Narcotics Force
${p}rangers — Pakistan Rangers

*🏢 PRIVATE JOBS*
${p}private — All private jobs
${p}rozee — Rozee.pk jobs
${p}mustakbil — Mustakbil jobs
${p}hbl — HBL Bank jobs
${p}mcb — MCB Bank jobs

*🎓 BY EDUCATION*
${p}matric — Matric pass jobs
${p}inter — Intermediate jobs
${p}bs — BS/BA degree jobs
${p}ms — MS/MBA degree jobs

*📢 AUTO CHANNEL*
Jobs auto-post every 20 min
━━━━━━━━━━━━━━━
🤖 *${config.bot.name} v${config.bot.version}*
👨‍💻 By ${config.bot.developer}`;

  await sock.sendMessage(chatJid, { text }, { quoted: msg });
}

module.exports = helpCmd;
