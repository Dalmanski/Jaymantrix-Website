// script.js
let jsonGames = []
let forgottenGames = []
let allGames = []

let gameList = null
let gameListContent = null
let categoryTabs = null
let gameCount = null
let searchInput = null
let fetchDateEl = null

function refreshElements() {
  gameList = document.getElementById('game-list')
  gameListContent = document.getElementById('game-list-content') || gameList
  categoryTabs = document.getElementById('category-tabs')
  gameCount = document.getElementById('game-count')
  searchInput = document.getElementById('searchInput')
  fetchDateEl = document.getElementById('fetch-date')
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

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
    refreshElements()
    if (fetchDateEl) fetchDateEl.textContent = text
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

function loadGames() {
  refreshElements()
  fetch('/My_Info/MyGames.json')
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
      refreshElements()
      if (gameListContent) gameListContent.innerHTML = `<p style="color:red;">⚠️ ${escapeHtml(err.message)}</p>`
    })
}

function loadForgottenAccounts() {
  refreshElements()
  return fetch('/My_Info/forget_acc.txt')
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
      refreshElements()
      if (gameListContent) gameListContent.innerHTML += `<p style="color:red;">⚠️ ${escapeHtml(err.message)}</p>`
    })
}

function getGameKey(game) {
  return (game.playstore_id ?? game.id ?? game.user_id ?? game.name ?? JSON.stringify(game)).toString()
}

function renderGames(gameData) {
  refreshElements()
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
  const preparedCategories = []
  let html = ''
  categories.forEach((category) => {
    let cards = ''
    const safeCategoryIdForGroup = category.replace(/\s+/g, '_')
    preparedCategories.push({ name: category, id: `cat-${safeCategoryIdForGroup}` })
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
          <div class="game-card" data-copy="${escapeHtml(copyValue)}" data-index="${index}" data-safe="${safeCatId}">
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
      <div class="category-section" id="cat-${safeCategoryIdForGroup}">
        <h2 class="category-title" data-cat-name="${escapeHtml(category)}">${escapeHtml(category)} Games</h2>
        <div class="game-grid">${cards}</div>
      </div>`
  })
  if (gameListContent) gameListContent.innerHTML = html

  const cards = gameListContent ? Array.from(gameListContent.querySelectorAll('.game-card')) : []
  cards.forEach((card) => {
    card.addEventListener('click', (ev) => {
      const toCopy = card.dataset.copy || ''
      const idx = card.dataset.index || 0
      const safe = card.dataset.safe || ''
      copyToClipboard(toCopy, idx, safe)
    })
  })

  buildCategoryTabs(preparedCategories)
  const countA = Array.isArray(jsonGames) ? jsonGames.length : 0
  const countB = Array.isArray(forgottenGames) ? forgottenGames.length : 0
  if (gameCount) gameCount.textContent = `Games Found: ${countA + countB}`
}

function normalizeLabel(text) {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim().replace(/\bGames\b$/i, '').trim().toLowerCase()
}

function safeCenterScroll(container, el, behavior = 'smooth') {
  if (!container || !el) return
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const containerCenter = containerRect.left + containerRect.width / 2
  const elCenter = elRect.left + elRect.width / 2
  const delta = elCenter - containerCenter
  const target = Math.round(container.scrollLeft + delta)
  const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth)
  const left = Math.max(0, Math.min(target, maxScroll))
  if (Math.abs(container.scrollLeft - left) < 1) {
    container.scrollLeft = left
  } else {
    container.scrollTo({ left, behavior })
  }
}

let categoryObserver = null

function buildCategoryTabs(categories) {
  refreshElements()
  if (!categoryTabs) return
  categoryTabs.innerHTML = ''
  categories.forEach((c) => {
    const btn = document.createElement('button')
    btn.className = 'category-tab'
    btn.textContent = c.name + ' Games'
    btn.dataset.target = c.id
    btn.addEventListener('click', (ev) => {
      const tabText = (btn.textContent || '').trim()
      const normalizedTab = normalizeLabel(tabText)
      const titleElements = Array.from((gameListContent || document).querySelectorAll('.category-title'))
      let targetTitle = titleElements.find(el => normalizeLabel(el.textContent || '') === normalizedTab)
      if (!targetTitle) {
        const section = document.getElementById(btn.dataset.target)
        if (section) targetTitle = section.querySelector('.category-title') || section
      }
      categoryTabs.querySelectorAll('.category-tab').forEach((b) => b.classList.toggle('active', b === btn))
      safeCenterScroll(categoryTabs, btn, 'smooth')
      if (!targetTitle) return
      targetTitle.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
      const header = document.querySelector('header')
      const headerRect = header ? header.getBoundingClientRect() : { bottom: 0, height: 0 }
      const tabsHeight = categoryTabs.getBoundingClientRect().height || 0
      const offset = (headerRect.bottom > 0 ? headerRect.bottom : 0) + tabsHeight + 8
      setTimeout(() => {
        window.scrollBy({ left: 0, top: -offset, behavior: 'smooth' })
      }, 120)
    })
    categoryTabs.appendChild(btn)
  })
  function updateTop() {
    const header = document.querySelector('header')
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0
    const topVal = headerBottom > 0 ? headerBottom + 8 : 0
    requestAnimationFrame(() => {
      categoryTabs.style.top = `${topVal}px`
      void categoryTabs.offsetHeight
    })
  }
  updateTop()
  setTimeout(updateTop, 80)
  setTimeout(updateTop, 300)
  window.addEventListener('resize', updateTop)
  window.addEventListener('scroll', updateTop)
  categoryTabs._updateTop = updateTop
  if (categoryObserver) {
    try { categoryObserver.disconnect() } catch (e) {}
    categoryObserver = null
  }
  categoryObserver = new IntersectionObserver((entries) => {
    let best = null
    entries.forEach((e) => {
      if (!best || e.intersectionRatio > best.intersectionRatio) best = e
    })
    if (best && best.isIntersecting) {
      const id = best.target.id
      const titleEl = best.target.querySelector('.category-title')
      const titleNormalized = titleEl ? normalizeLabel(titleEl.textContent || '') : ''
      categoryTabs.querySelectorAll('.category-tab').forEach((b) => {
        const btnNorm = normalizeLabel(b.textContent || '')
        const matchById = b.dataset.target === id
        const matchByText = btnNorm && titleNormalized && btnNorm === titleNormalized
        b.classList.toggle('active', matchById || matchByText)
      })
      const activeBtn = Array.from(categoryTabs.querySelectorAll('.category-tab')).find(b => b.classList.contains('active'))
      if (activeBtn) {
        safeCenterScroll(categoryTabs, activeBtn, 'smooth')
      }
    }
  }, { root: null, rootMargin: '-10% 0px -60% 0px', threshold: [0.25, 0.5, 0.75] })
  categories.forEach((c) => {
    const s = document.getElementById(c.id)
    if (s) categoryObserver.observe(s)
  })
  const first = categoryTabs.querySelector('.category-tab')
  if (first) first.classList.add('active')
  if (first) requestAnimationFrame(() => safeCenterScroll(categoryTabs, first, 'auto'))
}

function copyToClipboard(text, index, safeCategoryId) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
      }).catch(() => {
        fallbackCopy(text)
      })
    } else {
      fallbackCopy(text)
    }
  } catch (e) {
    fallbackCopy(text)
  }
  const el = document.getElementById(`copied-${safeCategoryId}-${index}`)
  if (!el) return
  const parent = el.parentElement
  if (!parent) return
  parent.classList.add('show-copied')
  setTimeout(() => {
    parent.classList.remove('show-copied')
  }, 1200)
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  } catch (e) {
    try { console.warn('Copy to clipboard failed', e) } catch (e) {}
  }
}

function attachSearchHandler() {
  refreshElements()
  if (!searchInput) return
  try { searchInput.removeEventListener('input', searchInput._handler) } catch (e) {}
  const handler = () => {
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
  }
  searchInput.addEventListener('input', handler)
  searchInput._handler = handler
}

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
    try {
      if (window.chatpage && (!Array.isArray(window.chatpage.chatMessages) || window.chatpage.chatMessages.length === 0)) {
        if (typeof generateInitialAssistantMessage === 'function') generateInitialAssistantMessage()
      }
    } catch (e) {}
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

  if (categoryTabs) {
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

  refreshElements()
  attachSearchHandler()
  loadGames()
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
    window.copyToClipboard = copyToClipboard
    window.loadGames = loadGames
    window.loadNotes = loadNotes
  } catch (e) {}
}
