let chatMessages = []

let chatMessagesEl = null
let chatInput = null
let chatSend = null

let aiInfoBtn = null
let aiModal = null
let modalClose = null
let apiProgress = null
let modalModelName = null
let modalModelDesc = null
let notifSound = null
let apiNotification = null
let apiNotifMessage = null
let apiNotifClose = null
let sendSoundEl = null

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

let prevApiStatus = null
let notifTimeout = null
let apiStatusInterval = null

function getSettings() {
  if (typeof window !== 'undefined' && window.settings) return window.settings
  return { sounds: true, music: true, typewriter: true, typewriterSpeed: 0.015 }
}

function formatMessageTextLocal(text) {
  try {
    if (!text && text !== '') return ''
    const raw = String(text)
    const escaped = escapeHtml(raw)
    const withCode = escaped.replace(/`([^`]+?)`/g, '<code>$1</code>')
    const withBold = withCode.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    const withEm = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>')
    const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+)/gi
    const withLinks = withEm.replace(urlRegex, (m) => {
      let display = m
      let trailing = ''
      while (display.length && /[.,;:!?)\]\}\'\"]$/.test(display)) {
        trailing = display.slice(-1) + trailing
        display = display.slice(0, -1)
      }
      let href = display.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
      if (!/^https?:\/\//i.test(href)) href = 'http://' + href
      const safeHref = href.replace(/"/g, '&quot;').replace(/'/g, '&#039;')
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="chat-link">${display}</a>${trailing}`
    })
    return withLinks.replace(/\n/g, '<br>')
  } catch (e) {
    return escapeHtml(String(text || ''))
  }
}

function formatDateToManilaShortMonth(date) {
  try {
    const opts = {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }
    const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(date)
    const map = {}
    parts.forEach(p => { if (p.type && p.value) map[p.type] = p.value })
    const month = map.month || ''
    const day = map.day || ''
    const year = map.year || ''
    const hour = map.hour || '00'
    const minute = map.minute || '00'
    const dayPeriod = map.dayPeriod || ''
    return `${month} ${parseInt(day, 10)}, ${year} ${hour}:${minute} ${dayPeriod}`
  } catch (e) {
    return date.toUTCString()
  }
}

async function buildSystemInstruction() {
  let base = 'Concise 50 words response.'
  try {
    const baseRes = await fetch('/Gemini-Chatbot/BrainAI.txt').catch(() => null)
    if (baseRes && baseRes.ok) {
      const txt = await baseRes.text().catch(() => '')
      if (txt && txt.trim()) base = txt.trim()
    }
    const aiFetchFiles = ['/My_Info/MyGames.json', '/My_Info/MyYTinfo.json', '/My_Info/notes_section.txt', '/My_Info/forget_acc.txt', '/changelog.txt']
    const texts = await Promise.all(aiFetchFiles.map(async (f) => {
      try {
        const candidates = []
        const add = (u) => { if (u && !candidates.includes(u)) candidates.push(u) }
        add(f)
        add(f.startsWith('/') ? f : `/${f}`)
        if (typeof location !== 'undefined' && location && location.origin) {
          add(`${location.origin}${f.startsWith('/') ? f : `/${f}`}`)
        }
        try {
          const snapshot = candidates.slice()
          snapshot.forEach(c => { add(c + (c.includes('?') ? '&' : '?') + 't=' + Date.now()) })
        } catch (e) {}
        for (let cand of candidates) {
          try {
            const r = await fetch(cand, { cache: 'no-store' }).catch(() => null)
            if (r && r.ok) {
              const txt = await r.text().catch(() => '')
              return { file: f, text: txt }
            }
          } catch (e) {}
        }
      } catch (e) {}
      return { file: f, text: '' }
    }))

    const fileParts = texts.map((t) => `FILE: ${t.file}\n${t.text || ''}`).join('\n\n')
    const now = new Date()
    const formattedNow = formatDateToManilaShortMonth(now)
    const result = [base, 'Context ->', fileParts || 'No context files found.', `Current Date and Time: ${formattedNow}`].join('\n\n')
    return result
  } catch {
    return base
  }
}

async function generateInitialAssistantMessage() {
  try { chatMessages[0] = { sender: 'ai', text: 'Thinking', loading: true } } catch (e) {}
  renderChatMessages()
  let systemInstructionPure = 'Concise only one paragraph response with a limit of 50 words **Do not next paragraph** for short response.'
  try {
    const systemInstruction = await buildSystemInstruction()
    systemInstructionPure = (systemInstruction.split('Context ->')[0] || systemInstructionPure).trim()
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Generate a concise assistant introduction using only the provided system instruction. Reply as the assistant, keep it to 1-2 short sentences.",
        messages: [],
        systemInstruction
      })
    })
    let reply = ''
    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => '')
      if (resp.status === 429) {
        reply = 'AI temporarily unavailable due to quota. Please try again later.'
      } else {
        try {
          const parsed = bodyText ? JSON.parse(bodyText) : null
          reply = (parsed && parsed.error) || `API error ${resp.status}`
        } catch (e) {
          reply = `API error ${resp.status}`
        }
      }
    } else {
      const json = await resp.json().catch(() => null)
      reply = (json && json.reply) || (json && json.error) || ''
      if (!reply) reply = systemInstructionPure.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3).join(' ')
    }
    chatMessages[0] = { sender: 'ai', text: reply }
  } catch (err) {
    const fallback = systemInstructionPure.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3).join(' ') || "Hello! I'm Jaymantrix AI."
    chatMessages[0] = { sender: 'ai', text: fallback }
  }
  renderChatMessages()
}

async function sendChatMessage() {
  const text = (chatInput.value || '').trim()
  if (!text) return
  const sendSoundElLocal = document.getElementById('send-sound')
  try { if (getSettings().sounds && sendSoundElLocal) { sendSoundElLocal.currentTime = 0; sendSoundElLocal.play().catch(() => {}) } } catch (e) {}
  chatMessages.push({ sender: 'user', text })
  renderChatMessages()
  chatInput.value = ''
  const systemInstruction = await buildSystemInstruction()
  const loadingIndex = chatMessages.push({ sender: 'ai', text: 'Thinking', loading: true }) - 1
  renderChatMessages()
  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, messages: chatMessages, systemInstruction })
    })
    let reply = 'No reply'
    if (!resp.ok) {
      const bodyText = await resp.text().catch(() => '')
      if (resp.status === 429) {
        reply = 'AI temporarily unavailable due to quota. Please try again later.'
      } else {
        try {
          const parsed = bodyText ? JSON.parse(bodyText) : null
          reply = (parsed && parsed.error) || `API error ${resp.status}: ${bodyText || resp.statusText}`
        } catch (e) {
          reply = `API error ${resp.status}: ${bodyText || resp.statusText}`
        }
      }
    } else {
      const json = await resp.json().catch(() => null)
      reply = (json && json.reply) || (json && json.error) || 'No reply'
    }
    chatMessages[loadingIndex] = { sender: 'ai', text: reply }
    renderChatMessages()
  } catch (err) {
    const msg = (err && err.message) ? `Network error: ${err.message}. Is the backend running on port 3000?` : 'Network error. Is the backend running?'
    chatMessages[loadingIndex] = { sender: 'ai', text: msg }
    renderChatMessages()
  }
}

async function typeWrite(container, html) {
  const frag = document.createRange().createContextualFragment(html)
  function sleep(ms) { return new Promise((res) => setTimeout(res, ms)) }
  const typeSoundEl = document.getElementById('type-sound')
  const chatSection = document.getElementById('chat-section')
  const isChatVisible = chatSection && window.getComputedStyle(chatSection).display !== 'none'
  const shouldPlaySound = () => getSettings().sounds && isChatVisible
  const shouldAutoScroll = () => {
    if (!chatMessagesEl) return true
    return (chatMessagesEl.scrollHeight - (chatMessagesEl.scrollTop + chatMessagesEl.clientHeight)) < 80
  }
  async function walk(srcNode, targetParent) {
    for (let i = 0; i < srcNode.childNodes.length; i++) {
      const node = srcNode.childNodes[i]
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        const textNode = document.createTextNode('')
        targetParent.appendChild(textNode)
        for (let k = 0; k < text.length; k++) {
          const ch = text[k]
          textNode.textContent += ch
          if (shouldPlaySound() && typeSoundEl && ch.trim() !== '') {
            try { typeSoundEl.currentTime = 0; typeSoundEl.play().catch(() => {}) } catch (e) {}
          }
          if (shouldAutoScroll()) {
            try { chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight } catch (e) {}
          }
          const sec = Number(getSettings().typewriterSpeed) || 0.015
          const baseDelay = sec * 1000
          await sleep(baseDelay + Math.random() * Math.min(20, baseDelay))
          if (!getSettings().typewriter) {
            const remaining = text.slice(k + 1)
            if (remaining) textNode.textContent += remaining
            break
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = document.createElement(node.tagName)
        for (let j = 0; j < node.attributes.length; j++) {
          const attr = node.attributes[j]
          try { el.setAttribute(attr.name, attr.value) } catch (e) {}
        }
        targetParent.appendChild(el)
        await walk(node, el)
      }
    }
  }
  await walk(frag, container)
  if (shouldAutoScroll()) try { chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight } catch (e) {}
}

function renderChatMessages() {
  if (!chatMessagesEl) return
  chatMessagesEl.innerHTML = ''
  const chatSection = document.getElementById('chat-section')
  const isChatVisible = chatSection && window.getComputedStyle(chatSection).display !== 'none'
  chatMessages.forEach((m, idx) => {
    const div = document.createElement('div')
    const classes = ['message', m.sender === 'ai' ? 'ai' : 'user']
    if (m.loading) classes.push('loading')
    div.className = classes.join(' ')
    const textHtml = formatMessageTextLocal(m.text || '')
    const textContainer = document.createElement('div')
    textContainer.className = 'text'
    div.appendChild(textContainer)
    chatMessagesEl.appendChild(div)
    if (m.sender === 'ai' && !m.loading && getSettings().typewriter && !m._typed) {
      m._typed = true
      textContainer.classList.add('typing')
      typeWrite(textContainer, textHtml).then(() => { textContainer.classList.remove('typing') }).catch(() => {
        textContainer.classList.remove('typing')
        textContainer.innerHTML = textHtml
      })
    } else {
      textContainer.innerHTML = textHtml
    }
    if (m.sender === 'ai' && !m.loading && !m._playedSound) {
      m._playedSound = true
      try {
        if (!sendSoundEl) sendSoundEl = document.getElementById('send-sound')
        if (getSettings().sounds && isChatVisible && sendSoundEl) {
          sendSoundEl.currentTime = 0
          sendSoundEl.play().catch(() => {})
        }
      } catch (e) {}
    }
  })
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight
}

function sendQuick(text) {
  if (!chatInput) return
  chatInput.value = text
  sendChatMessage()
}

const quickPrompts = [
  "Who are you?",
  "What's your favorite games?",
  "What's your user ID in Limbus Company?",
  "Why Jaymantrix made this AI?",
  "What's the latest update?",
  "Why do you like Gacha Games so much?",
  "What's your YouTube Channel URL link?",
  "What's the current date and time?",
  "What's your dream in the future?"
]

function renderQuickPrompts() {
  const ul = document.getElementById('quick-list') || document.querySelector('.quick-list')
  if (!ul) return
  ul.innerHTML = ''
  quickPrompts.forEach((p) => {
    const li = document.createElement('li')
    li.textContent = p
    li.addEventListener('click', () => sendQuick(p))
    ul.appendChild(li)
  })
}

function bindChatUI() {
  chatMessagesEl = document.getElementById('chat-messages')
  chatInput = document.getElementById('chat-input')
  chatSend = document.getElementById('chat-send')
  sendSoundEl = document.getElementById('send-sound')
  if (chatSend && !chatSend._bound) {
    chatSend.addEventListener('click', () => { sendChatMessage() })
    chatSend._bound = true
  }
  if (chatInput && !chatInput._bound) {
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage() } })
    chatInput._bound = true
  }
  try { if (typeof renderQuickPrompts === 'function') renderQuickPrompts() } catch (e) {}
}

function bindModalUI() {
  aiInfoBtn = document.getElementById('ai-info')
  aiModal = document.getElementById('ai-modal')
  modalClose = document.getElementById('modal-close')
  apiProgress = document.getElementById('api-progress')
  modalModelName = document.getElementById('modal-model-name')
  modalModelDesc = document.getElementById('modal-model-desc')
  notifSound = document.getElementById('notif-sound')
  apiNotification = document.getElementById('api-notification')
  apiNotifMessage = document.getElementById('api-notif-message')
  apiNotifClose = document.getElementById('api-notif-close')

  if (aiInfoBtn && aiModal) {
    if (!aiInfoBtn._bound) {
      aiInfoBtn.addEventListener('click', openModal)
      aiInfoBtn._bound = true
    }
  }
  if (modalClose && aiModal) {
    if (!modalClose._bound) {
      modalClose.addEventListener('click', closeModal)
      modalClose._bound = true
    }
  }
  if (aiModal && !aiModal._bound) {
    aiModal.addEventListener('click', (e) => { if (e.target === aiModal) closeModal() })
    aiModal._bound = true
  }
  if (apiNotifClose && !apiNotifClose._bound) {
    apiNotifClose.addEventListener('click', () => closeApiNotification())
    apiNotifClose._bound = true
  }
}

function openModal() {
  if (!aiModal) return
  aiModal.classList.add('open')
  aiModal.setAttribute('aria-hidden', 'false')
  fetchApiStatus()
}
function closeModal() {
  if (!aiModal) return
  aiModal.classList.remove('open')
  aiModal.setAttribute('aria-hidden', 'true')
}

function showApiNotification(message) {
  if (!apiNotification || !apiNotifMessage) return
  apiNotifMessage.textContent = message
  apiNotification.classList.remove('closing')
  apiNotification.style.display = 'block'
  apiNotification.style.opacity = ''
  void apiNotification.offsetWidth
  apiNotification.classList.add('open')
  apiNotification.setAttribute('aria-hidden', 'false')
  try { if (notifSound) { notifSound.currentTime = 0; notifSound.play().catch(() => {}) } } catch (e) {}
  if (notifTimeout) clearTimeout(notifTimeout)
  notifTimeout = setTimeout(() => { closeApiNotification() }, 5000)
}
function closeApiNotification() {
  if (!apiNotification) return
  apiNotification.classList.remove('open')
  apiNotification.classList.add('closing')
  function onEnd(e) {
    apiNotification.classList.remove('closing')
    apiNotification.classList.remove('open')
    apiNotification.setAttribute('aria-hidden', 'true')
    apiNotification.style.display = 'none'
    apiNotification.style.opacity = ''
    apiNotification.removeEventListener('animationend', onEnd)
  }
  apiNotification.addEventListener('animationend', onEnd)
  if (notifTimeout) { clearTimeout(notifTimeout); notifTimeout = null }
}

async function fetchApiStatus() {
  try {
    const res = await fetch('/api/status')
    if (!res.ok) {
      showApiNotification('Unable to reach AI status endpoint. Is the API server running on port 3000?')
      return
    }
    const json = await res.json()
    const total = Number(json.totalKeys) || 0
    if (modalModelName) modalModelName.textContent = json.model || 'Jaymantrix AI'
    if (modalModelDesc) modalModelDesc.textContent = `Total Keys: ${total}` 
    if (!apiProgress) return

    let failed = Array.isArray(json.failedKeyIndices) ? json.failedKeyIndices.slice() : []
    let current = (typeof json.currentKeyIndex === 'number') ? json.currentKeyIndex : -1
    const count = Math.max(0, total)

    if (count > 0) {
      failed = failed.filter((i) => Number.isFinite(i) && i >= 0 && i < count)
      if (current < 0 || current >= count) current = -1
    } else {
      failed = []
      current = -1
    }

    apiProgress.innerHTML = ''
    if (count === 0) {
      const msg = document.createElement('div')
      msg.className = 'no-keys'
      msg.textContent = 'No API keys configured.'
      apiProgress.appendChild(msg)
    } else {
      for (let i = 0; i < count; i++) {
        const seg = document.createElement('div')
        seg.className = 'api-segment'
        seg.dataset.index = i
        if (failed.includes(i)) seg.classList.add('failed')
        else seg.classList.add('available')
        if (current === i) seg.classList.add('active')
        seg.title = `Key ${i} ${seg.classList.contains('failed') ? '(failed)' : seg.classList.contains('active') ? '(active)' : ''}`
        apiProgress.appendChild(seg)
      }
    }

    apiProgress.setAttribute('aria-valuenow', (current >= 0 && count > 0) ? (current + 1) : 0)
    apiProgress.setAttribute('aria-valuemax', count)
    if (aiInfoBtn) aiInfoBtn.style.color = (failed && failed.length > 0) ? '#ffb3b3' : '#bffbef'

    const prev = prevApiStatus
    const failedKeyString = JSON.stringify((failed || []).slice().sort())
    const prevFailedString = prev ? JSON.stringify((prev.failed || []).slice().sort()) : null
    const changed = prev && ((prev.currentKeyIndex !== current) || (prevFailedString !== failedKeyString))
    if (changed) {
      let msg = ''
      if (prev.currentKeyIndex !== current) msg = `AI switched active API key to ${current}. Check the AI status by clicking the info icon beside the Jaymantrix AI`
      else msg = `AI key status changed. Check the AI status by clicking the info icon beside the Jaymantrix AI`
      showApiNotification(msg)
    }

    prevApiStatus = { currentKeyIndex: current, failed: failed }
  } catch (e) {
    showApiNotification('Failed to reach API server. Is the backend running on port 3000?')
  }
}

function startApiPolling() { fetchApiStatus(); if (apiStatusInterval) clearInterval(apiStatusInterval); apiStatusInterval = setInterval(fetchApiStatus, 5000) }
function stopApiPolling() { if (apiStatusInterval) clearInterval(apiStatusInterval); apiStatusInterval = null }

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') startApiPolling(); else stopApiPolling() })

document.addEventListener('DOMContentLoaded', () => { startApiPolling() })

if (typeof window !== 'undefined') {
  try {
    window.chatpage = {
      buildSystemInstruction,
      generateInitialAssistantMessage,
      sendChatMessage,
      typeWrite,
      renderChatMessages,
      sendQuick,
      renderQuickPrompts,
      bindChatUI,
      bindModalUI,
      openModal,
      closeModal,
      showApiNotification,
      closeApiNotification,
      fetchApiStatus,
      startApiPolling,
      stopApiPolling,
      chatMessages,
      formatMessageText: formatMessageTextLocal
    }
    window.sendChatMessage = sendChatMessage
    window.renderQuickPrompts = renderQuickPrompts
    window.sendQuick = sendQuick
    window.bindChatUI = bindChatUI
    window.bindModalUI = bindModalUI
    window.renderChatMessages = renderChatMessages
    window.generateInitialAssistantMessage = generateInitialAssistantMessage
    window.openModal = openModal
    window.closeModal = closeModal
    window.showApiNotification = showApiNotification
    window.fetchApiStatus = fetchApiStatus
    window.startApiPolling = startApiPolling
    window.stopApiPolling = stopApiPolling
  } catch (e) {}
}
