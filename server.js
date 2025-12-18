const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
let fetchImpl = globalThis.fetch
if (!fetchImpl) {
  try { fetchImpl = require('undici').fetch } catch (e) { fetchImpl = require('node-fetch') }
  globalThis.fetch = fetchImpl
}
const keyFile = require('./Gemini Chatbot/secret-key.json')
const API_KEY = keyFile && keyFile.API_KEY ? keyFile.API_KEY : ''
const MODEL_NAME = 'gemini-2.5-flash-lite-preview-09-2025'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL_NAME)}:generateContent?key=${encodeURIComponent(API_KEY)}`

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
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const textBody = await resp.text().catch(() => '')
    let parsed = null
    try { parsed = textBody ? JSON.parse(textBody) : null } catch (e) { parsed = null }
    if (!resp.ok) {
      if (resp.status === 429) {
        let retry = ''
        if (parsed && parsed.error && Array.isArray(parsed.error.details)) {
          for (const d of parsed.error.details) {
            if (d && d['@type'] && d['@type'].includes('RetryInfo') && d.retryDelay) {
              retry = d.retryDelay
              break
            }
          }
        }
        const message = (parsed && parsed.error && parsed.error.message) ? parsed.error.message.split('\n')[0] : `Quota exceeded (status ${resp.status})`
        const friendly = retry ? `${message} Retry in ${retry}.` : message
        res.status(429).json({ error: friendly })
        return
      } else {
        const message = (parsed && parsed.error && parsed.error.message) ? parsed.error.message.split('\n')[0] : textBody || resp.statusText
        res.status(resp.status).json({ error: `API error ${resp.status}: ${message}` })
        return
      }
    }
    const json = parsed || {}
    const candidate = (json && json.candidates && json.candidates[0]) || null
    if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
      res.json({ reply: candidate.content.parts[0].text })
    } else {
      res.json({ reply: 'The model returned an empty response.' })
    }
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server listening on port', PORT))
