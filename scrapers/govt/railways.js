const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeRailways() {
  const $ = await withTimeout(fetchPage('https://www.railways.gov.pk/careers'));
  const jobs = [];
  $('table tr, .job-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3').first().text().trim();
    const deadline = $(el).find('td:last-child').text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.railways.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Pakistan Railways', location: 'Pakistan', education: '', deadline, salary: 'Govt Scale', url: link.startsWith('http') ? link : `https://www.railways.gov.pk${link}`, category: 'govt', source: 'Railways' }));
    }
  });
  return jobs;
}
module.exports = scrapeRailways;
