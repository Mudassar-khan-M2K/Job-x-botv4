const cron = require('node-cron');
const config = require('../config/config');
const logger = require('../config/logger');
const { runAllScrapers } = require('../scrapers/scrapeManager');
const { getNextUnsentJob, markJobSent, incrementStat } = require('../database/db');
const { isConnected } = require('../config/state');
const { handleError } = require('./alerts');
const { formatJob } = require('./commands/jobs');   // ← now works

let senderRunning = false;
let lastSendTime = 0;

function startScraperCycle() {
  const interval = config.scheduler.scrapeInterval;
  logger.info(`Scraper cycle started — every ${interval} minutes`);

  setTimeout(() => runAllScrapers().catch(err => logger.error({ err }, 'Scraper cycle error')), 5000);

  cron.schedule(`*/${interval} * * * *`, async () => {
    try { await runAllScrapers(); } 
    catch (err) { logger.error({ err }, 'Scraper cycle error'); }
  });
}

function startSenderCycle(getSock) {
  logger.info('Sender cycle started — every 8 minutes');
  setTimeout(() => sendNextJob(getSock), 3 * 60 * 1000);
  cron.schedule('*/8 * * * *', () => sendNextJob(getSock));
}

async function sendNextJob(getSock) {
  if (senderRunning) return;
  if (!isConnected()) {
    logger.warn('Skipping send — WhatsApp disconnected');
    return;
  }

  const sock = getSock();
  if (!sock) return;

  const minGap = config.scheduler.minDelay * 60 * 1000;
  const timeSinceLast = Date.now() - lastSendTime;
  if (lastSendTime > 0 && timeSinceLast < minGap) return;

  senderRunning = true;
  try {
    const job = getNextUnsentJob();
    if (!job) {
      logger.info('No unsent jobs in queue...');
      return;
    }

    const channelJid = config.channel.jid;
    const message = formatJob(job);

    await sock.sendMessage(channelJid, { text: message });

    markJobSent(job.id);
    lastSendTime = Date.now();
    incrementStat('total_sent');

    logger.info(`✅ Sent job: ${job.title} (${job.source})`);

  } catch (err) {
    logger.error({ err }, 'Failed to send job');
    try { await handleError(sock, 'channel_send_fail', 'scheduler', err); } catch (_) {}
  } finally {
    senderRunning = false;
  }
}

module.exports = { startScraperCycle, startSenderCycle };
