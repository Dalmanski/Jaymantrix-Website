const path = require('path')
const express = require('express')
const fs = require('fs')
const https = require('https')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/My_Info', express.static(path.join(__dirname, '..', '..', 'My_Info')))

let chatHandler = null
let statusHandler = null
try {
  chatHandler = require(path.join(__dirname, '..', '..', 'api', 'chat.js'))
} catch (e) {
  console.warn('Warning: api/chat.js not found, using mock chat handler for dev')
  chatHandler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    try {
      const body = req.body || {}
      const message = typeof body.message === 'string' ? body.message : ''
      const reply = message ? `Echo: ${message}` : "Hello! (mock AI reply)"
      return res.status(200).json({ reply })
    } catch (err) {
      return res.status(500).json({ error: String(err) })
    }
  }
}

try {
  statusHandler = require(path.join(__dirname, '..', '..', 'api', 'status.js'))
} catch (e) {
  console.warn('Warning: api/status.js not found, using mock status handler for dev')
  statusHandler = (req, res) => {
    return res.status(200).json({ totalKeys: 0, currentKeyIndex: -1, failedKeyIndices: [], model: 'Mock AI (dev)' })
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    await chatHandler(req, res)
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err && err.message ? err.message : String(err) })
  }
})
app.get('/api/status', async (req, res) => {
  try {
    await statusHandler(req, res)
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err && err.message ? err.message : String(err) })
  }
})

app.get('/api/playstore', async (req, res) => {
  try {
    const packageId = req.query.id
    
    if (!packageId) {
      return res.status(400).json({ error: 'Missing package id' })
    }

    const url = `https://play.google.com/store/apps/details?id=${packageId}`
    const html = await fetchUrl(url)

    const titleMatch = html.match(/"name":"([^"]+)"/)
    
    const imagePatterns = [
      /"image":"([^"]+)"/,
      /"imageUrl":"([^"]+)"/,
      /"icon":"([^"]+)"/,
      /"iconUrl":"([^"]+)"/,
      /"coverImage":"([^"]+)"/,
      /"headerImage":"([^"]+)"/,
      /"src":"([^"]+\.webp)"/,
      /"src":"([^"]+\.jpg)"/,
      /"src":"([^"]+\.png)"/,
      /https:\/\/[^"]*(?:webp|jpg|png)/
    ]
    
    let iconMatch = null
    for (const pattern of imagePatterns) {
      const match = html.match(pattern)
      if (match) {
        iconMatch = match
        break
      }
    }

    const result = {
      title: titleMatch ? titleMatch[1].trim() : null,
      icon: iconMatch ? iconMatch[1] : null
    }
    
    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

app.use('/api', (req, res) => {
  if (!res.headersSent) res.status(404).json({ error: 'API route not found' })
})

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

app.get('/', (req, res) => res.send('Dev API server running'))

app.listen(PORT, () => {
  console.log(`Dev API server listening on http://localhost:${PORT}`)
})