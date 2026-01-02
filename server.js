const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
let fetchImpl = globalThis.fetch
if (!fetchImpl) {
  try { fetchImpl = require('undici').fetch } catch (e) { fetchImpl = require('node-fetch') }
  globalThis.fetch = fetchImpl
}

const modelModule = require('./Gemini_Chatbot/Gemini-2.5-Model.js')

function getModelName() {
    const st = (typeof modelModule.getStatus === 'function') ? modelModule.getStatus() : null
    return st.model
}

const app = express()
app.use(bodyParser.json({ limit: '1mb' }))
app.use(express.static(path.join(__dirname)))

app.post('/chat', async (req, res) => {
  const body = req.body || {}
  const userMessage = body.message || ''
  const messages = Array.isArray(body.messages) ? body.messages : []
  const systemInstructionText = typeof body.systemInstruction === 'string' && body.systemInstruction.trim().length > 0 ? body.systemInstruction : 'Concise 50 words response'
  try {
    const reply = await modelModule.generateReply(messages, userMessage, systemInstructionText)
    res.json({ reply })
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

app.get('/api/status', (req, res) => {
  try {
    const model = require('./Gemini_Chatbot/Gemini-2.5-Model.js')
    const status = (typeof model.getStatus === 'function') ? model.getStatus() : { totalKeys: 0, currentKeyIndex: 0, failedKeyIndices: [], model: getModelName() }
    res.json(status)
  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : String(err) })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server listening on port', PORT))