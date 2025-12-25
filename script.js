let jsonGames = []
let forgottenGames = []
let allGames = []
let aiFetchFiles = ['MyGames.json', 'MyYTinfo.json', 'notes_section.txt', 'forget_acc.txt', 'updatelog.txt']

const gameList = document.getElementById('game-list')
const gameCount = document.getElementById('game-count')
const searchInput = document.getElementById('searchInput')
const fetchDateEl = document.getElementById('fetch-date')

let chatMessages = []

const chatMessagesEl = document.getElementById('chat-messages')
const chatInput = document.getElementById('chat-input')
const chatSend = document.getElementById('chat-send')

async function setInitialGreeting() {
  try {
    const res = await fetch('BrainAI.txt').catch(() => null)
    if (res && res.ok) {
      const txt = await res.text().catch(() => '')
      const greeting = txt && txt.trim() ? txt.trim() : "Hi! I'm Jaymantrix AI."
      chatMessages = [{ sender: 'ai', text: greeting }]
      renderChatMessages()
      return
    }
  } catch (e) {}
  chatMessages = [{ sender: 'ai', text: "Hello! I'm Jaymantrix AI." }]
  renderChatMessages()
}

function formatMessageText(text) {
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
    while (display.length && /[.,;:!?)\]\}\'"]$/.test(display)) {
      trailing = display.slice(-1) + trailing
      display = display.slice(0, -1)
    }
    let href = display.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    if (!/^https?:\/\//i.test(href)) href = 'http://' + href
    const safeHref = href.replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="chat-link">${display}</a>${trailing}`
  })

  return withLinks.replace(/\n/g, '<br>')
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function formatDateToManilaShortMonth(d) {
  try {
    const opts = { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }
    return new Intl.DateTimeFormat('en-US', opts).format(d)
  } catch (e) {
    const hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 === 0 ? 12 : hours % 12
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${hour12}:${minutes} ${ampm}`
  }
}

fetch('MyYTinfo.json')
  .then((response) => response.json())
  .then((data) => {
    const iconUrl = data.icon || 'https://via.placeholder.com/100x100?text=No+Icon'
    const fav = document.getElementById('dynamic-favicon')
    if (fav) fav.href = iconUrl
    const h1 = document.getElementById('yt-header')
    if (h1) h1.innerHTML = `<img src="${iconUrl}" alt="Channel Icon" style="width:32px;height:32px;vertical-align:middle;border-radius:50%;margin-right:10px;">${h1.innerHTML}`
    const avatar = document.querySelector('.chat-avatar')
    if (avatar) avatar.src = iconUrl
    const fetchedAt = data.fetched_at || (data.date && data.time ? `${data.date}T${data.time}` : null)
    let dateObj = null
    if (fetchedAt) {
      const parsed = new Date(fetchedAt)
      if (!isNaN(parsed)) dateObj = parsed
    }
    if (!dateObj) dateObj = new Date()
    const formatted = formatDateToManilaShortMonth(dateObj)
    if (fetchDateEl) fetchDateEl.textContent = `Updated since: ${formatted}`
  })
  .catch(() => {
    const now = new Date()
    if (fetchDateEl) fetchDateEl.textContent = `Updated since: ${formatDateToManilaShortMonth(now)}`
  })

function loadGames() {
  fetch('MyGames.json')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load game list.')
      return res.text()
    })
    .then((text) => {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) jsonGames = parsed
      else if (Array.isArray(parsed.games)) jsonGames = parsed.games
      else jsonGames = parsed
      return loadForgottenAccounts()
    })
    .catch((err) => {
      if (gameList) gameList.innerHTML = `<p style="color:red;">⚠️ ${escapeHtml(err.message)}</p>`
    })
}

function loadForgottenAccounts() {
  return fetch('forget_acc.txt')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load forgotten accounts.')
      return res.text()
    })
    .then((text) => {
      forgottenGames = text
        .trim()
        .split('\n')
        .filter((line) => line.trim())
        .map((name) => ({ name: name.trim(), category: 'Forgotten Accounts', isForgotten: true }))
      allGames = [...jsonGames, ...forgottenGames]
      renderGames(allGames)
    })
    .catch((err) => {
      if (gameList) gameList.innerHTML += `<p style="color:red;">⚠️ ${escapeHtml(err.message)}</p>`
    })
}

function getGameKey(game) {
  return (game.playstore_id ?? game.id ?? game.user_id ?? game.name ?? JSON.stringify(game)).toString()
}

function renderGames(gameData) {
  const grouped = {}
  ;(gameData || []).forEach((game) => {
    const rawCat = game.category
    const cats = Array.isArray(rawCat) ? rawCat.map((c) => (c || '').toString().trim()).filter(Boolean) : rawCat ? [rawCat.toString().trim()] : ['Other']
    game._categories = cats.length ? cats : ['Other']
    game._categories.forEach((cat) => {
      const primary = cat || 'Other'
      if (!grouped[primary]) grouped[primary] = []
      grouped[primary].push(game)
    })
  })
  const categories = Object.keys(grouped).sort((a, b) => {
    if (a === 'Forgotten Accounts') return 1
    if (b === 'Forgotten Accounts') return -1
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })
  let html = ''
  categories.forEach((category) => {
    let cards = ''
    const safeCategoryIdForGroup = category.replace(/\s+/g, '_')
    grouped[category].forEach((game, index) => {
      if (game.isForgotten) {
        cards += `<div class="game-card"><div class="game-name">${escapeHtml(game.name)}</div></div>`
      } else {
        const tooltipText = game.description || 'Click to copy this ID'
        let tagsHtml = ''
        if (Array.isArray(game._categories) && game._categories.length > 1) {
          const tags = game._categories.map((c) => `<span class="category-tag">${escapeHtml(c)}</span>`).join('')
          tagsHtml = `<div class="category-tags">${tags}</div>`
        }
        const safeCatId = safeCategoryIdForGroup.replace(/'/g, "\\'")
        const copiedId = `copied-${safeCatId}-${index}`
        const copyValue = game.id ?? game.user_id ?? game.playstore_id ?? ''
        cards += `
          <div class="game-card" onclick="copyToClipboard('${escapeHtml(copyValue)}', ${index}, '${safeCatId}')">
            <div class="tooltip">${escapeHtml(tooltipText)}</div>
            <img src="${escapeHtml(game.icon || 'https://via.placeholder.com/100x100?text=No+Icon')}" alt="${escapeHtml(game.name)}" />
            <div class="game-name">${escapeHtml(game.name)}</div>
            <div class="player-id">${escapeHtml(game.user_id ?? '')}</div>
            ${tagsHtml}
            <div class="copied-msg" id="${copiedId}">Copied!</div>
          </div>`
      }
    })
    html += `
      <div class="category-section">
        <h2 class="category-title">${escapeHtml(category)} Games</h2>
        <div class="game-grid">${cards}</div>
      </div>`
  })
  if (gameList) gameList.innerHTML = html
  const countA = Array.isArray(jsonGames) ? jsonGames.length : 0
  const countB = Array.isArray(forgottenGames) ? forgottenGames.length : 0
  if (gameCount) gameCount.textContent = `Games Found: ${countA + countB}`
}

function copyToClipboard(text, index, safeCategoryId) {
  try { navigator.clipboard.writeText(text) } catch (e) {}
  const el = document.getElementById(`copied-${safeCategoryId}-${index}`)
  if (!el) return
  const parent = el.parentElement
  if (!parent) return
  parent.classList.add('show-copied')
  setTimeout(() => {
    parent.classList.remove('show-copied')
  }, 1200)
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    const query = (searchInput.value || '').toLowerCase()
    const filtered = (allGames || []).filter((game) => {
      if (game.isForgotten) {
        return (game.name || '').toLowerCase().includes(query)
      } else {
        const nameMatch = (game.name || '').toLowerCase().includes(query)
        const idMatch = (game.id ?? game.user_id ?? '').toString().toLowerCase().includes(query)
        const catString = Array.isArray(game._categories) ? game._categories.join(' ').toLowerCase() : (game.category || '').toString().toLowerCase()
        const catMatch = catString.includes(query)
        return nameMatch || idMatch || catMatch
      }
    })
    renderGames(filtered)
  })
}

function showSection(section) {
  const gameListEl = document.getElementById('game-list')
  const notesEl = document.getElementById('notes-section')
  const chatEl = document.getElementById('chat-section')
  const footerEl = document.querySelector('footer')
  const btnGames = document.getElementById('btn-games')
  const btnNotes = document.getElementById('btn-notes')
  const chatTrigger = document.getElementById('chat-trigger')

  if (gameListEl) gameListEl.style.display = section === 'games' ? 'block' : 'none'
  if (notesEl) notesEl.style.display = section === 'notes' ? 'block' : 'none'
  if (chatEl) {
    if (section === 'chat') {
      chatEl.classList.add('align-top')
      chatEl.style.display = 'flex'
      if (footerEl) footerEl.style.display = 'none'
      setTimeout(() => {
        chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
    } else {
      chatEl.classList.remove('align-top')
      chatEl.style.display = 'none'
      if (footerEl) footerEl.style.display = ''
    }
  }
  if (gameCount) gameCount.style.display = section === 'games' ? 'block' : 'none'

  if (btnGames) btnGames.classList.toggle('active', section === 'games')
  if (btnNotes) btnNotes.classList.toggle('active', section === 'notes')
  if (chatTrigger) chatTrigger.classList.toggle('active', section === 'chat')
}

function loadNotes() {
  const container = document.getElementById('notes-container')
  if (!container) return
  container.innerHTML = ''
  fetch('notes_section.txt')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to load notes.')
      return res.text()
    })
    .then((text) => {
      const lines = text.split('\n')
      let currentTitle = ''
      let currentItems = []
      let html = ''
      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('>')) {
          if (currentTitle && currentItems.length > 0) {
            html += buildNoteSection(currentTitle, currentItems)
          }
          currentTitle = trimmed.replace(/^>\s*/, '')
          currentItems = []
        } else if (trimmed !== '') {
          currentItems.push(trimmed)
        }
        if (index === lines.length - 1 && currentTitle && currentItems.length > 0) {
          html += buildNoteSection(currentTitle, currentItems)
        }
      })
      container.innerHTML = html
      addNoteToggleListeners()
    })
    .catch((err) => {
      container.innerHTML = `<p style="color:red;">⚠️ ${escapeHtml(err.message)}</p>`
    })
}

function buildNoteSection(title, items) {
  const listItems = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  return `
    <div class="note-block">
      <h3 class="note-title">${escapeHtml(title)}</h3>
      <div class="note-content" style="display:none;">
        <ol>${listItems}</ol>
      </div>
    </div>`
}

function addNoteToggleListeners() {
  document.querySelectorAll('.note-title').forEach((title) => {
    title.addEventListener('click', () => {
      const content = title.nextElementSibling
      content.style.display = content.style.display === 'block' ? 'none' : 'block'
    })
  })
}

async function buildSystemInstruction() {
  let base = 'Concise 50 words response.'
  try {
    const baseRes = await fetch('BrainAI.txt').catch(() => null)
    if (baseRes && baseRes.ok) {
      const txt = await baseRes.text().catch(() => '')
      if (txt && txt.trim()) base = txt.trim()
    }
    const texts = await Promise.all(aiFetchFiles.map(async (f) => {
      try {
        const r = await fetch(f).catch(() => null)
        if (r && r.ok) {
          const txt = await r.text().catch(() => '')
          return { file: f, text: txt }
        }
      } catch (e) {}
      return { file: f, text: '' }
    }))
    const parts = [base]
    texts.forEach((t) => {
      parts.push(`FILE: ${t.file}`)
      parts.push(t.text || '')
    })
    return parts.join('\n\n')
  } catch {
    return base
  }
}

async function generateInitialAssistantMessage() {
  chatMessages[0] = { sender: 'ai', text: 'Thinking', loading: true }
  renderChatMessages()
  let systemInstructionPure = 'Concise 50 words response.'
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
      if (resp.status === 429 || /quota|quota exceeded|rate limit/i.test(bodyText)) {
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
      if (/quota|quota exceeded|rate limit/i.test(reply)) {
        reply = 'AI temporarily unavailable due to quota. Please try again later.'
      }
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
      if (resp.status === 429 || /quota|quota exceeded|rate limit/i.test(bodyText)) {
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
      if (/quota|quota exceeded|rate limit/i.test(reply)) reply = 'AI temporarily unavailable due to quota. Please try again later.'
    }
    chatMessages[loadingIndex] = { sender: 'ai', text: reply }
    renderChatMessages()
  } catch (err) {
    const msg = (err && err.message) ? `Network error: ${err.message}. Is the backend running on port 3000?` : 'Network error. Is the backend running?'
    chatMessages[loadingIndex] = { sender: 'ai', text: msg }
    renderChatMessages()
  }
}

const SETTINGS_KEY = 'jay_settings'
let settings = { sounds: true, music: true, typewriter: true }

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) settings = Object.assign(settings, JSON.parse(raw))
  } catch {}
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch {}
}

async function typeWrite(container, html) {
  const frag = document.createRange().createContextualFragment(html)
  function sleep(ms) { return new Promise((res) => setTimeout(res, ms)) }
  const typeSoundEl = document.getElementById('type-sound')
  const chatSection = document.getElementById('chat-section')
  const isChatVisible = chatSection && window.getComputedStyle(chatSection).display !== 'none'
  const shouldPlaySound = () => settings.sounds && isChatVisible
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
          await sleep(16 + Math.random() * 20)
          if (!settings.typewriter) {
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
  chatMessages.forEach((m, idx) => {
    const div = document.createElement('div')
    const classes = [`message`, m.sender === 'ai' ? 'ai' : 'user']
    if (m.loading) classes.push('loading')
    div.className = classes.join(' ')
    const textHtml = formatMessageText(m.text || '')
    const textContainer = document.createElement('div')
    textContainer.className = 'text'
    div.appendChild(textContainer)
    chatMessagesEl.appendChild(div)
    if (m.sender === 'ai' && !m.loading && settings.typewriter && !m._typed) {
      m._typed = true
      textContainer.classList.add('typing')
      typeWrite(textContainer, textHtml).then(() => { textContainer.classList.remove('typing') }).catch(() => {
        textContainer.classList.remove('typing')
        textContainer.innerHTML = textHtml
      })
    } else {
      textContainer.innerHTML = textHtml
    }
  })
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight
}

function attemptPlayMusic() {
  const bg = document.getElementById('bg-music')
  if (!bg) return
  if (!settings.music) return
  const p = bg.play()
  if (p && p.catch) {
    p.catch(() => {
      function oneClickStart() {
        bg.play().catch(() => {})
        document.removeEventListener('click', oneClickStart)
      }
      document.addEventListener('click', oneClickStart)
    })
  }
}

function applySettingsToUI() {
  const sSounds = document.getElementById('setting-sounds')
  const sMusic = document.getElementById('setting-music')
  const sType = document.getElementById('setting-typewriter')
  if (sSounds) sSounds.checked = !!settings.sounds
  if (sMusic) sMusic.checked = !!settings.music
  if (sType) sType.checked = !!settings.typewriter
  const bg = document.getElementById('bg-music')
  if (bg) {
    if (settings.music) {
      bg.volume = 0.65
      attemptPlayMusic()
    } else {
      try { bg.pause(); bg.currentTime = 0 } catch (e) {}
    }
  }
}

function initSettings() {
  loadSettings()
  applySettingsToUI()
  const btn = document.getElementById('settings-toggle')
  const panel = document.getElementById('settings-panel')
  const closeBtn = document.getElementById('settings-close')
  if (btn && panel) btn.addEventListener('click', () => { panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false') })
  if (closeBtn && panel) closeBtn.addEventListener('click', () => { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true') })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true') } })
  document.addEventListener('click', (e) => { if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true') } })
  const sSounds = document.getElementById('setting-sounds')
  const sMusic = document.getElementById('setting-music')
  const sType = document.getElementById('setting-typewriter')
  if (sSounds) sSounds.addEventListener('change', () => { settings.sounds = sSounds.checked; saveSettings() })
  if (sMusic) sMusic.addEventListener('change', () => { settings.music = sMusic.checked; saveSettings(); applySettingsToUI() })
  if (sType) sType.addEventListener('change', () => { settings.typewriter = sType.checked; saveSettings(); if (!settings.typewriter) { chatMessages.forEach(m => m._typed = true); renderChatMessages() } })
}

const userGestureToStart = () => { attemptPlayMusic(); document.removeEventListener('click', userGestureToStart) }

document.addEventListener('DOMContentLoaded', () => {
  loadGames()
  loadNotes()
  renderChatMessages()
  showSection('games')
  renderQuickPrompts()
  generateInitialAssistantMessage()
  initSettings()
  attemptPlayMusic()
})

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
  "What's your YouTube Channel link?",
  "What's your dream in the future?",
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

if (chatSend) {
  chatSend.addEventListener('click', () => {
    sendChatMessage()
  })
}

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendChatMessage()
    }
  })
} 


