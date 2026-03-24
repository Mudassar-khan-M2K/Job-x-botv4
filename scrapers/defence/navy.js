const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeNavy() {
  const $ = await withTimeout(fetchPage('https://www.joinpaknavy.gov.pk/careers'));
  const jobs = [];
  $('table tr, .career-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3,.title').first().text().trim();
    const edu = $(el).find('.education,td:nth-child(3)').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.joinpaknavy.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Pakistan Navy', location: 'Pakistan', education: edu, deadline, salary: 'Govt Pay Scale', url: link.startsWith('http') ? link : `https://www.joinpaknavy.gov.pk${link}`, category: 'defence', source: 'Navy' }));
    }
  });
  return jobs;
}
module.exports = scrapeNavy;
