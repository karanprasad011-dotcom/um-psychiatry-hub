const https = require('https');

exports.handler = async (event) => {
  const tab = event.queryStringParameters?.tab || 'projects';
  
  const urls = {
    projects: 'https://docs.google.com/spreadsheets/d/1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI/export?format=csv&gid=878640986',
    calendar: 'https://docs.google.com/spreadsheets/d/1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI/export?format=csv&gid=calendar',
    resources: 'https://docs.google.com/spreadsheets/d/1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI/export?format=csv&gid=resources',
  };

  const url = urls[tab];
  if (!url) {
    return { statusCode: 400, body: 'Invalid tab' };
  }

  return new Promise((resolve) => {
    const fetchUrl = (targetUrl) => {
      https.get(targetUrl, (res) => {
        // Follow redirects
        if (res.statusCode === 302 || res.statusCode === 301) {
          fetchUrl(res.headers.location);
          return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'text/csv',
              'Access-Control-Allow-Origin': '*',
            },
            body: data,
          });
        });
      }).on('error', (err) => {
        resolve({ statusCode: 500, body: err.message });
      });
    };
    fetchUrl(url);
  });
};
