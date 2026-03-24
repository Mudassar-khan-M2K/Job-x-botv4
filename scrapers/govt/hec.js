const { fetchPage, buildJob, withTimeout } = require('../base');
async function scrapeHEC() {
  const $ = await withTimeout(fetchPage('https://www.hec.gov.pk/english/services/faculty/Pages/vacancies.aspx'));
  const jobs = [];
  $('table tr, .job-listing').each((i, el) => {
    const title = $(el).find('td:first-child,h3').first().text().trim();
    const deadline = $(el).find('td:last-child').text().trim();
    const link = $(el).find('a').attr('href') || 'https://www.hec.gov.pk';
    if (title && title.length > 3) {
      jobs.push(buildJob({ title, organization: 'HEC', location: 'Islamabad', education: 'BS/MS', deadline, salary: 'Govt Scale', url: link.startsWith('http') ? link : `https://www.hec.gov.pk${link}`, category: 'govt', source: 'HEC' }));
    }
  });
  return jobs;
}
module.exports = scrapeHEC;
