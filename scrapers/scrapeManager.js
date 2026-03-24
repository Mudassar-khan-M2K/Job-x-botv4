const pLimit = require('p-limit');
const config = require('../config/config');
const logger = require('../config/logger');
const { insertManyJobs, setStat, cleanOldJobs } = require('../database/db');
const { logError } = require('../database/db');

// Import all scrapers
const scrapers = [
  // Government (12)
  { name: 'NJP', fn: require('./govt/njp') },
  { name: 'FPSC', fn: require('./govt/fpsc') },
  { name: 'PPSC', fn: require('./govt/ppsc') },
  { name: 'SPSC', fn: require('./govt/spsc') },
  { name: 'NADRA', fn: require('./govt/nadra') },
  { name: 'PAEC', fn: require('./govt/paec') },
  { name: 'HEC', fn: require('./govt/hec') },
  { name: 'FBR', fn: require('./govt/fbr') },
  { name: 'WAPDA', fn: require('./govt/wapda') },
  { name: 'PIA', fn: require('./govt/pia') },
  { name: 'Railways', fn: require('./govt/railways') },
  { name: 'Punjab Govt', fn: require('./govt/punjab') },

  // Defence (5)
  { name: 'Army', fn: require('./defence/army') },
  { name: 'Navy', fn: require('./defence/navy') },
  { name: 'PAF', fn: require('./defence/paf') },
  { name: 'ANF', fn: require('./defence/anf') },
  { name: 'Rangers', fn: require('./defence/rangers') },

  // Private (13)
  { name: 'Rozee', fn: require('./private/rozee') },
  { name: 'Mustakbil', fn: require('./private/mustakbil') },
  { name: 'Bayt', fn: require('./private/bayt') },
  { name: 'Engro', fn: require('./private/engro') },
  { name: 'PSO', fn: require('./private/pso') },
  { name: 'HBL', fn: require('./private/hbl') },
  { name: 'MCB', fn: require('./private/mcb') },
  { name: 'Unilever', fn: require('./private/unilever') },
  { name: 'Nestle', fn: require('./private/nestle') },
  { name: 'PTCL', fn: require('./private/ptcl') },
  { name: 'SNGPL', fn: require('./private/sngpl') },
  { name: 'Telenor', fn: require('./private/telenor') },
  { name: 'Jazz', fn: require('./private/jazz') }
];

async function runAllScrapers() {
  logger.info(`🔍 Starting scrape cycle — ${scrapers.length} sources`);
  const limit = pLimit(config.scrapers.concurrency); // max 5 parallel

  let totalInserted = 0;
  let successCount = 0;
  let failCount = 0;

  const tasks = scrapers.map(scraper =>
    limit(async () => {
      try {
        const jobs = await scraper.fn();
        if (jobs && jobs.length > 0) {
          const inserted = insertManyJobs(jobs);
          totalInserted += inserted;
          successCount++;
          logger.info(`✅ ${scraper.name}: ${jobs.length} found, ${inserted} new`);
        } else {
          logger.info(`📭 ${scraper.name}: 0 jobs found`);
          successCount++;
        }
      } catch (err) {
        failCount++;
        logger.warn(`⚠️ ${scraper.name} failed: ${err.message}`);
        // Log to DB but DON'T alert owners - scraper fails are expected sometimes
        try { logError('scraper_fail', scraper.name, err.message); } catch (_) {}
      }
    })
  );

  await Promise.all(tasks);

  // Cleanup old jobs
  cleanOldJobs(config.scheduler.maxJobsStored);

  // Update last scrape time
  setStat('last_scrape', new Date().toISOString());

  logger.info(`🏁 Scrape done — ${successCount} success, ${failCount} failed, ${totalInserted} new jobs`);
  return { totalInserted, successCount, failCount };
}

module.exports = { runAllScrapers };
