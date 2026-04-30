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
    console.log('[PlayStore API] HTML preview (first 2000 chars):', html.substring(0, 2000));

    // Try multiple patterns for title
    const titleMatch1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const titleMatch2 = html.match(/<h1[^>]*[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    const titleMatch3 = html.match(/itemprop="name"[^>]*content="([^"]+)"/);
    const titleMatch4 = html.match(/"name":"([^"]+)"/);
    
    console.log('[PlayStore API] Title match1:', titleMatch1 ? titleMatch1[1] : 'null');
    console.log('[PlayStore API] Title match2:', titleMatch2 ? titleMatch2[1] : 'null');
    console.log('[PlayStore API] Title match3:', titleMatch3 ? titleMatch3[1] : 'null');
    console.log('[PlayStore API] Title match4:', titleMatch4 ? titleMatch4[1] : 'null');

    // Try multiple patterns for icon
    const iconMatch1 = html.match(/<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/);
    const iconMatch2 = html.match(/<img[^>]*[^>]*class="[^"]*rw98Zc[^"]*"[^>]*src="([^"]+)"/);
    const iconMatch3 = html.match(/itemprop="image"[^>]*content="([^"]+)"/);
    const iconMatch4 = html.match(/"image":"([^"]+)"/);
    
    console.log('[PlayStore API] Icon match1:', iconMatch1 ? iconMatch1[1].substring(0, 100) : 'null');
    console.log('[PlayStore API] Icon match2:', iconMatch2 ? iconMatch2[1].substring(0, 100) : 'null');
    console.log('[PlayStore API] Icon match3:', iconMatch3 ? iconMatch3[1].substring(0, 100) : 'null');
    console.log('[PlayStore API] Icon match4:', iconMatch4 ? iconMatch4[1].substring(0, 100) : 'null');

    const titleMatch = titleMatch3 || titleMatch1 || titleMatch2 || titleMatch4;
    const iconMatch = iconMatch3 || iconMatch2 || iconMatch1 || iconMatch4;

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
