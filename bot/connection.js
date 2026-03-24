const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys');

const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const config = require('../config/config');
const logger = require('../config/logger');
const state = require('../config/state');
const { sendAlertToOwners } = require('./alerts');
const { setStat } = require('../database/db');

// Folder to store session auth files
const SESSION_FOLDER = path.join(__dirname, '../bot_session');

let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

// Decode and write session from SESSION_ID env var (Baileys multi-file format)
function loadSessionFromEnv() {
  const sessionId = config.session.id;
  if (!sessionId || sessionId === '') {
    logger.warn('⚠️  No SESSION_ID set. Please get one from the companion site.');
    return false;
  }

  try {
    if (!fs.existsSync(SESSION_FOLDER)) fs.mkdirSync(SESSION_FOLDER, { recursive: true });

    // Session format: "Gifted~base64data"
    const sessionData = sessionId.includes('~')
      ? sessionId.split('~')[1]
      : sessionId;

    const decoded = Buffer.from(sessionData, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    // Write creds.json
    fs.writeFileSync(
      path.join(SESSION_FOLDER, 'creds.json'),
      JSON.stringify(parsed, null, 2)
    );
    logger.info('✅ Session loaded from SESSION_ID');
    return true;
  } catch (err) {
    logger.error({ err }, '❌ Failed to decode SESSION_ID');
    return false;
  }
}

async function connectToWhatsApp(onMessage) {
  // Try to load session from env var
  if (!fs.existsSync(path.join(SESSION_FOLDER, 'creds.json'))) {
    const loaded = loadSessionFromEnv();
    if (!loaded) {
      await sendAlertToOwners(null, '❌ SESSION_ID missing or invalid. Bot cannot start. Get session from companion site.');
      process.exit(1);
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  logger.info(`📱 Connecting with Baileys v${version.join('.')}`);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    printQRInTerminal: false,  // No QR on server
    browser: Browsers.ubuntu('Chrome'),
    logger: pino({ level: 'silent' }),
    syncFullHistory: false,
    getMessage: async () => ({ conversation: '' })
  });

  // Save credentials whenever updated
  sock.ev.on('creds.update', saveCreds);

  // Connection state handler
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      state.setConnected(true);
      reconnectAttempts = 0;
      logger.info('✅ WhatsApp Connected Successfully!');
      setStat('start_time', new Date().toISOString());
      await sendAlertToOwners(sock, `✅ *Pakistan Jobs Bot Online!*\n\n🤖 Bot: ${config.bot.name}\n⚙️ Version: ${config.bot.version}\n⏰ Time: ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);
    }

    if (connection === 'close') {
      state.setConnected(false);
      const statusCode = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output?.statusCode
        : 500;

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(`⚠️ Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
        reconnectAttempts++;
        // Exponential backoff: 5s, 10s, 20s, 40s ... max 5 min
        const delay = Math.min(5000 * Math.pow(2, reconnectAttempts - 1), 300000);
        logger.info(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${MAX_RECONNECT})`);

        setTimeout(() => connectToWhatsApp(onMessage), delay);
      } else if (statusCode === DisconnectReason.loggedOut) {
        logger.error('❌ Session logged out. Delete session folder and get new session.');
        await sendAlertToOwners(null, '❌ *Bot Logged Out!*\nSession expired. Please get new session from companion site and update SESSION_ID on Heroku.');
        process.exit(1);
      } else {
        logger.error('❌ Max reconnect attempts reached. Alerting owners...');
        await sendAlertToOwners(null, `🚨 *Bot Disconnected!*\nMax reconnect attempts (${MAX_RECONNECT}) reached.\nPlease restart the Heroku dyno.`);
      }
    }

    if (connection === 'connecting') {
      logger.info('🔄 Connecting to WhatsApp...');
    }
  });

  // Messages handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue; // Ignore own messages
      await onMessage(sock, msg);
    }
  });

  return sock;
}

function getSocket() { return sock; }
function getIsConnected() { return state.isConnected(); }

module.exports = { connectToWhatsApp, getSocket, getIsConnected };
