const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeJazz() {
  const $ = await withTimeout(fetchPage('https://www.jazz.com.pk/careers/'));
  const jobs = [];
  $('article,.job-card,.career-item').each((i, el) => {
    const title = $(el).find('h2,h3,.title').first().text().trim();
    const location = $(el).find('.location').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.jazz.com.pk/careers/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Jazz Pakistan', location: location || 'Islamabad', education: 'BS/MBA', deadline: '', salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.jazz.com.pk${link}`, category: 'private', source: 'Jazz' }));
    }
  });
  return jobs;
}
module.exports = scrapeJazz;
