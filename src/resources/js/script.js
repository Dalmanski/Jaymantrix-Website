// script.js

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

window.escapeHtml = escapeHtml

import('./gamespage.js').catch(() => {})

function formatMessageText(text) {
  if (window.chatpage && typeof window.chatpage.formatMessageText === 'function') return window.chatpage.formatMessageText(text)
  return ''
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

function safeSetFetchDate(text) {
  try {
    if (window.gamespage && typeof window.gamespage.refreshElements === 'function') window.gamespage.refreshElements()
    const el = document.getElementById('fetch-date')
    if (el) el.textContent = text
  } catch (e) {}
}

fetch('/My_Info/MyYTinfo.json')
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
    safeSetFetchDate(`Updated since: ${formatted}`)
  })
  .catch(() => {
    const now = new Date()
    safeSetFetchDate(`Updated since: ${formatDateToManilaShortMonth(now)}`)
  })

// Games-related functions have been moved to src/resources/js/gamespage.js
// The module is loaded dynamically and exposes its API on window.gamespage

function showSection(section) {
  const gameListEl = document.getElementById('game-list')
  const notesEl = document.getElementById('notes-section')
  const chatEl = document.getElementById('chat-section')
  const footerEl = document.querySelector('footer')
  const btnGames = document.getElementById('btn-games')
  const btnNotes = document.getElementById('btn-notes')
  const chatTrigger = document.getElementById('chat-trigger')
  const gameCountEl = document.getElementById('game-count')

  if (section === 'games') {
    history.replaceState({}, '', '/')
    if (gameListEl) gameListEl.style.display = 'block'
  } else {
    if (gameListEl) gameListEl.style.display = 'none'
  }

  if (section === 'notes') {
    history.replaceState({}, '', '/notes')
    if (notesEl) notesEl.style.display = 'block'
  } else {
    if (notesEl) notesEl.style.display = 'none'
  }

  if (section === 'chat') {
    history.replaceState({}, '', '/chat')
    chatEl.classList.add('align-top')
    chatEl.style.display = 'flex'
    if (footerEl) footerEl.style.display = 'none'
    try { if (typeof renderQuickPrompts === 'function') renderQuickPrompts() } catch (e) {}
    setTimeout(() => {
      chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      try { const input = document.getElementById('chat-input'); if (input) input.focus() } catch (e) {}
    }, 80)
  } else {
    chatEl.classList.remove('align-top')
    chatEl.style.display = 'none'
    if (footerEl) footerEl.style.display = ''
  }
  if (gameCountEl) gameCountEl.style.display = section === 'games' ? 'block' : 'none'

  if (btnGames) btnGames.classList.toggle('active', section === 'games')
  if (btnNotes) btnNotes.classList.toggle('active', section === 'notes')
  if (chatTrigger) chatTrigger.classList.toggle('active', section === 'chat')

  if (window.gamespage && window.gamespage.categoryTabs) {
    const categoryTabs = window.gamespage.categoryTabs
    if (section === 'games') {
      categoryTabs.style.display = 'flex'
      if (typeof categoryTabs._updateTop === 'function') {
        try { categoryTabs._updateTop() } catch (e) {}
        requestAnimationFrame(() => { categoryTabs.getBoundingClientRect() })
        setTimeout(() => { if (typeof categoryTabs._updateTop === 'function') categoryTabs._updateTop() }, 120)
      }
    } else {
      categoryTabs.style.display = 'none'
    }
  }
}

if (typeof window !== 'undefined') {
  try { window.showSection = showSection } catch (e) {}
}

function loadNotes() {
  const container = document.getElementById('notes-container')
  if (!container) return
  container.innerHTML = ''
  fetch('/My_Info/notes_section.txt')
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
  if (window.chatpage && typeof window.chatpage.buildSystemInstruction === 'function') return window.chatpage.buildSystemInstruction()
  return 'Concise 50 words response.'
}

async function generateInitialAssistantMessage() {
  if (window.chatpage && typeof window.chatpage.generateInitialAssistantMessage === 'function') return window.chatpage.generateInitialAssistantMessage()
}

async function sendChatMessage() {
  if (window.chatpage && typeof window.chatpage.sendChatMessage === 'function') return window.chatpage.sendChatMessage()
}

const SETTINGS_KEY = 'jay_settings'
let settings = { sounds: true, music: true, typewriter: true, typewriterSpeed: 0.015 }
if (typeof window !== 'undefined') window.settings = settings

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) settings = Object.assign(settings, JSON.parse(raw))
    if (typeof window !== 'undefined') window.settings = settings
  } catch {}
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); if (typeof window !== 'undefined') window.settings = settings } catch {}
}

async function typeWrite(container, html) {
  if (window.chatpage && typeof window.chatpage.typeWrite === 'function') return window.chatpage.typeWrite(container, html)
}

function renderChatMessages() {
  if (window.chatpage && typeof window.chatpage.renderChatMessages === 'function') return window.chatpage.renderChatMessages()
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
  const sSpeed = document.getElementById('setting-typewriter-speed')
  if (sSounds) sSounds.checked = !!settings.sounds
  if (sMusic) sMusic.checked = !!settings.music
  if (sType) sType.checked = !!settings.typewriter
  if (sSpeed) sSpeed.value = (typeof settings.typewriterSpeed === 'number' ? settings.typewriterSpeed : 0.015)
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
  if (sType) sType.addEventListener('change', () => { settings.typewriter = sType.checked; saveSettings(); if (!settings.typewriter) { if (window.chatpage && Array.isArray(window.chatpage.chatMessages)) window.chatpage.chatMessages.forEach(m => m._typed = true); renderChatMessages() } })
  const sSpeed = document.getElementById('setting-typewriter-speed')
  if (sSpeed) sSpeed.addEventListener('input', () => { settings.typewriterSpeed = Number(sSpeed.value) || 0.015; saveSettings() })
}

const userGestureToStart = () => { attemptPlayMusic(); document.removeEventListener('click', userGestureToStart) }

function initApp() {
  requestAnimationFrame(() => {
    try { bindChatUI() } catch (e) {}
    try { bindModalUI() } catch (e) {}
    try { renderQuickPrompts() } catch (e) {}
    try { generateInitialAssistantMessage() } catch (e) {}
  })

  if (window.gamespage) {
    window.gamespage.refreshElements()
    window.gamespage.attachSearchHandler()
    window.gamespage.loadGames()
  } else {
    setTimeout(() => {
      if (window.gamespage) {
        window.gamespage.refreshElements()
        window.gamespage.attachSearchHandler()
        window.gamespage.loadGames()
      }
    }, 120)
  }
  loadNotes()
  renderChatMessages()
  
  const currentPath = window.location.pathname
  if (currentPath === '/notes') {
    showSection('notes')
  } else if (currentPath === '/chat') {
    showSection('chat')
  } else if (currentPath === '/games' || currentPath === '/') {
    showSection('games')
  } else {
    showSection('games')
  }
  
  initSettings()
  attemptPlayMusic()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}

function sendQuick(text) { if (window.chatpage && typeof window.chatpage.sendQuick === 'function') return window.chatpage.sendQuick(text) }

const quickPrompts = []

function renderQuickPrompts() { if (window.chatpage && typeof window.chatpage.renderQuickPrompts === 'function') return window.chatpage.renderQuickPrompts() }

function bindChatUI() { if (window.chatpage && typeof window.chatpage.bindChatUI === 'function') return window.chatpage.bindChatUI() }

function bindModalUI() { if (window.chatpage && typeof window.chatpage.bindModalUI === 'function') return window.chatpage.bindModalUI() }

function openModal() { if (window.chatpage && typeof window.chatpage.openModal === 'function') return window.chatpage.openModal() }
function closeModal() { if (window.chatpage && typeof window.chatpage.closeModal === 'function') return window.chatpage.closeModal() }

function showApiNotification(message) { if (window.chatpage && typeof window.chatpage.showApiNotification === 'function') return window.chatpage.showApiNotification(message) }
function closeApiNotification() { if (window.chatpage && typeof window.chatpage.closeApiNotification === 'function') return window.chatpage.closeApiNotification() }

function fetchApiStatus() { if (window.chatpage && typeof window.chatpage.fetchApiStatus === 'function') return window.chatpage.fetchApiStatus() }
function startApiPolling() { if (window.chatpage && typeof window.chatpage.startApiPolling === 'function') return window.chatpage.startApiPolling() }
function stopApiPolling() { if (window.chatpage && typeof window.chatpage.stopApiPolling === 'function') return window.chatpage.stopApiPolling() }

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (window.chatpage && typeof window.chatpage.startApiPolling === 'function') try { window.chatpage.startApiPolling() } catch (e) {} } else { if (window.chatpage && typeof window.chatpage.stopApiPolling === 'function') try { window.chatpage.stopApiPolling() } catch (e) {} } })

document.addEventListener('DOMContentLoaded', () => { if (window.chatpage && typeof window.chatpage.startApiPolling === 'function') try { window.chatpage.startApiPolling() } catch (e) {} })
const marqueeTextLeft = 'JAYMANTRIX'
const marqueeTextRight = 'JAYTRIXIA'
const copies = 4

document.documentElement.style.setProperty('--fraction', (1 / copies))

function buildMarquee(containerId, text) {
  const container = document.getElementById(containerId)
  if (!container) return
  const letters = text.split('').reverse()
  for (let i = 0; i < copies; i++) {
    const block = document.createElement('div')
    block.className = 'marquee-text'
    letters.forEach(ch => {
      const s = document.createElement('span')
      s.textContent = ch
      block.appendChild(s)
    })
    const spacer = document.createElement('div')
    spacer.className = 'spacer'
    block.appendChild(spacer)
    container.appendChild(block)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    buildMarquee('marqueeLeft', marqueeTextLeft)
    buildMarquee('marqueeRight', marqueeTextRight)
  })
} else {
  buildMarquee('marqueeLeft', marqueeTextLeft)
  buildMarquee('marqueeRight', marqueeTextRight)
}
if (typeof window !== 'undefined') {
  try {
    window.showSection = showSection
    window.loadNotes = loadNotes
    window.loadGames = (...args) => { if (window.gamespage && typeof window.gamespage.loadGames === 'function') return window.gamespage.loadGames(...args) }
    window.copyToClipboard = (...args) => { if (window.gamespage && typeof window.gamespage.copyToClipboard === 'function') return window.gamespage.copyToClipboard(...args) }
  } catch (e) {}
}
