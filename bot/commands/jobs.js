const { getJobsByCategory, getJobsBySource, getJobsByEducation, getAllRecentJobs } = require('../../database/db');
const config = require('../../config/config');

const CATEGORY_EMOJI = { govt: '🏛️', defence: '⚔️', private: '🏢' };
const CATEGORY_LABEL = { govt: 'GOVERNMENT', defence: 'DEFENCE', private: 'PRIVATE' };

function formatJob(job) {
  const emoji = CATEGORY_EMOJI[job.category] || '💼';
  const label = CATEGORY_LABEL[job.category] || job.category?.toUpperCase() || 'JOB';

  return `${emoji} *${label} JOB*\n\n` +
    `🏢 *Organization:* ${job.organization || 'N/A'}\n` +
    `💼 *Position:* ${job.title || 'N/A'}\n` +
    `📍 *Location:* ${job.location || 'Pakistan'}\n` +
    `🎓 *Education:* ${job.education || 'N/A'}\n` +
    `📅 *Last Date:* ${job.deadline || 'N/A'}\n` +
    `💰 *Salary:* ${job.salary || 'As per policy'}\n` +
    `🔗 *Apply:* ${job.url || 'N/A'}\n` +
    `━━━━━━━━━━━━━━━\n` +
    `📌 Source: ${job.source || 'N/A'}`;
}

async function jobsCmd(sock, msg, type, filter) {
  const chatJid = msg.key.remoteJid;
  let jobs = [];

  if (type === 'all') jobs = getAllRecentJobs();
  else if (['govt','defence','private'].includes(type)) jobs = getJobsByCategory(type);
  else if (type === 'source') jobs = getJobsBySource(filter);
  else if (type === 'education') jobs = getJobsByEducation(filter);

  if (!jobs || jobs.length === 0) {
    await sock.sendMessage(chatJid, { text: `📭 No jobs found! Try ${config.bot.prefix}all` }, { quoted: msg });
    return;
  }

  const toSend = jobs.slice(0, 5);
  await sock.sendMessage(chatJid, { text: `📋 Showing top ${toSend.length} jobs:` }, { quoted: msg });

  for (const job of toSend) {
    await sock.sendMessage(chatJid, { text: formatJob(job) });
    await new Promise(r => setTimeout(r, 500));
  }
}

module.exports = { jobsCmd, formatJob };
