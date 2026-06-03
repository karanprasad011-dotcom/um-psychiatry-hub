const https = require('https');
const http = require('http');

const SHEET_ID = '1GiFPK8xNSOZ0jMuBfOVA17Tch8NvZAduI3np1T1EtMI';
const GID = '878640986';

exports.handler = async (event) => {
  // Use the published CSV URL instead of export
  const url = `https://docs.google.com/spreadsheets/d/e/2PACX-1vSsx-VKKgmse7rTZjdmjzKYNRV69ppN8u9h0hi4qxgdMqKnxYclU5tqDeOdZjtBnX1dwXdKVlkl_lDn/pub?gid=${GID}&single=true&output=csv`;

  const fetchUrl = (targetUrl, redirectCount = 0) => {
    return new Promise((resolve, reject) => {
      if (redirectCount > 10) return reject(new Error('Too many redirects'));
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
          'Accept': 'text/html,text/csv,*/*',
        }
      }, (res) => {
        if ([301,302,303,307,308].includes(res.statusCode)) {
          return resolve(fetchUrl(res.headers.location, redirectCount + 1));
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
        res.on('error', reject);
      });
      req.on('error', reject);
    });
  };

  try {
    const result = await fetchUrl(url);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Access-Control-Allow-Origin': '*',
      },
      body: result.data || 'empty',
    };
  } catch (err) {
    return { statusCode: 500, body: `Error: ${err.message}` };
  }
};
