const https = require('https');

export default async (req, res) => {
  const packageId = req.query.id;
  
  console.log('[PlayStore API] Request received for:', packageId);

  if (!packageId) {
    return res.status(400).json({ error: 'Missing package id' });
  }

  try {
    // Try with different User-Agents (some apps may be region-restricted)
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];

    let html = null;
    for (let userAgent of userAgents) {
      try {
        const url = `https://play.google.com/store/apps/details?id=${packageId}`;
        console.log('[PlayStore API] Attempting fetch with UA:', userAgent.substring(0, 50));
        html = await fetchUrl(url, userAgent);
        
        if (html && html.length > 1000) {
          console.log('[PlayStore API] Successfully fetched HTML');
          break;
        }
      } catch (e) {
        console.log('[PlayStore API] UA attempt failed, trying next...');
        continue;
      }
    }

    if (!html) {
      console.log('[PlayStore API] Failed to fetch after all attempts');
      return res.status(500).json({ error: 'Could not fetch Play Store page' });
    }

    // Extract title with multiple fallback patterns
    let title = null;
    const titlePatterns = [
      /itemprop="name"[^>]*content="([^"]+)"/,
      /"name":"([^"]+)"/,
      /<h1[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/,
      /<h1[^>]*>([^<]+)<\/h1>/
    ];

    for (let pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        console.log('[PlayStore API] Found title with pattern:', title.substring(0, 50));
        break;
      }
    }

    // Extract icon with multiple fallback patterns
    let icon = null;
    const iconPatterns = [
      /itemprop="image"[^>]*content="([^"]+)"/,
      /"image":"([^"]+)"/,
      /<img[^>]*[^>]*class="[^"]*rw98Zc[^"]*"[^>]*src="([^"]+)"/,
      /<img[^>]*class="[^"]*T75of[^"]*"[^>]*src="([^"]+)"/
    ];

    for (let pattern of iconPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        icon = match[1];
        console.log('[PlayStore API] Found icon with pattern:', icon.substring(0, 100));
        break;
      }
    }

    console.log('[PlayStore API] Sending response:', { title, icon });
    
    // If we got nothing, at least return the package ID as title
    if (!title && !icon) {
      console.log('[PlayStore API] No data extracted, returning package ID as fallback');
      return res.status(200).json({ 
        title: packageId, 
        icon: null,
        fallback: true 
      });
    }
    
    return res.status(200).json({ title, icon });

  } catch (error) {
    console.error('[PlayStore API] Error:', error.message);
    // Return package ID as fallback on error too
    return res.status(200).json({ 
      title: packageId, 
      icon: null,
      fallback: true,
      error: error.message 
    });
  }
};

function fetchUrl(url, userAgent) {
  return new Promise((resolve, reject) => {
    https.get(url, { 
      headers: { 
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000
    }, (response) => {
      let data = '';
      
      if (response.statusCode !== 200) {
        reject(new Error(`Status code: ${response.statusCode}`));
        return;
      }

      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}
