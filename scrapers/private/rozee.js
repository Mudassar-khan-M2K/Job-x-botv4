const { axiosInstance, buildJob, withTimeout } = require('../base');
async function scrapeRozee() {
  const res = await withTimeout(axiosInstance.get('https://www.rozee.pk/api/jobs?country=Pakistan&limit=20'));
  const jobs = [];
  const data = res.data?.jobs || res.data?.data || [];
  for (const job of data.slice(0, 15)) {
    jobs.push(buildJob({ title: job.title || job.job_title, organization: job.company || job.company_name, location: job.city || job.location || 'Pakistan', education: job.degree || '', deadline: job.expiry || job.deadline || '', salary: job.salary || 'Market Competitive', url: job.url || job.apply_url || 'https://www.rozee.pk', category: 'private', source: 'Rozee' }));
  }
  return jobs;
}
module.exports = scrapeRozee;
