const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeRangers() {
  const $ = await withTimeout(fetchPage('https://www.pakistanrangers.gov.pk/careers'));
  const jobs = [];
  $('table tr, .job-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.pakistanrangers.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Pakistan Rangers', location: 'Pakistan', education: '', deadline, salary: 'Govt Pay Scale', url: link.startsWith('http') ? link : `https://www.pakistanrangers.gov.pk${link}`, category: 'defence', source: 'Rangers' }));
    }
  });
  return jobs;
}
module.exports = scrapeRangers;
