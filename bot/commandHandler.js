const { jobsCmd } = require('./commands/jobs');
const config = require('../config/config');
const logger = require('../config/logger');
const { logCommand } = require('../database/db');

const prefix = config.bot.prefix || '!';

async function handleCommand(sock, msg) {
  if (!msg.message) return;

  let text = '';
  if (msg.message.conversation) text = msg.message.conversation;
  else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;

  if (!text.startsWith(prefix)) return;

  const [cmd, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  const command = cmd.toLowerCase();

  const chatJid = msg.key.remoteJid;
  const user = msg.key.participant || msg.key.remoteJid;

  logger.info(`Command: ${prefix}${command} from ${user}`);

  try {
    logCommand(command, user);

    if (command === 'ping') {
      await sock.sendMessage(chatJid, { text: '🏓 Pong! Bot alive.' }, { quoted: msg });
    } 
    else if (command === 'help' || command === 'menu') {
      await sock.sendMessage(chatJid, { 
        text: `📋 *Commands:*\n\n${prefix}ping\n${prefix}all\n${prefix}govt\n${prefix}defence\n${prefix}private\n${prefix}help` 
      }, { quoted: msg });
    } 
    else if (command === 'all') {
      await jobsCmd(sock, msg, 'all');
    } 
    else if (['govt', 'defence', 'private'].includes(command)) {
      await jobsCmd(sock, msg, command);
    } 
    else {
      await sock.sendMessage(chatJid, { text: `❌ Unknown cmd. Try ${prefix}help` }, { quoted: msg });
    }
  } catch (err) {
    logger.error(err, 'Command error');
    await sock.sendMessage(chatJid, { text: '⚠️ Error processing command' }, { quoted: msg });
  }
}

module.exports = { handleCommand };
