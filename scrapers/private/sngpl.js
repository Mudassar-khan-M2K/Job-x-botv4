const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeSNGPL() {
  const $ = await withTimeout(fetchPage('https://www.sngpl.com.pk/careers'));
  const jobs = [];
  $('article,.job-item,table tr').each((i, el) => {
    const title = $(el).find('h2,h3,.title,td:first-child').first().text().trim();
    const deadline = $(el).find('.deadline,.date,td:last-child').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.sngpl.com.pk/careers';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'SNGPL', location: 'Lahore', education: '', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.sngpl.com.pk${link}`, category: 'private', source: 'SNGPL' }));
    }
  });
  return jobs;
}
module.exports = scrapeSNGPL;
