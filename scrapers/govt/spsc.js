const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeSPSC() {
  const $ = await withTimeout(fetchPage('https://www.spsc.gos.pk/advertisements'));
  const jobs = [];
  $('table tr, .job-item').each((i, el) => {
    const title = $(el).find('td:first-child, h3').first().text().trim();
    const deadline = $(el).find('td:last-child').text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.spsc.gos.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'SPSC', location: 'Sindh', education: '', deadline, salary: 'Govt Scale', url: link.startsWith('http') ? link : `https://www.spsc.gos.pk${link}`, category: 'govt', source: 'SPSC' }));
    }
  });
  return jobs;
}
module.exports = scrapeSPSC;
