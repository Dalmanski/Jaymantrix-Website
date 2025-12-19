const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
let fetchImpl = globalThis.fetch
if (!fetchImpl) {
  try { fetchImpl = require('undici').fetch } catch (e) { fetchImpl = require('node-fetch') }
  globalThis.fetch = fetchImpl
}

let apiKeys = []
try {
  const keyFile = require('./Gemini_Chatbot/secret-key.json')
  if (keyFile && Array.isArray(keyFile.API_KEY) && keyFile.API_KEY.length > 0) {
    apiKeys = keyFile.API_KEY.slice()
  }
} catch (e) {}

if ((!apiKeys || apiKeys.length === 0) && process.env.API_KEYS) {
  try {
    const parsed = JSON.parse(process.env.API_KEYS)
    if (Array.isArray(parsed)) apiKeys = parsed.slice()
  } catch (e) {
    apiKeys = process.env.API_KEYS.split(',').map(s => s.trim()).filter(Boolean)
  }
}

if ((!apiKeys || apiKeys.length === 0) && process.env.API_KEY) {
  try {
    const parsed = JSON.parse(process.env.API_KEY)
    if (Array.isArray(parsed)) {
      apiKeys = parsed.slice()
    } else {
      apiKeys = [String(process.env.API_KEY)]
    }
  } catch (e) {
    apiKeys = [String(process.env.API_KEY)]
  }
}
if ((!apiKeys || apiKeys.length === 0)) {
  const keyList = []
  for (let i = 0; i < 10; i++) {
    const v = process.env[`API_KEY_${i}`]
    if (v) keyList.push(v)
  }
  if (keyList.length > 0) apiKeys = keyList
}

const MODEL_NAME = 'gemini-2.5-flash-lite-preview-09-2025'
let currentKeyIndex = 0
let failedKeyIndices = new Set()

const app = express()
app.use(bodyParser.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname)))

function formatHistoryForAPI(history) {
  return (Array.isArray(history) ? history.slice(0, -1) : []).map(function (msg) {
    return { role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }
  })
}

app.post('/chat', async (req, res) => {
  const body = req.body || {}
  const userMessage = body.message || ''
  const messages = Array.isArray(body.messages) ? body.messages : []
  const systemInstructionText = typeof body.systemInstruction === 'string' && body.systemInstruction.trim().length > 0 ? body.systemInstruction : 'Concise 50 words response'
  const chatHistory = formatHistoryForAPI(messages)
  const payload = {
    contents: chatHistory.concat([{ role: 'user', parts: [{ text: userMessage }] }]),
    systemInstruction: { parts: [{ text: systemInstructionText }] }
  }
  try {
    if (!apiKeys || apiKeys.length === 0) {
      res.status(500).json({ error: 'No API keys configured. Set `API_KEYS`, `API_KEY` or `API_KEY_0..` in Vercel settings or add `Gemini_Chatbot/secret-key.json` locally.' })
      return
    }

    const len = apiKeys.length
    const start = currentKeyIndex % len
    for (let i = 0; i < len; i++) {
      const idx = (start + i) % len
      const key = apiKeys[idx]
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL_NAME)}:generateContent?key=${encodeURIComponent(key)}`
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const textBody = await resp.text().catch(() => '')
      let parsed = null
      try { parsed = textBody ? JSON.parse(textBody) : null } catch (e) { parsed = null }
      if (!resp.ok) {
        if (resp.status === 429) {
          failedKeyIndices.add(idx)
          if (failedKeyIndices.size >= len) {
            failedKeyIndices.clear()
            res.json({ reply: "I'm ran out of Free Tier Message. Pls try again later." })
            return
          }
          continue
        } else {
          const message = (parsed && parsed.error && parsed.error.message) ? parsed.error.message.split('\n')[0] : textBody || resp.statusText
          res.status(resp.status).json({ error: `API error ${resp.status}: ${message}` })
          return
        }
      }
      failedKeyIndices.clear()
      currentKeyIndex = idx
      const json = parsed || {}
      const candidate = (json && json.candidates && json.candidates[0]) || null
      if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
        res.json({ reply: candidate.content.parts[0].text })
      } else {
        res.json({ reply: 'The model returned an empty response.' })
      }
      return
    }
    res.json({ reply: "I'm ran out of Free Tier Message. Pls try again later." })
    return
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) })
  }
})

app.post('/api/chat', async (req, res) => {
  const body = req.body || {}
  const message = typeof body.message === 'string' ? body.message : ''
  const messages = Array.isArray(body.messages) ? body.messages : []
  const systemInstructionText = typeof body.systemInstruction === 'string' ? body.systemInstruction : ''
  try {
    const { generateReply } = require('./Gemini_Chatbot/Gemini-2.5-Model.js')
    const reply = await generateReply(messages, message, systemInstructionText)
    res.json({ reply })
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server listening on port', PORT))
