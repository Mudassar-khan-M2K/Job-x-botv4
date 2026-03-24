const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapePAF() {
  const $ = await withTimeout(fetchPage('https://paf.gov.pk/careers'));
  const jobs = [];
  $('table tr, .career-item, .job-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3,.title').first().text().trim();
    const edu = $(el).find('.education,td:nth-child(3)').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://paf.gov.pk/careers';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Pakistan Air Force', location: 'Pakistan', education: edu, deadline, salary: 'Govt Pay Scale', url: link.startsWith('http') ? link : `https://paf.gov.pk${link}`, category: 'defence', source: 'PAF' }));
    }
  });
  return jobs;
}
module.exports = scrapePAF;
