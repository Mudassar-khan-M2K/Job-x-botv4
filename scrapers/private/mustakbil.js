const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeMustakbil() {
  const $ = await withTimeout(fetchPage('https://www.mustakbil.com/jobs/search/?country=pk'));
  const jobs = [];
  $('.job-card, .job-item, .job-listing').each((i, el) => {
    const title = $(el).find('h2,h3,.job-title').first().text().trim();
    const org = $(el).find('.company,.employer').first().text().trim();
    const location = $(el).find('.location,.city').first().text().trim();
    const deadline = $(el).find('.deadline,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.mustakbil.com';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: org, location: location || 'Pakistan', education: '', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.mustakbil.com${link}`, category: 'private', source: 'Mustakbil' }));
    }
  });
  return jobs;
}
module.exports = scrapeMustakbil;
