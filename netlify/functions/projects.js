const https = require('https');

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appVpFZgycFM6Seat';
const TABLE_IDS = {
  projects:  'tblcGVrdBixm2RIep',
  calendar:  'tblSF0AU4vD8KgfEq',
};

function airtableRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const url = new URL(res.headers.location);
          const redirectOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: options.method,
            headers: options.headers
          };
          resolve(airtableRequest(redirectOptions, body));
        } else {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const token = process.env.AIRTABLE_TOKEN;
  const tableParam = (event.queryStringParameters?.table || 'projects').toLowerCase();
  const tableId = TABLE_IDS[tableParam];

  if (!tableId) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: `Unknown table: ${tableParam}` })
    };
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // GET — fetch all records
  if (event.httpMethod === 'GET' && !event.queryStringParameters?.id) {
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${BASE_ID}/${tableId}?maxRecords=100`,
      method: 'GET',
      headers
    };
    const result = await airtableRequest(options, null);
    return {
      statusCode: result.statusCode,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: result.body
    };
  }

  // GET single record by id
  if (event.httpMethod === 'GET' && event.queryStringParameters?.id) {
    const recordId = event.queryStringParameters.id;
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${BASE_ID}/${tableId}/${recordId}`,
      method: 'GET',
      headers
    };
    const result = await airtableRequest(options, null);
    return {
      statusCode: result.statusCode,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: result.body
    };
  }

  // POST — create record
  if (event.httpMethod === 'POST') {
    const body = JSON.stringify({ fields: JSON.parse(event.body) });
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${BASE_ID}/${tableId}`,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
    };
    const result = await airtableRequest(options, body);
    return {
      statusCode: result.statusCode,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: result.body
    };
  }

  // PATCH — update record
  if (event.httpMethod === 'PATCH') {
    const { id, ...fields } = JSON.parse(event.body);
    const body = JSON.stringify({ fields });
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${BASE_ID}/${tableId}/${id}`,
      method: 'PATCH',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
    };
    const result = await airtableRequest(options, body);
    return {
      statusCode: result.statusCode,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: result.body
    };
  }

  // DELETE — delete record
  if (event.httpMethod === 'DELETE') {
    const recordId = event.queryStringParameters?.id;
    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${BASE_ID}/${tableId}/${recordId}`,
      method: 'DELETE',
      headers
    };
    const result = await airtableRequest(options, null);
    return {
      statusCode: result.statusCode,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: result.body
    };
  }

  return {
    statusCode: 405,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
