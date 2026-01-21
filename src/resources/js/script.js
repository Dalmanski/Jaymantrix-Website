function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
window.escapeHtml = escapeHtml

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

function isMobileDevice() {
  return (typeof window !== 'undefined' && window.innerWidth <= 800)
}

function findScrollContainer(el) {
  let cur = el && el.parentElement
  while (cur && cur !== document.body && cur !== document.documentElement) {
    try {
      const style = window.getComputedStyle(cur)
      const overflowY = style.overflowY
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return cur
    } catch (e) {}
    cur = cur.parentElement
  }
  return document.scrollingElement || document.documentElement
}

function scrollIntoViewWithOffset(el, offset = 0) {
  if (!el) return
  const container = findScrollContainer(el)
  if (container === document.scrollingElement || container === document.documentElement) {
    const rect = el.getBoundingClientRect()
    const targetY = window.pageYOffset + rect.top - offset
    window.scrollTo({ left: 0, top: Math.max(0, Math.round(targetY)), behavior: 'smooth' })
    return
  }
  try {
    const containerRect = container.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const currentScrollTop = container.scrollTop
    const target = currentScrollTop + (elRect.top - containerRect.top) - offset
    container.scrollTo({ top: Math.max(0, Math.round(target)), behavior: 'smooth' })
  } catch (e) {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (e2) {}
  }
}

function showSection(section) {
  const gameListEl = document.getElementById('game-list')
  const notesEl = document.getElementById('notes-section')
  const gmRecEl = document.getElementById('gm-rec-section')
  const chatEl = document.getElementById('chat-section')
  const footerEl = document.querySelector('footer')
  const btnGames = document.getElementById('btn-games')
  const btnNotes = document.getElementById('btn-notes')
  const btnGmRecord = document.getElementById('btn-gm-record')
  const chatTrigger = document.getElementById('chat-trigger')

  if (section === 'games') {
    history.replaceState({}, '', '/')
    if (gameListEl) {
      gameListEl.classList.remove('entering')
      gameListEl.style.display = 'block'
      void gameListEl.offsetWidth
      gameListEl.classList.add('entering')
    }
  } else if (gameListEl) {
    gameListEl.classList.remove('entering')
    gameListEl.style.display = 'none'
  }

  if (section === 'notes') {
    history.replaceState({}, '', '/notes')
    if (notesEl) {
      notesEl.classList.remove('entering')
      notesEl.style.display = 'block'
      void notesEl.offsetWidth
      notesEl.classList.add('entering')
    }
  } else if (notesEl) {
    notesEl.classList.remove('entering')
    notesEl.style.display = 'none'
  }

  if (section === 'game-record') {
    history.replaceState({}, '', '/game-record')
    if (gmRecEl) {
      gmRecEl.classList.remove('entering')
      gmRecEl.style.display = 'flex'
      void gmRecEl.offsetWidth
      gmRecEl.classList.add('entering')
    }
  } else if (gmRecEl) {
    gmRecEl.classList.remove('entering')
    gmRecEl.style.display = 'none'
  }

  if (section === 'chat') {
    history.replaceState({}, '', '/chat')
    if (chatEl) {
      chatEl.classList.add('align-top')
      chatEl.classList.remove('entering')
      chatEl.style.display = 'flex'
      try { if (typeof renderQuickPrompts === 'function') renderQuickPrompts() } catch (e) {}
      void chatEl.offsetWidth
      chatEl.classList.add('entering')
      try {
        const header = chatEl.querySelector('.chat-title') || chatEl
        const headerHeight = header ? header.getBoundingClientRect().height : 0
        scrollIntoViewWithOffset(header, Math.round(headerHeight + 8))
      } catch (e) {
        try { chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (e) {}
      }

      setTimeout(() => {
        try {
          if (!chatEl.dataset.initialAssistantMessageSent) {
            try { generateInitialAssistantMessage() } catch (e) {}
            chatEl.dataset.initialAssistantMessageSent = 'true'
          }
        } catch (e) {}
      }, 500)

      if (footerEl) footerEl.style.display = isMobileDevice() ? 'none' : ''
      try { updateFooterForChat() } catch (e) {}
    }
  } else if (chatEl) {
    chatEl.classList.remove('align-top')
    chatEl.classList.remove('entering')
    chatEl.style.display = 'none'
    if (footerEl) footerEl.style.display = ''
  }

  if (btnGames) btnGames.classList.toggle('active', section === 'games')
  if (btnNotes) btnNotes.classList.toggle('active', section === 'notes')
  if (btnGmRecord) btnGmRecord.classList.toggle('active', section === 'game-record')
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

  try { if (typeof window.updateDepthIndicatorNow === 'function') window.updateDepthIndicatorNow() } catch (e) {}
}

function updateFooterForChat() {
  try {
    const footerEl = document.querySelector('footer')
    const chatEl = document.getElementById('chat-section')
    if (!footerEl || !chatEl) return
    if (chatEl.style.display !== 'none' && chatEl.classList.contains('align-top')) {
      footerEl.style.display = (window.innerWidth <= 800) ? 'none' : ''
    }
  } catch (e) {}
}

window.addEventListener('resize', () => { try { updateFooterForChat() } catch (e) {} })

if (typeof window !== 'undefined') {
  try { window.showSection = showSection } catch (e) {}
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
let settings = { sounds: true, music: true, typewriter: false, typewriterSpeed: 0.015, musicVolume: 0.65 }
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
  bg.volume = (typeof settings.musicVolume === 'number') ? settings.musicVolume : 0.65
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
  const sVolume = document.getElementById('setting-music-volume')
  if (sSounds) sSounds.checked = !!settings.sounds
  if (sMusic) sMusic.checked = !!settings.music
  if (sType) sType.checked = !!settings.typewriter
  if (sSpeed) sSpeed.value = (typeof settings.typewriterSpeed === 'number' ? settings.typewriterSpeed : 0.015)
  if (sVolume) sVolume.value = (typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.65)
  const bg = document.getElementById('bg-music')
  if (bg) {
    if (settings.music) {
      bg.volume = (typeof settings.musicVolume === 'number') ? settings.musicVolume : 0.65
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
  const sSpeedInput = document.getElementById('setting-typewriter-speed')
  const sVolume = document.getElementById('setting-music-volume')

  if (sSounds) sSounds.addEventListener('change', () => { settings.sounds = sSounds.checked; saveSettings() })
  if (sMusic) sMusic.addEventListener('change', () => { settings.music = sMusic.checked; saveSettings(); applySettingsToUI() })
  if (sType) sType.addEventListener('change', () => { settings.typewriter = sType.checked; saveSettings(); if (!settings.typewriter) { if (window.chatpage && Array.isArray(window.chatpage.chatMessages)) window.chatpage.chatMessages.forEach(m => m._typed = true); renderChatMessages() } })
  if (sSpeedInput) sSpeedInput.addEventListener('input', () => { settings.typewriterSpeed = Number(sSpeedInput.value) || 0.015; saveSettings() })

  if (sVolume) {
    sVolume.addEventListener('input', () => {
      const val = Number(sVolume.value)
      settings.musicVolume = isNaN(val) ? 0.65 : val
      saveSettings()
      const bg = document.getElementById('bg-music')
      if (bg) bg.volume = settings.musicVolume
    })
    sVolume.addEventListener('change', () => {
      const val = Number(sVolume.value)
      settings.musicVolume = isNaN(val) ? 0.65 : val
      saveSettings()
    })
  }

  let hoverCloseTimeout = null
  function clearHoverClose() {
    if (hoverCloseTimeout) {
      clearTimeout(hoverCloseTimeout)
      hoverCloseTimeout = null
    }
  }

  function openPanelByHover() {
    clearHoverClose()
    if (panel) {
      panel.classList.add('open')
      panel.setAttribute('aria-hidden', 'false')
    }
  }

  function scheduleClosePanel() {
    clearHoverClose()
    hoverCloseTimeout = setTimeout(() => {
      if (panel) {
        panel.classList.remove('open')
        panel.setAttribute('aria-hidden', 'true')
      }
    }, 240)
  }

  if (btn) {
    btn.addEventListener('mouseenter', () => {
      openPanelByHover()
    })
    btn.addEventListener('mouseleave', () => {
      scheduleClosePanel()
    })
    btn.addEventListener('touchstart', () => {
      if (panel) {
        panel.classList.toggle('open')
        panel.setAttribute('aria-hidden', panel.classList.contains('open') ? 'false' : 'true')
      }
    }, { passive: true })
  }

  if (panel) {
    panel.addEventListener('mouseenter', () => {
      clearHoverClose()
    })
    panel.addEventListener('mouseleave', () => {
      scheduleClosePanel()
    })
  }
}

const userGestureToStart = () => { attemptPlayMusic(); document.removeEventListener('click', userGestureToStart) }

function initApp() {
  requestAnimationFrame(() => {
    try { bindChatUI() } catch (e) {}
    try { bindModalUI() } catch (e) {}
    try { renderQuickPrompts() } catch (e) {}
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
  try { loadNotes() } catch (e) {}
  try { renderChatMessages() } catch (e) {}
  
  const currentPath = window.location.pathname
  if (currentPath === '/notes') {
    showSection('notes')
  } else if (currentPath === '/chat') {
    showSection('chat')
  } else if (currentPath === '/games' || currentPath === '/') {
    showSection('games')
  } else if (currentPath === '/game-record') {
    showSection('game-record')
  } else {
    showSection('games')
  }
  
  initSettings()
  attemptPlayMusic()
  initBottomGradientDepthIndicator()
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

if (typeof window !== 'undefined') {
  try {
    window.showSection = showSection
    window.loadGames = (...args) => { if (window.gamespage && typeof window.gamespage.loadGames === 'function') return window.gamespage.loadGames(...args) }
    window.copyToClipboard = (...args) => { if (window.gamespage && typeof window.gamespage.copyToClipboard === 'function') return window.gamespage.copyToClipboard(...args) }
  } catch (e) {}
}

function initBottomGradientDepthIndicator() {
  const gradient = document.getElementById('bottom-gradient')
  const depth = document.getElementById('depth-indicator')
  if (!gradient || !depth) return

  let rafId = null
  let hideTimeout = null
  let lastScrollAt = 0
  let rafRunning = false
  let isDraggingScrollbar = false
  let dynamicMouseDownAdded = false

  function docHeight() {
    return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight || 0)
  }

  function viewportHeight() {
    return window.innerHeight || document.documentElement.clientHeight || 0
  }

  function maxScroll() {
    const m = docHeight() - viewportHeight()
    return m > 0 ? m : 0
  }

  function atBottom(threshold = 4) {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    return (viewportHeight() + scrollY) >= (docHeight() - threshold)
  }

  function reversedDepth(scrollY) {
    const m = maxScroll()
    return Math.max(0, Math.round(m - (scrollY || 0)))
  }

  function updateDepthText(scrollY) {
    const val = reversedDepth(scrollY)
    depth.textContent = `Depth: ${val} px`
  }

  function showDepth() {
    depth.classList.add('visible')
    depth.setAttribute('aria-hidden', 'false')
  }

  function hideDepth() {
    depth.classList.remove('visible')
    depth.setAttribute('aria-hidden', 'true')
  }

  function showGradient() {
    gradient.classList.remove('hidden')
    gradient.classList.add('visible')
    gradient.setAttribute('aria-hidden', 'false')
    try {
      gradient.style.transition = 'opacity 240ms ease'
      gradient.style.opacity = '1'
    } catch (e) {}
  }

  function hideGradient() {
    try {
      gradient.style.transition = 'opacity 180ms ease'
      gradient.style.opacity = '0'
      gradient.setAttribute('aria-hidden', 'true')
      setTimeout(() => {
        try {
          gradient.classList.remove('visible')
          gradient.classList.add('hidden')
        } catch (e) {}
      }, 220)
    } catch (e) {
      gradient.classList.remove('visible')
      gradient.classList.add('hidden')
      gradient.setAttribute('aria-hidden', 'true')
    }
  }

  function clearHideTimeout() {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
  }

  function scheduleHide() {
    clearHideTimeout()
    hideTimeout = setTimeout(() => {
      hideDepth()
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      const depthVal = reversedDepth(scrollY)
      if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
      else showGradient()
    }, 700)
  }

  function rafLoop() {
    rafRunning = true
    rafId = requestAnimationFrame(rafLoop)
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    updateDepthText(scrollY)
    showDepth()
    const depthVal = reversedDepth(scrollY)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
    if (performance.now() - lastScrollAt > 250 && !isDraggingScrollbar) {
      cancelAnimationFrame(rafId)
      rafId = null
      rafRunning = false
      scheduleHide()
    }
  }

  function immediateUpdateAndShow(scrollY) {
    lastScrollAt = performance.now()
    updateDepthText(scrollY)
    showDepth()
    const depthVal = reversedDepth(scrollY)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
    if (!rafRunning) rafLoop()
  }

  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    immediateUpdateAndShow(scrollY)
  }

  function onWheel() {
    onScroll()
  }

  function onKeyScroll() {
    onScroll()
  }

  function scrollbarWidthForHtml() {
    return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
  }

  function scrollbarWidthForBody() {
    const bodyClientWidth = document.body && document.body.clientWidth ? document.body.clientWidth : document.documentElement.clientWidth
    return Math.max(0, window.innerWidth - bodyClientWidth)
  }

  function pointerOverScrollbar(clientX) {
    const s1 = scrollbarWidthForHtml()
    const s2 = scrollbarWidthForBody()
    const x = (typeof clientX === 'number') ? clientX : -1
    if (s1 > 0 && x >= (window.innerWidth - s1 - 2)) return true
    if (s2 > 0 && x >= (window.innerWidth - s2 - 2)) return true
    return false
  }

  function addDynamicMouseDown(clientX) {
    const over = pointerOverScrollbar(clientX)
    if (over && !dynamicMouseDownAdded) {
      window.addEventListener('mousedown', onMouseDown, { passive: true })
      dynamicMouseDownAdded = true
    } else if (!over && dynamicMouseDownAdded) {
      try { window.removeEventListener('mousedown', onMouseDown, { passive: true }) } catch (e) {}
      dynamicMouseDownAdded = false
    }
  }

  function startDragMode() {
    clearHideTimeout()
    isDraggingScrollbar = true
    lastScrollAt = performance.now()
    updateDepthText(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    showDepth()
    const depthVal = reversedDepth(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
    if (!rafRunning) rafLoop()
  }

  function stopDragModeAndHide() {
    if (!isDraggingScrollbar) return
    isDraggingScrollbar = false
    hideDepth()
    const depthVal = reversedDepth(window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
  }

  function onMouseDown(e) {
    const clientX = (typeof e.clientX === 'number') ? e.clientX : -1
    if (pointerOverScrollbar(clientX)) {
      startDragMode()
    } else {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      lastScrollAt = performance.now()
      updateDepthText(scrollY)
      showDepth()
      const depthVal = reversedDepth(scrollY)
      if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
      else showGradient()
      if (!rafRunning) rafLoop()
      scheduleHide()
    }
  }

  function onMouseUp(e) {
    const clientX = (typeof e.clientX === 'number') ? e.clientX : -1
    if (isDraggingScrollbar || pointerOverScrollbar(clientX)) {
      stopDragModeAndHide()
      return
    }
    scheduleHide()
  }

  function onMouseMove(e) {
    const clientX = (typeof e.clientX === 'number') ? e.clientX : -1
    const buttons = e.buttons || 0
    addDynamicMouseDown(clientX)
    if (buttons !== 0 && pointerOverScrollbar(clientX)) {
      if (!isDraggingScrollbar) startDragMode()
      const sy = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      immediateUpdateAndShow(sy)
      return
    }
    if (isDraggingScrollbar && buttons === 0) {
      stopDragModeAndHide()
      return
    }
    if (pointerOverScrollbar(clientX)) {
      const sy = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      immediateUpdateAndShow(sy)
      scheduleHide()
      return
    }
  }

  function onPointerMove(e) {
    onMouseMove(e)
  }

  function onTouchStart() {
    clearHideTimeout()
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    lastScrollAt = performance.now()
    updateDepthText(scrollY)
    showDepth()
    const depthVal = reversedDepth(scrollY)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
    if (!rafRunning) rafLoop()
    scheduleHide()
  }

  function onTouchEnd() {
    scheduleHide()
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('wheel', onWheel, { passive: true })
  window.addEventListener('keydown', onKeyScroll, { passive: true })
  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('mouseup', onMouseUp, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('mouseleave', function() {
    try { if (dynamicMouseDownAdded) { window.removeEventListener('mousedown', onMouseDown, { passive: true }); dynamicMouseDownAdded = false } } catch (e) {}
    if (isDraggingScrollbar) stopDragModeAndHide()
  }, { passive: true })

  window.addEventListener('resize', () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    const depthVal = reversedDepth(scrollY)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
    try { if (dynamicMouseDownAdded && !pointerOverScrollbar(-1)) { window.removeEventListener('mousedown', onMouseDown, { passive: true }); dynamicMouseDownAdded = false } } catch (e) {}
  })

  setTimeout(() => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    const depthVal = reversedDepth(scrollY)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) {
      hideGradient()
      hideDepth()
    } else {
      showGradient()
      hideDepth()
    }
  }, 120)

  function forceUpdateNow() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
    lastScrollAt = performance.now()
    updateDepthText(scrollY)
    const depthVal = reversedDepth(scrollY)
    if (docHeight() <= viewportHeight() || atBottom() || depthVal < 50) hideGradient()
    else showGradient()
    if (!rafRunning) rafLoop()
  }

  window.updateDepthIndicatorNow = function() {
    try {
      forceUpdateNow()
    } catch (e) {}
  }
}

export async function init() {
  try {
    const response = await fetch('/My_Info/MyYTinfo.json')
    const data = await response.json()
    const iconUrl = data.icon || 'https://via.placeholder.com/100x100?text=No+Icon'
    const fav = document.getElementById('dynamic-favicon')
    if (fav) fav.href = iconUrl
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
  } catch (e) {
    const now = new Date()
    safeSetFetchDate(`Updated since: ${formatDateToManilaShortMonth(now)}`)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { buildMarquee('marqueeLeft', marqueeTextLeft); buildMarquee('marqueeRight', marqueeTextRight) } catch (e) {}
    }, { once: true })
  } else {
    try { buildMarquee('marqueeLeft', marqueeTextLeft); buildMarquee('marqueeRight', marqueeTextRight) } catch (e) {}
  }

  try { initApp() } catch (e) {}

  try {
    if (document.readyState !== 'loading') {
      if (window.chatpage && typeof window.chatpage.startApiPolling === 'function') try { window.chatpage.startApiPolling() } catch (e) {}
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (window.chatpage && typeof window.chatpage.startApiPolling === 'function') try { window.chatpage.startApiPolling() } catch (e) {}
      }, { once: true })
    }
  } catch (e) {}

  try {
    document.addEventListener('click', userGestureToStart, { once: true })
  } catch (e) {}
}

export default init
