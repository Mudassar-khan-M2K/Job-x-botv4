const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapePSO() {
  const $ = await withTimeout(fetchPage('https://www.psopk.com/en/careers/'));
  const jobs = [];
  $('article,.job-listing,.career-item,table tr').each((i, el) => {
    const title = $(el).find('h2,h3,.title,td:first-child').first().text().trim();
    const deadline = $(el).find('.deadline,.date,td:last-child').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.psopk.com/en/careers/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Pakistan State Oil', location: 'Karachi', education: 'BS/MBA', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.psopk.com${link}`, category: 'private', source: 'PSO' }));
    }
  });
  return jobs;
}
module.exports = scrapePSO;
