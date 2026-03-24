const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeUnilever() {
  const $ = await withTimeout(fetchPage('https://careers.unilever.com/search/?q=&locationsearch=pakistan'));
  const jobs = [];
  $('.job-card,.job-listing,article').each((i, el) => {
    const title = $(el).find('h2,h3,.job-title').first().text().trim();
    const location = $(el).find('.location,.city').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://careers.unilever.com';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Unilever Pakistan', location: location || 'Karachi', education: 'BS/MBA', deadline: '', salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://careers.unilever.com${link}`, category: 'private', source: 'Unilever' }));
    }
  });
  return jobs;
}
module.exports = scrapeUnilever;
