require('dotenv').config();
const logger = require('../config/logger');
const { connectToWhatsApp, getSocket, getIsConnected } = require('./connection');
const { handleMessage } = require('./commandHandler');
const { startScraperCycle, startSenderCycle } = require('./scheduler');
const { setupCrashHandler, sendAlertToOwners } = require('./alerts');
const { initDb, setStat } = require('../database/db');

logger.info('🇵🇰 Pakistan Jobs Bot v4.0 Starting...');

// Setup global crash handler FIRST
setupCrashHandler(getSocket);

// Main start function
async function start() {
  try {
    // Init database first
    await initDb();
    logger.info('✅ Database ready');

    // Connect to WhatsApp
    await connectToWhatsApp(handleMessage);

    // Start scraper cycle (every 20 min)
    startScraperCycle();

    // Start sender cycle (every 8 min)
    startSenderCycle(getSocket);

    logger.info('✅ All systems started successfully');

  } catch (err) {
    logger.fatal({ err }, '💥 Failed to start bot');
    process.exit(1);
  }
}

start();
