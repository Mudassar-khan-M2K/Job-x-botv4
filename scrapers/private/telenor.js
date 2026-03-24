const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeTelenor() {
  const $ = await withTimeout(fetchPage('https://www.telenor.com.pk/about-telenor/careers/'));
  const jobs = [];
  $('article,.job-card,.career-item').each((i, el) => {
    const title = $(el).find('h2,h3,.title').first().text().trim();
    const location = $(el).find('.location').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.telenor.com.pk/about-telenor/careers/';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Telenor Pakistan', location: location || 'Islamabad', education: 'BS/MBA', deadline: '', salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.telenor.com.pk${link}`, category: 'private', source: 'Telenor' }));
    }
  });
  return jobs;
}
module.exports = scrapeTelenor;
