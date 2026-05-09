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
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    ];

    let html = null;
    for (let userAgent of userAgents) {
      try {
        const url = `https://play.google.com/store/apps/details?id=${packageId}`;
        html = await fetchUrl(url, userAgent);
        if (html && html.length > 500) break;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }

    if (!html) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          title: packageId,
          icon: null,
          fallback: true
        })
      };
    }

    let title = null;
    const titlePatterns = [
      /itemprop="name"[^>]*content="([^"]+)"/,
      /"name":"([^"]+)"/,
      /<h1[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/,
      /<h1[^>]*>([^<]+)<\/h1>/,
      /{"name":"([^"]+)"/
    ];

    for (let pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        break;
      }
    }

    let icon = null;
    const iconPatterns = [
      /itemprop="image"[^>]*content="([^"]+)"/,
      /"image":"([^"]+)"/,
      /<img[^>]*class="[^"]*rw98Zc[^"]*"[^>]*src="([^"]+)"/,
      /<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/,
      /{"image":"([^"]+)"/
    ];

    for (let pattern of iconPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        icon = match[1];
        break;
      }
    }

    if (!title && !icon) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          title: packageId,
          icon: null,
          fallback: true
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ title, icon })
    };
  } catch (error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        title: packageId,
        icon: null,
        fallback: true
      })
    };
  }
};

function fetchUrl(url, userAgent, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) {
      reject(new Error('Max redirects exceeded'));
      return;
    }

    https.get(url, { 
      headers: { 
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive'
      },
      timeout: 15000
    }, (response) => {
      let data = '';
      
      if (response.statusCode === 429) {
        reject(new Error('Rate limited'));
        return;
      }
      
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchUrl(response.headers.location, userAgent, depth + 1).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Status code: ${response.statusCode}`));
        return;
      }

      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}
