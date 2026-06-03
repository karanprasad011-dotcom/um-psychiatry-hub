exports.handler = async (event) => {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSsx-VKKgmse7rTZjdmjzKYNRV69ppN8u9h0hi4qxgdMqKnxYclU5tqDeOdZjtBnX1dwXdKVlkl_lDn/pub?gid=878640986&single=true&output=csv';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'curl/7.68.0',
        'Accept': 'text/csv, text/plain, */*',
      },
      redirect: 'follow',
    });

    const text = await response.text();

    if (text.trim().startsWith('<')) {
      return { 
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Got HTML', status: response.status, preview: text.substring(0, 200) })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Access-Control-Allow-Origin': '*',
      },
      body: text,
    };
  } catch (err) {
    return { 
      statusCode: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: `Error: ${err.message}` 
    };
  }
};
