const { fetchPage, buildJob, withTimeout } = require('../base');

async function scrapeNJP() {
  const $ = await withTimeout(fetchPage('https://www.njp.gov.pk/njp/jobs'));
  const jobs = [];
  $('table tr, .job-item, .vacancy-item').each((i, el) => {
    const title = $(el).find('td:nth-child(1), .job-title, h3').first().text().trim();
    const org = $(el).find('td:nth-child(2), .org-name').first().text().trim();
    const deadline = $(el).find('td:nth-child(4), td:last-child, .deadline').first().text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.njp.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({
        title, organization: org || 'Govt of Pakistan',
        location: 'Pakistan', education: '',
        deadline, salary: '', url: link.startsWith('http') ? link : `https://www.njp.gov.pk${link}`,
        category: 'govt', source: 'NJP'
      }));
    }
  });
  return jobs;
}

module.exports = scrapeNJP;
