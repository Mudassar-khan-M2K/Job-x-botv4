const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapebayt() {
  const $ = await withTimeout(fetchPage('https://www.bayt.com/en/pakistan/jobs/'));
  const jobs = [];
  $('[data-js-aid="jobID"], .has-pointer-d').each((i, el) => {
    const title = $(el).find('h2,h3,.job-name').first().text().trim();
    const org = $(el).find('.t-nowrap,.company-name').first().text().trim();
    const location = $(el).find('.location-link,.city').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.bayt.com';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: org, location: location || 'Pakistan', education: '', deadline: '', salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.bayt.com${link}`, category: 'private', source: 'Bayt' }));
    }
  });
  return jobs;
}
module.exports = scrapebayt;
