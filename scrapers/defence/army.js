const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeArmy() {
  const $ = await withTimeout(fetchPage('https://www.joinpakarmy.gov.pk/careers.aspx'));
  const jobs = [];
  $('table tr, .career-item, .vacancy').each((i, el) => {
    const title = $(el).find('td:first-child,h3,h4,.title').first().text().trim();
    const edu = $(el).find('.education,td:nth-child(3)').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.joinpakarmy.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Pakistan Army', location: 'Pakistan', education: edu, deadline, salary: 'Govt Pay Scale', url: link.startsWith('http') ? link : `https://www.joinpakarmy.gov.pk${link}`, category: 'defence', source: 'Army' }));
    }
  });
  return jobs;
}
module.exports = scrapeArmy;
