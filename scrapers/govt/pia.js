const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapePIA() {
  const $ = await withTimeout(fetchPage('https://www.piac.com.pk/careers'));
  const jobs = [];
  $('table tr, .job-item, .career-item').each((i, el) => {
    const title = $(el).find('td:first-child,h3,.title').first().text().trim();
    const deadline = $(el).find('td:last-child,.date').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.piac.com.pk/careers';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'PIA', location: 'Karachi', education: '', deadline, salary: 'Market Competitive', url: link.startsWith('http') ? link : `https://www.piac.com.pk${link}`, category: 'govt', source: 'PIA' }));
    }
  });
  return jobs;
}
module.exports = scrapePIA;
