const https = require('https');

export default async (req, res) => {
  const packageId = req.query.id;

  if (!packageId) {
    return res.status(400).json({ error: 'Missing package id' });
  }

  try {
    const url = `https://play.google.com/store/apps/details?id=${packageId}`;
    const html = await fetchUrl(url);

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const iconMatch = html.match(/<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/);

    return res.status(200).json({
      title: titleMatch ? titleMatch[1].trim() : null,
      icon: iconMatch ? iconMatch[1] : null
    });
  } catch (error) {
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
