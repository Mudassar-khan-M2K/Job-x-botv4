const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeMCB() {
  const $ = await withTimeout(fetchPage('https://www.mcb.com.pk/careers/careers.aspx'));
  const jobs = [];
  $('article,.job-listing,table tr').each((i, el) => {
    const title = $(el).find('h2,h3,.title,td:first-child').first().text().trim();
    const deadline = $(el).find('.deadline,.date,td:last-child').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.mcb.com.pk/careers/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'MCB Bank', location: 'Lahore', education: 'BBA/MBA', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.mcb.com.pk${link}`, category: 'private', source: 'MCB' }));
    }
  });
  return jobs;
}
module.exports = scrapeMCB;
