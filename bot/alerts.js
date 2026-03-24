const config = require('../config/config');
const logger = require('../config/logger');
const { logError } = require('../database/db');

// Send alert to all owner JIDs
async function sendAlertToOwners(sock, message) {
  if (!sock) {
    logger.warn('Cannot send alert - no socket connection');
    return;
  }

  for (const jid of config.owners) {
    try {
      await sock.sendMessage(jid, { text: message });
      logger.info(`📨 Alert sent to ${jid}`);
    } catch (err) {
      logger.error({ err }, `Failed to send alert to ${jid}`);
    }
  }
}

// Classify and handle errors
async function handleError(sock, type, source, error) {
  const errorMsg = error?.message || String(error);
  logger.error({ type, source, error: errorMsg });

  // Log to DB
  try { logError(type, source, errorMsg); } catch (_) {}

  // Decide which errors get alerts
  const alertTypes = ['whatsapp_disconnect', 'crash', 'db_error', 'session_invalid'];

  if (alertTypes.includes(type)) {
    const alert = `🚨 *BOT ALERT*\n\n` +
      `*Type:* ${type.replace(/_/g, ' ').toUpperCase()}\n` +
      `*Source:* ${source}\n` +
      `*Error:* ${errorMsg.substring(0, 200)}\n` +
      `*Time:* ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })} PKT`;

    await sendAlertToOwners(sock, alert);
  }
}

// Global crash handler
function setupCrashHandler(getSock) {
  process.on('uncaughtException', async (err) => {
    logger.fatal({ err }, '💥 Uncaught Exception');
    try {
      const sock = getSock();
      await handleError(sock, 'crash', 'process', err);
    } catch (_) {}
    setTimeout(() => process.exit(1), 3000);
  });

  process.on('unhandledRejection', async (reason) => {
    logger.error({ reason }, '⚠️ Unhandled Promise Rejection');
    try {
      const sock = getSock();
      await handleError(sock, 'crash', 'promise', new Error(String(reason)));
    } catch (_) {}
  });
}

module.exports = { sendAlertToOwners, handleError, setupCrashHandler };
