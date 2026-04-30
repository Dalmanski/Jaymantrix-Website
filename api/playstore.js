const https = require('https');

export default async (req, res) => {
  const packageId = req.query.id;
  
  console.log('[PlayStore API] Request received');
  console.log('[PlayStore API] Package ID:', packageId);

  if (!packageId) {
    console.log('[PlayStore API] Missing package id');
    return res.status(400).json({ error: 'Missing package id' });
  }

  try {
    const url = `https://play.google.com/store/apps/details?id=${packageId}`;
    console.log('[PlayStore API] Fetching URL:', url);
    
    const html = await fetchUrl(url);
    console.log('[PlayStore API] Successfully fetched HTML, length:', html.length);

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const iconMatch = html.match(/<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/);

    console.log('[PlayStore API] Title match:', titleMatch ? titleMatch[1] : 'null');
    console.log('[PlayStore API] Icon match:', iconMatch ? iconMatch[1].substring(0, 50) : 'null');

    const response = {
      title: titleMatch ? titleMatch[1].trim() : null,
      icon: iconMatch ? iconMatch[1] : null
    };
    
    console.log('[PlayStore API] Sending response:', response);
    return res.status(200).json(response);
  } catch (error) {
    console.error('[PlayStore API] Error:', error.message);
    console.error('[PlayStore API] Error stack:', error.stack);
    return res.status(500).json({ error: error.message });
  }
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      } 
    }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
