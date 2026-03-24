const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeWAPDA() {
  const $ = await withTimeout(fetchPage('https://www.wapda.gov.pk/index.php/jobs'));
  const jobs = [];
  $('table tr, .job-item, .news-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3,.title').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.wapda.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'WAPDA', location: 'Pakistan', education: '', deadline, salary: 'Govt Scale', url: link.startsWith('http') ? link : `https://www.wapda.gov.pk${link}`, category: 'govt', source: 'WAPDA' }));
    }
  });
  return jobs;
}
module.exports = scrapeWAPDA;
