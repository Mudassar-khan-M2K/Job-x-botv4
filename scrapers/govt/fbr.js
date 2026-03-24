const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeFBR() {
  const $ = await withTimeout(fetchPage('https://www.fbr.gov.pk/careers/51153'));
  const jobs = [];
  $('table tr, .job-item, article').each((i, el) => {
    const title = $(el).find('td:first-child,h3,h4').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.fbr.gov.pk/careers';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'FBR', location: 'Pakistan', education: '', deadline, salary: 'BPS Scale', url: link.startsWith('http') ? link : `https://www.fbr.gov.pk${link}`, category: 'govt', source: 'FBR' }));
    }
  });
  return jobs;
}
module.exports = scrapeFBR;
