const https = require('https');
const http = require('http');

exports.handler = async (event) => {
  const tab = event.queryStringParameters?.tab || 'projects';
  
  const urls = {
    projects: 'https://docs.google.com/spreadsheets/d/1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI/export?format=csv&gid=878640986',
    calendar: 'https://docs.google.com/spreadsheets/d/1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI/export?format=csv&gid=0',
    resources: 'https://docs.google.com/spreadsheets/d/1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI/export?format=csv&gid=0',
  };

  const url = urls[tab];
  if (!url) {
    return { statusCode: 400, body: 'Invalid tab' };
  }

  const fetchUrl = (targetUrl) => {
    return new Promise((resolve, reject) => {
      const client = targetUrl.startsWith('https') ? https : http;
      client.get(targetUrl, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/csv,*/*'
        }
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303) {
          resolve(fetchUrl(res.headers.location));
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    });
  };

  try {
    const data = await fetchUrl(url);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Access-Control-Allow-Origin': '*',
      },
      body: data,
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
