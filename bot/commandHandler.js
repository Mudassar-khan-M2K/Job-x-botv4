const config = require('../config/config');
const logger = require('../config/logger');
const { logCommand } = require('../database/db');

// Import all command handlers
const pingCmd = require('./commands/ping');
const helpCmd = require('./commands/help');
const jobsCmd = require('./commands/jobs');
const statsCmd = require('./commands/stats');
const aboutCmd = require('./commands/about');

// Map commands to handlers
const commandMap = {
  'ping': pingCmd,
  'alive': pingCmd,
  'help': helpCmd,
  'menu': helpCmd,
  'stats': statsCmd,
  'about': aboutCmd,
  'sources': aboutCmd,

  // Job commands - all handled by jobs.js with type param
  'all': (sock, msg) => jobsCmd(sock, msg, 'all'),
  'govt': (sock, msg) => jobsCmd(sock, msg, 'govt'),
  'defense': (sock, msg) => jobsCmd(sock, msg, 'defence'),
  'defence': (sock, msg) => jobsCmd(sock, msg, 'defence'),
  'private': (sock, msg) => jobsCmd(sock, msg, 'private'),
  'army': (sock, msg) => jobsCmd(sock, msg, 'source', 'Army'),
  'navy': (sock, msg) => jobsCmd(sock, msg, 'source', 'Navy'),
  'paf': (sock, msg) => jobsCmd(sock, msg, 'source', 'PAF'),
  'anf': (sock, msg) => jobsCmd(sock, msg, 'source', 'ANF'),
  'rangers': (sock, msg) => jobsCmd(sock, msg, 'source', 'Rangers'),
  'njp': (sock, msg) => jobsCmd(sock, msg, 'source', 'NJP'),
  'fpsc': (sock, msg) => jobsCmd(sock, msg, 'source', 'FPSC'),
  'ppsc': (sock, msg) => jobsCmd(sock, msg, 'source', 'PPSC'),
  'spsc': (sock, msg) => jobsCmd(sock, msg, 'source', 'SPSC'),
  'nadra': (sock, msg) => jobsCmd(sock, msg, 'source', 'NADRA'),
  'paec': (sock, msg) => jobsCmd(sock, msg, 'source', 'PAEC'),
  'hec': (sock, msg) => jobsCmd(sock, msg, 'source', 'HEC'),
  'fbr': (sock, msg) => jobsCmd(sock, msg, 'source', 'FBR'),
  'wapda': (sock, msg) => jobsCmd(sock, msg, 'source', 'WAPDA'),
  'pia': (sock, msg) => jobsCmd(sock, msg, 'source', 'PIA'),
  'railways': (sock, msg) => jobsCmd(sock, msg, 'source', 'Railways'),
  'rozee': (sock, msg) => jobsCmd(sock, msg, 'source', 'Rozee'),
  'mustakbil': (sock, msg) => jobsCmd(sock, msg, 'source', 'Mustakbil'),
  'hbl': (sock, msg) => jobsCmd(sock, msg, 'source', 'HBL'),
  'mcb': (sock, msg) => jobsCmd(sock, msg, 'source', 'MCB'),
  'matric': (sock, msg) => jobsCmd(sock, msg, 'education', 'Matric'),
  'inter': (sock, msg) => jobsCmd(sock, msg, 'education', 'Intermediate'),
  'bs': (sock, msg) => jobsCmd(sock, msg, 'education', 'BS'),
  'ms': (sock, msg) => jobsCmd(sock, msg, 'education', 'MS')
};

async function handleMessage(sock, msg) {
  try {
    const body = msg.message?.conversation
      || msg.message?.extendedTextMessage?.text
      || msg.message?.imageMessage?.caption
      || '';

    if (!body || !body.startsWith(config.bot.prefix)) return;

    const command = body.slice(config.bot.prefix.length).trim().split(' ')[0].toLowerCase();

    // ONLY respond to whitelisted commands
    if (!commandMap[command]) return;

    // Determine chat type
    const chatJid = msg.key.remoteJid;
    let chatType = 'private';
    if (chatJid.endsWith('@g.us')) chatType = 'group';
    else if (chatJid.endsWith('@newsletter')) chatType = 'channel';

    // Sender JID
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.replace('@s.whatsapp.net', '').replace('@g.us', '');

    logger.info(`📩 CMD: ${config.bot.prefix}${command} | From: ${senderNumber} | Type: ${chatType}`);

    // Log to DB
    logCommand(senderJid, senderNumber, command, chatType, chatJid);

    // Execute command
    await commandMap[command](sock, msg);

  } catch (err) {
    logger.error({ err }, '❌ Error in message handler');
  }
}

module.exports = { handleMessage };
