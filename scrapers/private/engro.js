const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeEngro() {
  const $ = await withTimeout(fetchPage('https://engroholdingscareers.com/vacancies/'));
  const jobs = [];
  $('article, .job-listing, .career-item, table tr').each((i, el) => {
    const title = $(el).find('h2,h3,h4,.title,td:first-child').first().text().trim();
    const location = $(el).find('.location,.city').first().text().trim();
    const deadline = $(el).find('.deadline,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://engroholdingscareers.com';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'Engro Corporation', location: location || 'Karachi', education: 'BS/MBA', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://engroholdingscareers.com${link}`, category: 'private', source: 'Engro' }));
    }
  });
  return jobs;
}
module.exports = scrapeEngro;
