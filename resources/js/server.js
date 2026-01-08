const path = require('path')
const express = require('express')
const fs = require('fs')

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

app.use('/api', (req, res) => {
  if (!res.headersSent) res.status(404).json({ error: 'API route not found' })
})

app.get('/', (req, res) => res.send('Dev API server running'))

app.listen(PORT, () => {
  console.log(`Dev API server listening on http://localhost:${PORT}`)
})