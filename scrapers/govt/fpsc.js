const { fetchPage, buildJob, withTimeout } = require('../base');

async function scrapeFPSC() {
  const $ = await withTimeout(fetchPage('https://www.fpsc.gov.pk/iwms/fpsc/jobs/recentjobs.asp'));
  const jobs = [];
  $('table tr').each((i, el) => {
    if (i === 0) return;
    const cols = $(el).find('td');
    const title = $(cols[1]).text().trim() || $(cols[0]).text().trim();
    const deadline = $(cols[cols.length - 1]).text().trim();
    const link = $(el).find('a').attr('href') || '';
    if (title && title.length > 3) {
      jobs.push(buildJob({
        title, organization: 'FPSC',
        location: 'Pakistan', education: '',
        deadline, salary: 'Govt Scale',
        url: link.startsWith('http') ? link : `https://www.fpsc.gov.pk${link}`,
        category: 'govt', source: 'FPSC'
      }));
    }
  });
  return jobs;
}

module.exports = scrapeFPSC;
