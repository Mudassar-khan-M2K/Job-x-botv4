const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeNADRA() {
  const $ = await withTimeout(fetchPage('https://www.nadra.gov.pk/careers/'));
  const jobs = [];
  $('.job-listing, .career-item, table tr, article').each((i, el) => {
    const title = $(el).find('h2,h3,h4,td:first-child,.job-title').first().text().trim();
    const deadline = $(el).find('.deadline,.date,td:last-child').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.nadra.gov.pk/careers/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'NADRA', location: 'Pakistan', education: '', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.nadra.gov.pk${link}`, category: 'govt', source: 'NADRA' }));
    }
  });
  return jobs;
}
module.exports = scrapeNADRA;
