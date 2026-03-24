const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapePTCL() {
  const $ = await withTimeout(fetchPage('https://ptcl.com.pk/careers'));
  const jobs = [];
  $('article,.job-card,.career-item,table tr').each((i, el) => {
    const title = $(el).find('h2,h3,.title,td:first-child').first().text().trim();
    const deadline = $(el).find('.deadline,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://ptcl.com.pk/careers';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'PTCL', location: 'Islamabad', education: 'BS/MBA', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://ptcl.com.pk${link}`, category: 'private', source: 'PTCL' }));
    }
  });
  return jobs;
}
module.exports = scrapePTCL;
