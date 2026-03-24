require('dotenv').config();

module.exports = {
  bot: {
    name: process.env.BOT_NAME || 'Pakistan Jobs Bot 🇵🇰',
    prefix: process.env.PREFIX || '!',
    version: '4.0.0',
    developer: 'Mudassar Khan',
    devNumber: '923477262704'
  },

  session: {
    id: process.env.SESSION_ID || '',
    folder: './bot_session'
  },

  owners: [
    '923216046022@s.whatsapp.net',
    '923071639265@s.whatsapp.net',
    '923477262704@s.whatsapp.net',
    '923257762682@s.whatsapp.net'
  ],

  channel: {
    jid: process.env.CHANNEL_JID || '120363425538472027@newsletter'
  },

  scheduler: {
    scrapeInterval: parseInt(process.env.SCRAPE_INTERVAL) || 20,  // minutes
    sendInterval: 8,    // minutes between sends
    minDelay: 18,       // min random delay minutes
    maxDelay: 25,       // max random delay minutes
    maxJobsStored: 1000
  },

  scrapers: {
    concurrency: 5,     // max parallel scrapers
    timeout: 10000,     // 10 seconds per scraper
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },

  dashboard: {
    port: parseInt(process.env.PORT) || 3000
  },

  // Whitelisted commands only - bot ignores everything else
  commands: [
    'ping', 'alive', 'help', 'menu',
    'all', 'govt', 'defense', 'defence', 'private',
    'army', 'navy', 'paf', 'anf', 'rangers',
    'njp', 'fpsc', 'ppsc', 'spsc', 'nadra', 'paec',
    'hec', 'fbr', 'wapda', 'pia', 'railways',
    'rozee', 'mustakbil', 'hbl', 'mcb',
    'matric', 'inter', 'bs', 'ms',
    'stats', 'about', 'source', 'sources'
  ]
};
