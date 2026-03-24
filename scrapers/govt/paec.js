const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapePAEC() {
  const $ = await withTimeout(fetchPage('https://www.paec.gov.pk/jobs/'));
  const jobs = [];
  $('.job-item, table tr, .vacancy').each((i, el) => {
    const title = $(el).find('h3,td:first-child,.title').first().text().trim();
    const deadline = $(el).find('.date,td:last-child').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.paec.gov.pk/jobs/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'PAEC', location: 'Pakistan', education: '', deadline, salary: 'Govt Scale', url: link.startsWith('http') ? link : `https://www.paec.gov.pk${link}`, category: 'govt', source: 'PAEC' }));
    }
  });
  return jobs;
}
module.exports = scrapePAEC;
