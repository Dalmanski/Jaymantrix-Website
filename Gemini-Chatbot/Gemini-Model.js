let apiKeys = []
try {
  const fs = require('fs')
  const path = require('path')
  const keyFilePath = path.join(__dirname, 'secret-key.json')
  if (fs.existsSync(keyFilePath)) {
    const keyFile = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'))
    if (keyFile && Array.isArray(keyFile.API_KEY) && keyFile.API_KEY.length > 0) apiKeys = keyFile.API_KEY.slice()
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

const MODEL_NAME = 'gemini-flash-lite-latest'
let currentKeyIndex = 0
let failedKeyIndices = new Set()

function formatHistoryForAPI(history) {
  return history.slice(0, -1).map(function (msg) {
    return { role: msg.sender === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }
  })
}

async function generateReply(updatedMessages, userMessage, systemInstructionOverride) {
  const effectiveSystemInstruction = (typeof systemInstructionOverride === 'string' && systemInstructionOverride.trim().length > 0) ? systemInstructionOverride : ''
  const chatHistory = formatHistoryForAPI(updatedMessages || [])
  const payload = {
    contents: chatHistory.concat([{ role: 'user', parts: [{ text: userMessage || '' }] }]),
    systemInstruction: { parts: [{ text: effectiveSystemInstruction }] }
  }
  if (!apiKeys || apiKeys.length === 0) return "No API keys configured."
  const len = apiKeys.length
  const start = currentKeyIndex % len
  const failedDetails = []
  for (let i = 0; i < len; i++) {
    const idx = (start + i) % len
    const key = apiKeys[idx]
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL_NAME)}:generateContent?key=${encodeURIComponent(key)}`
    try {
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
          const hdrs = {}
          try { resp.headers.forEach((v, k) => { hdrs[k] = v }) } catch (e) {}
          failedDetails.push({ idx, status: resp.status, headers: hdrs, body: textBody })
          if (failedKeyIndices.size >= len) {
            failedKeyIndices.clear()
            function parseRetryHeader(h) {
              if (!h) return null
              const trimmed = String(h).trim()
              const n = parseInt(trimmed, 10)
              if (!isNaN(n)) {
                if (n > 1000000000) return new Date(n * 1000)
                return new Date(Date.now() + n * 1000)
              }
              const dt = Date.parse(trimmed)
              if (!isNaN(dt)) return new Date(dt)
              return null
            }
            const lines = ["I'm ran out of Free Tier Message. Pls try again later.", '', '--- Diagnostic info ---']
            lines.push(`Tried indices: ${failedDetails.map(d => d.idx).join(', ')}`)
            let earliest = null
            failedDetails.forEach((d) => {
              const h = d.headers || {}
              const retryAfter = h['retry-after'] || h['x-ratelimit-reset'] || h['x-rate-limit-reset'] || h['x-ratelimitreset'] || h['x-rate-limit-reset']
              const estimated = parseRetryHeader(retryAfter)
              const estStr = estimated ? estimated.toUTCString() : 'unknown'
              lines.push(`- key ${d.idx}: status=${d.status} retry-after=${String(retryAfter || 'N/A')} estimated_recovery=${estStr}`)
              if (estimated) {
                if (!earliest || estimated < earliest) earliest = estimated
              }
            })
            if (earliest) {
              lines.push('')
              lines.push(`Estimated earliest recovery: ${earliest.toUTCString()}`)
            } else {
              lines.push('')
              lines.push('Estimated earliest recovery: unknown')
            }
            lines.push('')
            lines.push('Raw diagnostic dump:')
            failedDetails.forEach((d) => {
              lines.push(`--- key ${d.idx} ---`)
              try { lines.push(JSON.stringify(d.headers)) } catch (e) { lines.push(String(d.headers)) }
              if (d.body) lines.push(`body: ${d.body}`)
            })
            return lines.join('\n')
          }
          continue
        } else {
          const message = (parsed && parsed.error && parsed.error.message) ? parsed.error.message.split('\n')[0] : textBody || resp.statusText
          return `API error ${resp.status}: ${message}`
        }
      }
      failedKeyIndices.clear()
      currentKeyIndex = idx
      const json = parsed || {}
      const candidate = (json && json.candidates && json.candidates[0]) || null
      if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text) {
        return candidate.content.parts[0].text
      }
      return 'The model returned an empty response.'
    } catch (err) {
      return err && err.message ? `Network error: ${err.message}` : String(err)
    }
  }
  return "I'm ran out of Free Tier Message. Pls try again later."
}

function getStatus() { return { totalKeys: (apiKeys && apiKeys.length) || 0, currentKeyIndex, failedKeyIndices: Array.from(failedKeyIndices), model: MODEL_NAME }; }

module.exports = { generateReply, getStatus }
