const https = require('https');

exports.handler = async (event) => {
  const packageId = event.queryStringParameters?.id;

  if (!packageId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing package id' })
    };
  }

  try {
    const url = `https://play.google.com/store/apps/details?id=${packageId}`;
    const html = await fetchUrl(url);

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const iconMatch = html.match(/<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/);

    return {
      statusCode: 200,
      body: JSON.stringify({
        title: titleMatch ? titleMatch[1].trim() : null,
        icon: iconMatch ? iconMatch[1] : null
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      } 
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
