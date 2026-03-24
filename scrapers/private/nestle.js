const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeNestle() {
  const $ = await withTimeout(fetchPage('https://www.nestle.com.pk/jobs'));
  const jobs = [];
  $('article,.job-card,.career-item').each((i, el) => {
    const title = $(el).find('h2,h3,.title').first().text().trim();
    const location = $(el).find('.location').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.nestle.com.pk/jobs';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Nestle Pakistan', location: location || 'Lahore', education: 'BS/MBA', deadline: '', salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.nestle.com.pk${link}`, category: 'private', source: 'Nestle' }));
    }
  });
  return jobs;
}
module.exports = scrapeNestle;
