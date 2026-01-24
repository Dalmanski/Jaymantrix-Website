if (typeof window !== 'undefined') {
  window.addEventListener('load', function() {
    setTimeout(function() {
      var chatEl = document.getElementById('chat-section');
      if (chatEl && window.innerWidth <= 800 && chatEl.style.display !== 'none') {
        chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  });
}
if (typeof window !== 'undefined') {
  window.goToMyGameWeb = function() {
    if (window.location.pathname !== '/my-game-web') {
      window.history.pushState({}, '', '/my-game-web');
      import('./my-web-section.js').then(() => {
        if (window.showMyWebSection) window.showMyWebSection();
      });
    } else {
      import('./my-web-section.js').then(() => {
        if (window.showMyWebSection) window.showMyWebSection();
      });
    }
    if (window.closeLeftSidebar) window.closeLeftSidebar();
  }
  function handleRoute() {
    if (window.location.pathname === '/my-game-web') {
      import('./my-web-section.js').then(() => {
        if (window.showMyWebSection) window.showMyWebSection();
      });
    }
  }
  window.addEventListener('popstate', handleRoute);
  handleRoute();
}
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
  const myWebEl = document.getElementById('my-web-section')
  const footerEl = document.querySelector('footer')
  const btnGames = document.getElementById('btn-games')
  const btnNotes = document.getElementById('btn-notes')
  const btnGmRecord = document.getElementById('btn-gm-record')
  const chatTrigger = document.getElementById('chat-trigger')
  if (myWebEl) myWebEl.style.display = 'none';

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
        if (window.innerWidth <= 800) {
          setTimeout(() => {
            scrollIntoViewWithOffset(header, Math.round(headerHeight + 8))
          }, 300)
        } else {
          scrollIntoViewWithOffset(header, Math.round(headerHeight + 8))
        }
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
  if (panel) {
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (panel) { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true') } } })
    document.addEventListener('click', (e) => { if (window._preventSettingsAutoClose) { window._preventSettingsAutoClose = false; return } if (panel && panel.classList && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true') } })
  }

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

  const prevBtn = document.getElementById('music-prev')
  const nextBtn = document.getElementById('music-next')
  const titleEl = document.getElementById('music-title')
  const bg = document.getElementById('bg-music')

  window._musicList = window._musicList || []
  window._musicIndex = 0


  async function loadMusicManifest() {
    try {
      const resp = await fetch('/assets/audio/music/manifest.json')
      if (!resp.ok) throw new Error('no manifest')
      let list = await resp.json()
      if (Array.isArray(list) && list.length) {
        list = list.map(x => {
          if (typeof x === 'string' && (x.startsWith('http') || x.startsWith('/'))) {
            const parts = x.split('/');
            return parts[parts.length - 1];
          }
          return x;
        });
        window._musicList = list;
        window._musicIndex = 0;
        updateMusicTitle();
      }
    } catch (e) {
      if (!window._musicList.length && bg && bg.src) {
        window._musicList = [bg.src]
        window._musicIndex = 0
        updateMusicTitle()
      }
    }
  }

  function getMusicSrcByIdx(idx) {
    const list = window._musicList || [];
    if (!list.length) return '';
    const file = list[idx] || '';
    if (!file) return '';
    if (file.startsWith('http') || file.startsWith('/')) return file;
    return '/assets/audio/music/' + file;
  }

  function updateMusicTitle() {
    const list = window._musicList || [];
    const i = window._musicIndex || 0;
    const src = list[i] || '';
    const name = src.split('/').pop() || 'No music';
    if (titleEl) titleEl.innerHTML = `<span>${escapeHtml(name)}</span>`;
    if (bg && src) {
      const realSrc = getMusicSrcByIdx(i);
      const cur = bg.src || '';
      if (cur !== realSrc) {
        bg.src = realSrc;
        bg.load && bg.load();
        if (settings.music) {
          setTimeout(() => { bg.play && bg.play(); }, 50);
        }
      }
    }
  }

  function nextMusic() {
    const list = window._musicList || [];
    if (!list.length) return;
    window._musicIndex = (window._musicIndex + 1) % list.length;
    updateMusicTitle();
  }

  function prevMusic() {
    const list = window._musicList || [];
    if (!list.length) return;
    window._musicIndex = (window._musicIndex - 1 + list.length) % list.length;
    updateMusicTitle();
  }

  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevMusic(); window._preventSettingsAutoClose = true })
  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextMusic(); window._preventSettingsAutoClose = true })

  loadMusicManifest()
}

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
  if (currentPath === '/my-game-web') {
    import('./my-web-section.js').then(() => {
      if (window.showMyWebSection) window.showMyWebSection();
    });
  } else if (currentPath === '/notes') {
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
  bindLeftSidebar()
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

if (typeof window !== 'undefined') {
  try {
    window.showSection = showSection
    window.loadGames = (...args) => { if (window.gamespage && typeof window.gamespage.loadGames === 'function') return window.gamespage.loadGames(...args) }
    window.copyToClipboard = (...args) => { if (window.gamespage && typeof window.gamespage.copyToClipboard === 'function') return window.gamespage.copyToClipboard(...args) }
  } catch (e) {}
}

let designModule = null

async function ensureDesignModule() {
  if (designModule) return designModule
  try {
    const mod = await import('./script-design.js')
    designModule = mod
    return mod
  } catch (e) {
    return null
  }
}

async function initBottomGradientDepthIndicator() {
  try {
    const mod = await ensureDesignModule()
    if (mod && typeof mod.initBottomGradientDepthIndicator === 'function') {
      mod.initBottomGradientDepthIndicator()
      return
    }
  } catch (e) {}
}

function initBottomGradientDepthIndicatorFallback() {
  try {
    if (typeof window.updateDepthIndicatorNow !== 'function') {
      window.updateDepthIndicatorNow = function() {}
    }
  } catch (e) {}
}

let leftSidebarHoverTimeout = null

function openLeftSidebar() {
  try {
    const sb = document.getElementById('left-sidebar')
    const overlay = document.getElementById('left-sidebar-overlay')
    if (sb) {
      sb.classList.add('open')
      sb.setAttribute('aria-hidden', 'false')
    }
    if (overlay) {
      overlay.classList.add('visible')
      overlay.setAttribute('aria-hidden', 'false')
    }
    document.body.classList.add('left-sidebar-open')
  } catch (e) {}
}

function closeLeftSidebar() {
  try {
    const sb = document.getElementById('left-sidebar')
    const overlay = document.getElementById('left-sidebar-overlay')
    if (sb) {
      sb.classList.remove('open')
      sb.setAttribute('aria-hidden', 'true')
    }
    if (overlay) {
      overlay.classList.remove('visible')
      overlay.setAttribute('aria-hidden', 'true')
    }
    document.body.classList.remove('left-sidebar-open')
  } catch (e) {}
}

function toggleLeftSidebar() {
  try {
    const sb = document.getElementById('left-sidebar')
    if (!sb) return
    if (sb.classList.contains('open')) closeLeftSidebar()
    else openLeftSidebar()
  } catch (e) {}
}

function clearLeftHoverTimeout() {
  if (leftSidebarHoverTimeout) {
    clearTimeout(leftSidebarHoverTimeout)
    leftSidebarHoverTimeout = null
  }
}

function scheduleLeftClose() {
  clearLeftHoverTimeout()
  leftSidebarHoverTimeout = setTimeout(() => {
    closeLeftSidebar()
  }, 240)
}

function bindLeftSidebar() {
  try {
    const toggle = document.getElementById('menu-toggle')
    const sb = document.getElementById('left-sidebar')
    const overlay = document.getElementById('left-sidebar-overlay')
    const closeBtn = document.getElementById('left-sidebar-close')
    const navItems = Array.from(document.querySelectorAll('.left-nav-item'))

    if (toggle) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation()
        toggleLeftSidebar()
      })
      toggle.addEventListener('touchstart', (e) => {
        e.stopPropagation()
        toggleLeftSidebar()
      }, { passive: true })
      if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        toggle.addEventListener('mouseenter', () => {
          openLeftSidebar()
        })
        toggle.addEventListener('mouseleave', () => {
          scheduleLeftClose()
        })
      }
    }

    if (sb) {
      sb.addEventListener('mouseenter', () => {
        clearLeftHoverTimeout()
      })
      sb.addEventListener('mouseleave', () => {
        scheduleLeftClose()
      })
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        closeLeftSidebar()
      }, { passive: true })
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeLeftSidebar()
      })
    }

    if (navItems && navItems.length) {
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          navItems.forEach(n => n.classList.remove('active'))
          item.classList.add('active')
        })
      })
      const current = document.querySelector('.left-nav-item[data-section="games"]')
      if (current) {
        navItems.forEach(n => n.classList.remove('active'))
        current.classList.add('active')
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLeftSidebar()
    })
  } catch (e) {}
}

export async function init() {
  try {
    const response = await fetch('/My_Info/MyYTinfo.json')
    const data = await response.json()
    const iconUrl = data.icon || 'https://www.freeiconspng.com/thumbs/no-image-icon/no-image-icon-6.png'
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

  async function buildMarqueesWhenReady() {
    const mod = await ensureDesignModule()
    try {
      if (mod) {
        if (typeof mod.default === 'function') try { mod.default() } catch (e) {}
        if (typeof mod.buildMarquee === 'function') {
          const left = typeof mod.marqueeTextLeft === 'string' ? mod.marqueeTextLeft : 'JAYMANTRIX'
          const right = typeof mod.marqueeTextRight === 'string' ? mod.marqueeTextRight : 'JAYTRIXIA'
          try { mod.buildMarquee('marqueeLeft', left) } catch (e) {}
          try { mod.buildMarquee('marqueeRight', right) } catch (e) {}
        }
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try { buildMarqueesWhenReady() } catch (e) {}
    }, { once: true })
  } else {
    try { buildMarqueesWhenReady() } catch (e) {}
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
