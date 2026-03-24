const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeANF() {
  const $ = await withTimeout(fetchPage('https://www.anf.gov.pk/jobs.php'));
  const jobs = [];
  $('table tr, .job-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3').first().text().trim();
    const deadline = $(el).find('td:last-child').text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.anf.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'ANF', location: 'Pakistan', education: '', deadline, salary: 'Govt Pay Scale', url: link.startsWith('http') ? link : `https://www.anf.gov.pk${link}`, category: 'defence', source: 'ANF' }));
    }
  });
  return jobs;
}
module.exports = scrapeANF;
