const { fetchPage, buildJob, withTimeout } = require('../base');

async function scrapePPSC() {
  const $ = await withTimeout(fetchPage('https://ppsc.gop.pk/advertisements'));
  const jobs = [];
  $('.advertisement-item, table tr, .job-row').each((i, el) => {
    const title = $(el).find('h3, td:first-child, .title').first().text().trim();
    const deadline = $(el).find('.date, td:last-child').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://ppsc.gop.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({
        title, organization: 'PPSC',
        location: 'Punjab', education: '',
        deadline, salary: 'Govt Scale',
        url: link.startsWith('http') ? link : `https://ppsc.gop.pk${link}`,
        category: 'govt', source: 'PPSC'
      }));
    }
  });
  return jobs;
}

module.exports = scrapePPSC;
