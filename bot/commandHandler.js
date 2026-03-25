const { jobsCmd } = require('./commands/jobs');
const config = require('../config/config');
const logger = require('../config/logger');
const { logCommand } = require('../database/db');

const prefix = config.bot.prefix || '!';

async function handleCommand(sock, msg) {
  if (!msg.message?.conversation && !msg.message?.extendedTextMessage?.text) return;

  const text = msg.message.conversation || msg.message.extendedTextMessage.text;
  if (!text.startsWith(prefix)) return;

  const [cmd, ...args] = text.slice(prefix.length).trim().split(/\s+/);
  const command = cmd.toLowerCase();

  const chatJid = msg.key.remoteJid;
  const user = msg.key.participant || msg.key.remoteJid;

  logger.info(`Command received: ${prefix}${command} from ${user}`);

  try {
    logCommand(command, user);

    if (command === 'ping') {
      await sock.sendMessage(chatJid, { text: '🏓 Pong! Bot is alive.' }, { quoted: msg });
    }
    else if (command === 'help') {
      await sock.sendMessage(chatJid, { 
        text: `📋 *Available Commands:*\n\n` +
              `${prefix}ping\n` +
              `${prefix}all\n` +
              `${prefix}govt\n` +
              `${prefix}defence\n` +
              `${prefix}private\n` +
              `${prefix}stats\n` +
              `${prefix}about`
      }, { quoted: msg });
    }
    else if (command === 'all') {
      await jobsCmd(sock, msg, 'all');
    }
    else if (command === 'govt' || command === 'defence' || command === 'private') {
      await jobsCmd(sock, msg, command);
    }
    else if (command === 'stats') {
      // You can add stats command later if needed
      await sock.sendMessage(chatJid, { text: '📊 Stats command coming soon...' }, { quoted: msg });
    }
    else if (command === 'about') {
      await sock.sendMessage(chatJid, { text: '🤖 Job-X Bot v4\nMade by Mudassar Khan\nAuto posts Pakistan jobs daily!' }, { quoted: msg });
    }
    else {
      await sock.sendMessage(chatJid, { text: `❌ Unknown command: ${prefix}${command}\nType ${prefix}help` }, { quoted: msg });
    }

  } catch (err) {
    logger.error({ err }, 'Command handler error');
    await sock.sendMessage(chatJid, { text: '⚠️ Something went wrong while processing command.' }, { quoted: msg });
  }
}

module.exports = { handleCommand };
