// script.js
let closeSidebarTimeout = null
let bgRotationStarted = false
let bgRotationTimer = null
let bgSwapTimer = null

function getBgImageUrls() {
  try {
    const modules = import.meta.glob('/src/assets/img/BG/*.{gif,png,jpg,jpeg,webp,svg,avif}', {
      eager: true,
      import: 'default'
    })
    return Object.keys(modules).sort().map(key => modules[key]).filter(Boolean)
  } catch (e) {
    return []
  }
}

function initBackgroundRotation() {
  if (bgRotationStarted) return
  bgRotationStarted = true

  const baseLayer = document.querySelector('.bg-gif')
  if (!baseLayer) return

  const imageUrls = getBgImageUrls()
  if (!imageUrls.length) return

  const altLayer = document.createElement('div')
  altLayer.className = 'bg-gif bg-gif-alt'
  altLayer.style.opacity = '0'
  document.body.prepend(altLayer)

  let activeLayer = baseLayer
  let inactiveLayer = altLayer
  let currentIndex = 0
  let transitioning = false

  const preload = (src) => {
    const img = new Image()
    img.src = src
  }

  const setLayerImage = (layer, src) => {
    layer.style.backgroundImage = `url("${src}")`
  }

  imageUrls.forEach(preload)

  setLayerImage(activeLayer, imageUrls[currentIndex])
  setLayerImage(inactiveLayer, imageUrls[(currentIndex + 1) % imageUrls.length])

  const rotate = () => {
    if (transitioning || imageUrls.length < 2) return
    transitioning = true

    const nextIndex = (currentIndex + 1) % imageUrls.length
    const afterNextIndex = (nextIndex + 1) % imageUrls.length

    setLayerImage(inactiveLayer, imageUrls[nextIndex])
    inactiveLayer.style.opacity = '1'
    activeLayer.style.opacity = '0'

    if (bgSwapTimer) clearTimeout(bgSwapTimer)
    bgSwapTimer = setTimeout(() => {
      const oldActive = activeLayer
      activeLayer = inactiveLayer
      inactiveLayer = oldActive
      setLayerImage(inactiveLayer, imageUrls[afterNextIndex])
      inactiveLayer.style.opacity = '0'
      currentIndex = nextIndex
      transitioning = false
    }, 1500)
  }

  if (bgRotationTimer) clearInterval(bgRotationTimer)
  bgRotationTimer = setInterval(rotate, 10000)
}

function setupYTSearchInputListener() {
  const headerSearch = document.getElementById('searchInput')
  let t
  if (headerSearch) {
    const clearBtn = document.createElement('button')
    clearBtn.className = 'search-clear-btn'
    clearBtn.textContent = '✕'
    clearBtn.type = 'button'
    clearBtn.setAttribute('aria-label', 'Clear search')
    
    if (headerSearch.parentElement) {
      if (getComputedStyle(headerSearch.parentElement).position === 'static') {
        headerSearch.parentElement.style.position = 'relative'
      }
      headerSearch.parentElement.appendChild(clearBtn)
    }
    
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      headerSearch.value = ''
      clearBtn.style.display = 'none'
      headerSearch.focus()
      headerSearch.dispatchEvent(new Event('input', { bubbles: true }))
    })
    
    headerSearch.addEventListener('input', () => {
      clearBtn.style.display = headerSearch.value.length > 0 ? 'block' : 'none'
      clearTimeout(t)
      t = setTimeout(() => {
        if (window.showYTvidSection) window.showYTvidSection()
      }, 300)
    })
    
    clearBtn.style.display = headerSearch.value.length > 0 ? 'block' : 'none'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupYTSearchInputListener)
} else {
  setupYTSearchInputListener()
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', function () {
    setTimeout(function () {
      var chatEl = document.getElementById('chat-section')
      if (chatEl && window.innerWidth <= 800 && chatEl.style.display !== 'none') {
        chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setTimeout(function () {
          if (typeof window.updateDepthIndicatorNow === 'function') window.updateDepthIndicatorNow()
        }, 350)
      }
    }, 500)
  })
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
window.escapeHtml = escapeHtml

function formatDateToManilaShortMonth(d) {
  try {
    const opts = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    }
    return new Intl.DateTimeFormat('en-US', opts).format(d)
  } catch (e) {
    const hours = d.getHours()
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const hour12 = hours % 12 === 0 ? 12 : hours % 12
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

function updateFooterForChat() {
  try {
    const footerEl = document.querySelector('footer')
    const chatEl = document.getElementById('chat-section')
    if (!footerEl || !chatEl) return
    if (chatEl.style.display !== 'none' && chatEl.classList.contains('align-top')) {
      footerEl.style.display = window.innerWidth <= 800 ? 'none' : ''
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  window.updateFooterForChat = updateFooterForChat;
}

window.addEventListener('resize', () => {
  try {
    updateFooterForChat()
  } catch (e) {}
})

if (typeof window !== 'undefined') {
  try {
    window.loadGames = (...args) => {
      if (window.gamespage && typeof window.gamespage.loadGames === 'function') return window.gamespage.loadGames(...args)
    }
  } catch (e) {}
  try {
    window.copyToClipboard = (...args) => {
      if (window.gamespage && typeof window.gamespage.copyToClipboard === 'function') return window.gamespage.copyToClipboard(...args)
    }
  } catch (e) {}
}


const SETTINGS_KEY = 'jay_settings'
let settings = { sounds: true, music: true, typewriter: false, typewriterSpeed: 0.015, musicVolume: 0.65 }
if (typeof window !== 'undefined') window.settings = settings

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) settings = Object.assign(settings, JSON.parse(raw))
    if (typeof window !== 'undefined') window.settings = settings
  } catch (e) {}
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    if (typeof window !== 'undefined') window.settings = settings
  } catch (e) {}
}



function renderChatMessages() {
  if (window.chatpage && typeof window.chatpage.renderChatMessages === 'function') return window.chatpage.renderChatMessages()
}

function attemptPlayMusic() {
  const bg = document.getElementById('bg-music')
  if (!bg) return
  if (!settings.music) return
  bg.volume = typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.65
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

function initSettings() {
  loadSettings()
  import('./component/right-sidebar.js').then(({ initRightSidebar, applySettingsToUI }) => {
    applySettingsToUI(settings, attemptPlayMusic)
    initRightSidebar(settings, saveSettings, escapeHtml, attemptPlayMusic)
  }).catch(() => {})
}

function initAuthentication() {
  try {
    if (!window.firebaseAuth) {
      return
    }

    const auth = window.firebaseAuth
    const loginBtn = document.getElementById('login-btn')
    const settingsToggle = document.getElementById('settings-toggle')
    const userPfp = document.getElementById('user-pfp')
    const settingsIcon = document.getElementById('settings-icon')
    const userInfoSection = document.getElementById('user-info-section')
    const userProfilePfp = document.getElementById('user-profile-pfp')
    const userProfileName = document.getElementById('user-profile-name')
    const userProfileEmail = document.getElementById('user-profile-email')
    const logoutBtn = document.getElementById('logout-btn')

    import('firebase/auth').then(({ onAuthStateChanged, signOut }) => {
      const defaultPFP = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%2300ffff%22%3E%3Ccircle cx=%2212%22 cy=%228%22 r=%224%22/%3E%3Cpath d=%22M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z%22/%3E%3C/svg%3E'
      
      function updateUIWithUser(user) {
        if (user) {
          const userPFP = user.photoURL || defaultPFP
          localStorage.setItem('userEmail', user.email)
          localStorage.setItem('userName', user.displayName)
          localStorage.setItem('userPFP', userPFP)

          if (loginBtn) loginBtn.style.display = 'none'
          if (settingsToggle) settingsToggle.style.display = 'flex'
          if (userPfp) {
            userPfp.src = userPFP
            userPfp.style.display = 'block'
          }
          if (settingsIcon) settingsIcon.style.display = 'none'
          if (userInfoSection) userInfoSection.style.display = 'flex'
          if (userProfilePfp) userProfilePfp.src = userPFP
          if (userProfileName) userProfileName.textContent = user.displayName || 'User'
          if (userProfileEmail) userProfileEmail.textContent = user.email || ''
        } else {
          localStorage.removeItem('userEmail')
          localStorage.removeItem('userName')
          localStorage.removeItem('userPFP')

          if (loginBtn) loginBtn.style.display = 'inline-flex'
          if (settingsToggle) settingsToggle.style.display = 'none'
          if (userPfp) userPfp.style.display = 'none'
          if (settingsIcon) settingsIcon.style.display = 'none'
          if (userInfoSection) userInfoSection.style.display = 'none'
        }
      }

      onAuthStateChanged(auth, (user) => {
        updateUIWithUser(user)
      })

      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault()
          e.stopPropagation()
          try {
            await signOut(auth)
            const rightSidebar = document.getElementById('right-sidebar')
            if (rightSidebar) {
              rightSidebar.classList.remove('open')
              rightSidebar.setAttribute('aria-hidden', 'true')
            }
            updateUIWithUser(null)
            localStorage.removeItem('isLoggedIn')
            window.location.href = '/login'
          } catch (error) {
            console.error('Logout error:', error)
          }
        })
      }
    }).catch(() => {})
  } catch (e) {}
}

function initApp() {
  requestAnimationFrame(() => {
    try {
      bindChatUI()
    } catch (e) {}
    try {
      bindModalUI()
    } catch (e) {}
    try {
      renderQuickPrompts()
    } catch (e) {}
  })

  if (window.gamespage) {
    try { window.gamespage.refreshElements() } catch (e) {}
    try { window.gamespage.attachSearchHandler() } catch (e) {}
    try { window.gamespage.loadGames() } catch (e) {}
  } else {
    setTimeout(() => {
      if (window.gamespage) {
        try { window.gamespage.refreshElements() } catch (e) {}
        try { window.gamespage.attachSearchHandler() } catch (e) {}
        try { window.gamespage.loadGames() } catch (e) {}
      }
    }, 120)
  }
  try { loadNotes() } catch (e) {}
  try { renderChatMessages() } catch (e) {}

  initSettings()
  initAuthentication()
  attemptPlayMusic()
  initBottomGradientDepthIndicator()
  bindLeftSidebar()
  initBackgroundRotation()
  try { updateFooterForChat() } catch (e) {}
}

function renderQuickPrompts() {
  if (window.chatpage && typeof window.chatpage.renderQuickPrompts === 'function') return window.chatpage.renderQuickPrompts()
}
function bindChatUI() {
  if (window.chatpage && typeof window.chatpage.bindChatUI === 'function') return window.chatpage.bindChatUI()
}
function bindModalUI() {
  if (window.chatpage && typeof window.chatpage.bindModalUI === 'function') return window.chatpage.bindModalUI()
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (window.chatpage && typeof window.chatpage.startApiPolling === 'function') try { window.chatpage.startApiPolling() } catch (e) {}
  } else {
    if (window.chatpage && typeof window.chatpage.stopApiPolling === 'function') try { window.chatpage.stopApiPolling() } catch (e) {}
  }
})

if (typeof window !== 'undefined') {
  try {
    window.loadSettings = loadSettings
    window.saveSettings = saveSettings
  } catch (e) {}
}

let designModule = null

async function ensureDesignModule() {
  if (designModule) return designModule
  try {
    const mod = await import('./function/script-design.js')
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
  initBottomGradientDepthIndicatorFallback()
}

function initBottomGradientDepthIndicatorFallback() {
  try {
    if (typeof window.updateDepthIndicatorNow !== 'function') {
      window.updateDepthIndicatorNow = function () {}
    }
  } catch (e) {}
}

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
    }

    if (sb) {
      sb.addEventListener('mouseleave', () => {
        closeLeftSidebar()
      })
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        const toggleEl = document.getElementById('menu-toggle')
        if (toggleEl && (e.target === toggleEl || (e.target.closest && e.target.closest('#menu-toggle')))) {
          return
        }
        setTimeout(() => {
          closeLeftSidebar()
        }, 5000)
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

function userGestureToStart() {
  try {
    attemptPlayMusic()
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
    const formatted = formatDateToManilaShortMonth(dateObj || new Date())
    safeSetFetchDate(`Updated since: ${formatted}`)

    if (closeSidebarTimeout) {
      clearTimeout(closeSidebarTimeout)
      closeSidebarTimeout = null
    }
    closeSidebarTimeout = setTimeout(() => {
      closeSidebarTimeout = null
      closeLeftSidebar()
    }, 5000)

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

  await import('./function/switch-sections.js')

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