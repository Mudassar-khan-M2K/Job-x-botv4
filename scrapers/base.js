const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const https = require('https');
const config = require('../config/config');

const axiosInstance = axios.create({
  timeout: config.scrapers.timeout,
  // Bypass SSL certificate issues common on Pakistani govt sites
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
  }
});

// Generate unique ID from URL + title
function generateId(url, title) {
  return crypto.createHash('md5').update(`${url}${title}`).digest('hex').substring(0, 16);
}

// Timeout wrapper
function withTimeout(promise, ms = config.scrapers.timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ]);
}

async function fetchPage(url) {
  const res = await axiosInstance.get(url);
  return cheerio.load(res.data);
}

// Build a standard job object
function buildJob({ title, organization, location, education, deadline, salary, url, category, source }) {
  return {
    id: generateId(url || source, title),
    title: (title || '').trim(),
    organization: (organization || '').trim(),
    location: (location || 'Pakistan').trim(),
    education: (education || '').trim(),
    deadline: (deadline || '').trim(),
    salary: (salary || 'As per policy').trim(),
    url: (url || '').trim(),
    category,
    source
  };
}

module.exports = { axiosInstance, generateId, withTimeout, fetchPage, buildJob };
