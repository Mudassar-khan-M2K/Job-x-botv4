const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapePunjab() {
  const $ = await withTimeout(fetchPage('https://jobs.punjab.gov.pk'));
  const jobs = [];
  $('table tr, .job-item, .vacancy-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3,.job-title').first().text().trim();
    const org = $(el).find('td:nth-child(2),.org').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://jobs.punjab.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: org || 'Punjab Government', location: 'Punjab', education: '', deadline, salary: 'Govt Scale', url: link.startsWith('http') ? link : `https://jobs.punjab.gov.pk${link}`, category: 'govt', source: 'Punjab Govt' }));
    }
  });
  return jobs;
}
module.exports = scrapePunjab;
