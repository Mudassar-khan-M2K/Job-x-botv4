const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeHBL() {
  const $ = await withTimeout(fetchPage('https://hbl.com/careers/'));
  const jobs = [];
  $('article,.job-listing,.position,table tr').each((i, el) => {
    const title = $(el).find('h2,h3,.title,td:first-child').first().text().trim();
    const location = $(el).find('.location,.city').first().text().trim();
    const deadline = $(el).find('.deadline,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://hbl.com/careers/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'HBL Bank', location: location || 'Karachi', education: 'BBA/MBA', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://hbl.com${link}`, category: 'private', source: 'HBL' }));
    }
  });
  return jobs;
}
module.exports = scrapeHBL;
