let jsonGames = []
let forgottenGames = []
let allGames = []
let currentViewMode = 'grouped'
let pendingScrollTarget = null

let gameList = null
let gameListContent = null
let categoryTabs = null
let gameCount = null
let searchInput = null
let fetchDateEl = null
let categoryObserver = null

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function refreshElements() {
  gameList = document.getElementById('game-list')
  gameListContent = document.getElementById('game-list-content') || gameList
  categoryTabs = document.getElementById('category-tabs')
  gameCount = document.getElementById('game-count')
  searchInput = document.getElementById('searchInput')
  fetchDateEl = document.getElementById('fetch-date')
}

function normalizeValue(value) {
  if (Array.isArray(value)) return value.map((v) => String(v ?? '').trim()).filter(Boolean).join('|')
  return String(value ?? '').trim()
}

function getGameKey(game) {
  const idPart = normalizeValue(game.playstore_id ?? game.id ?? game.user_id)
  const categoryPart = normalizeValue(game.category)
  const namePart = normalizeValue(game.name)
  const iconPart = normalizeValue(game.icon)
  const descPart = normalizeValue(game.description)

  if (idPart) {
    return `${idPart}::${categoryPart}::${namePart}::${iconPart}::${descPart}`
  }

  return JSON.stringify({
    name: game.name ?? '',
    category: game.category ?? '',
    user_id: game.user_id ?? '',
    id: game.id ?? '',
    playstore_id: game.playstore_id ?? '',
    icon: game.icon ?? '',
    description: game.description ?? '',
  })
}

function getUniqueGames(gameData) {
  const seen = new Set()
  const unique = []
  ;(gameData || []).forEach((game) => {
    const key = getGameKey(game)
    if (seen.has(key)) return
    seen.add(key)
    unique.push(game)
  })
  return unique
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

function getSearchQuery() {
  refreshElements()
  return (searchInput && searchInput.value ? searchInput.value : '').trim().toLowerCase()
}

function getFilteredGames() {
  const query = getSearchQuery()
  const source = Array.isArray(allGames) ? allGames : []
  if (!query) return source.slice()
  return source.filter((game) => {
    if (game.isForgotten) {
      return (game.name || '').toLowerCase().includes(query)
    }
    const nameMatch = (game.name || '').toLowerCase().includes(query)
    const idMatch = (game.id ?? game.user_id ?? game.playstore_id ?? '').toString().toLowerCase().includes(query)
    const catString = Array.isArray(game._categories)
      ? game._categories.join(' ').toLowerCase()
      : (game.category || '').toString().toLowerCase()
    const catMatch = catString.includes(query)
    return nameMatch || idMatch || catMatch
  })
}

function getImageUrl(game) {
  if (game.icon) {
    return game.icon
  }
  return 'https://via.placeholder.com/100x100?text=No+Icon'
}

async function fetchPlayStoreInfo(playstoreLink) {
  try {
    console.log('[Frontend] Fetching Play Store info for:', playstoreLink);
    
    const url = new URL(playstoreLink)
    const packageId = url.searchParams.get('id')
    console.log('[Frontend] Extracted package ID:', packageId);
    
    if (!packageId) {
      console.log('[Frontend] No package ID found');
      return null
    }

    const apiUrl = `/api/playstore?id=${packageId}`;
    console.log('[Frontend] Calling API:', apiUrl);
    
    const response = await fetch(apiUrl)
    console.log('[Frontend] API response status:', response.status);
    
    if (!response.ok) {
      console.log('[Frontend] API response not OK');
      return null
    }

    const data = await response.json()
    console.log('[Frontend] API response data:', data);
    return data
  } catch (error) {
    console.error('[Frontend] Error fetching Play Store info:', error);
    return null
  }
}

function createCardHtml(game, index, safeCategoryId, flatMode) {
  if (game.isForgotten) {
    return `<div class="game-card forgotten-card"><div class="game-name">${escapeHtml(game.name)}</div></div>`
  }

  const tooltipText = game.description || 'Click to copy this ID'
  const copyValue = game.id ?? game.user_id ?? game.playstore_id ?? ''
  const copiedId = `copied-${safeCategoryId}-${index}`
  const tagsHtml =
    !flatMode && Array.isArray(game._categories) && game._categories.length > 1
      ? `<div class="category-tags">${game._categories.map((c) => `<span class="category-tag">${escapeHtml(c)}</span>`).join('')}</div>`
      : ''
  const imageUrl = getImageUrl(game)
  const playstoreAttr = game.playstore_link ? `data-playstore="${escapeHtml(game.playstore_link)}"` : ''

  return `
    <div class="game-card" data-copy="${escapeHtml(copyValue)}" data-index="${index}" data-safe="${safeCategoryId}" ${playstoreAttr}>
      <div class="tooltip">${escapeHtml(tooltipText)}</div>
      <div class="game-image-container">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(game.name)}" onerror="this.onerror=null;this.src='public/assets/img/NoImgIcon.png';" />
      </div>
      <div class="game-name">${escapeHtml(game.name)}</div>
      <div class="player-id">${escapeHtml(game.user_id ?? '')}</div>
      ${tagsHtml}
      <div class="copied-msg" id="${copiedId}">Copied!</div>
    </div>`
}

function updateGameCount(count) {
  refreshElements()
  if (gameCount) gameCount.textContent = `Games Found: ${count}`
}

function scrollToCategory(sectionId) {
  if (!sectionId) return
  const section = document.getElementById(sectionId)
  if (!section) return
  const title = section.querySelector('.category-title') || section
  title.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
  const header = document.querySelector('header')
  const headerRect = header ? header.getBoundingClientRect() : { bottom: 0, height: 0 }
  const tabsHeight = categoryTabs ? (categoryTabs.getBoundingClientRect().height || 0) : 0
  const offset = (headerRect.bottom > 0 ? headerRect.bottom : 0) + tabsHeight + 8
  setTimeout(() => {
    window.scrollBy({ left: 0, top: -offset, behavior: 'smooth' })
  }, 120)
}

function disconnectCategoryObserver() {
  if (categoryObserver) {
    try {
      categoryObserver.disconnect()
    } catch (e) {}
    categoryObserver = null
  }
}

function setupCategoryObserver(categories) {
  disconnectCategoryObserver()
  if (currentViewMode !== 'grouped') return
  if (!categories || !categories.length) return
  if (!window.IntersectionObserver || !categoryTabs) return

  categoryObserver = new IntersectionObserver(
    (entries) => {
      let best = null
      entries.forEach((e) => {
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e
      })
      if (best && best.isIntersecting) {
        const id = best.target.id
        const titleEl = best.target.querySelector('.category-title')
        const titleNormalized = titleEl ? normalizeLabel(titleEl.textContent || '') : ''
        categoryTabs.querySelectorAll('.category-tab[data-target]').forEach((b) => {
          const btnNorm = normalizeLabel(b.textContent || '')
          const matchById = b.dataset.target === id
          const matchByText = btnNorm && titleNormalized && btnNorm === titleNormalized
          b.classList.toggle('active', matchById || matchByText)
        })
        const activeBtn = Array.from(categoryTabs.querySelectorAll('.category-tab[data-target]')).find((b) =>
          b.classList.contains('active')
        )
        if (activeBtn) safeCenterScroll(categoryTabs, activeBtn, 'smooth')
      }
    },
    { root: null, rootMargin: '-10% 0px -60% 0px', threshold: [0.25, 0.5, 0.75] }
  )

  categories.forEach((c) => {
    const s = document.getElementById(c.id)
    if (s) categoryObserver.observe(s)
  })
}

function renderGroupedTabs(categories) {
  refreshElements()
  if (!categoryTabs) return

  categoryTabs.innerHTML = ''

  const gridBtn = document.createElement('button')
  gridBtn.type = 'button'
  gridBtn.className = 'category-tab grid-view-btn'
  gridBtn.dataset.view = 'flat'
  gridBtn.title = 'Show all games'
  gridBtn.setAttribute('aria-label', 'Show all games')
  gridBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" fill="currentColor"></path>
    </svg>
  `
  gridBtn.addEventListener('click', () => {
    currentViewMode = currentViewMode === 'flat' ? 'grouped' : 'flat'
    pendingScrollTarget = null
    renderGames(getFilteredGames())
  })
  categoryTabs.appendChild(gridBtn)

  categories.forEach((c) => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'category-tab'
    btn.textContent = c.name + ' Games'
    btn.dataset.target = c.id
    btn.addEventListener('click', () => {
      currentViewMode = 'grouped'
      pendingScrollTarget = c.id
      renderGames(getFilteredGames())
    })
    categoryTabs.appendChild(btn)
  })

  categoryTabs.querySelectorAll('.category-tab').forEach((btn) => {
    btn.classList.remove('active')
  })

  if (currentViewMode === 'flat') {
    gridBtn.classList.add('active')
    const label = document.createElement('div')
    label.className = 'all-games-label'
    label.textContent = 'ALL GAMES'
    categoryTabs.appendChild(label)
    requestAnimationFrame(() => safeCenterScroll(categoryTabs, label, 'auto'))
    return
  }

  const activeTarget = pendingScrollTarget && categories.some((c) => c.id === pendingScrollTarget)
    ? pendingScrollTarget
    : categories[0]?.id

  if (activeTarget) {
    const activeBtn = categoryTabs.querySelector(`.category-tab[data-target="${CSS.escape(activeTarget)}"]`)
    if (activeBtn) {
      activeBtn.classList.add('active')
      requestAnimationFrame(() => safeCenterScroll(categoryTabs, activeBtn, 'auto'))
    }
  }

  setupCategoryObserver(categories)
}

function renderGroupedGames(uniqueGames) {
  refreshElements()
  const grouped = {}

  uniqueGames.forEach((game) => {
    const rawCat = game.category
    const cats = Array.isArray(rawCat)
      ? rawCat.map((c) => (c || '').toString().trim()).filter(Boolean)
      : rawCat
        ? [rawCat.toString().trim()]
        : ['Other']
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
    const safeCategoryIdForGroup = category.replace(/\s+/g, '_')
    preparedCategories.push({ name: category, id: `cat-${safeCategoryIdForGroup}` })
    const cards = grouped[category]
      .map((game, index) => createCardHtml(game, index, safeCategoryIdForGroup, false))
      .join('')

    html += `
      <div class="category-section" id="cat-${safeCategoryIdForGroup}">
        <h2 class="category-title" data-cat-name="${escapeHtml(category)}">${escapeHtml(category)} Games</h2>
        <div class="game-grid">${cards}</div>
      </div>`
  })

  if (gameListContent) gameListContent.innerHTML = html

  const cardsEl = gameListContent ? Array.from(gameListContent.querySelectorAll('.game-card')) : []
  cardsEl.forEach((card) => {
    card.addEventListener('click', () => {
      const toCopy = card.dataset.copy || ''
      const idx = card.dataset.index || 0
      const safe = card.dataset.safe || ''
      copyToClipboard(toCopy, idx, safe)
    })

    const playstoreLink = card.dataset.playstore
    if (playstoreLink) {
      card.classList.add('playstore-loading')
      const nameEl = card.querySelector('.game-name')
      if (nameEl) nameEl.textContent = 'Google Play Loading'
      
      console.log('[Frontend] Starting to fetch Play Store info for card');
      fetchPlayStoreInfo(playstoreLink).then((data) => {
        console.log('[Frontend] Play Store fetch completed, data:', data);
        card.classList.remove('playstore-loading')
        if (data) {
          if (data.title) {
            const nameEl = card.querySelector('.game-name')
            if (nameEl) nameEl.textContent = data.title
          }
          if (data.icon) {
            const imgEl = card.querySelector('.game-image-container img')
            if (imgEl) imgEl.src = data.icon
          }
        }
      })
    }
  })

  renderGroupedTabs(preparedCategories)
  updateGameCount(uniqueGames.length)

  try {
    window.dispatchEvent(new CustomEvent('jm:games-loaded', { detail: { count: uniqueGames.length } }))
  } catch (e) {}

  if (pendingScrollTarget) {
    const target = pendingScrollTarget
    pendingScrollTarget = null
    setTimeout(() => scrollToCategory(target), 150)
  }
}

function renderFlatGames(uniqueGames) {
  refreshElements()
  if (categoryTabs) categoryTabs.classList.add('flat-mode')

  const cards = uniqueGames.map((game, index) => createCardHtml(game, index, 'flat', true)).join('')
  const html = `
    <div class="category-section flat-section">
      <div class="game-grid flat-grid">${cards}</div>
    </div>`

  if (gameListContent) gameListContent.innerHTML = html

  const cardsEl = gameListContent ? Array.from(gameListContent.querySelectorAll('.game-card')) : []
  cardsEl.forEach((card) => {
    card.addEventListener('click', () => {
      const toCopy = card.dataset.copy || ''
      const idx = card.dataset.index || 0
      const safe = card.dataset.safe || ''
      copyToClipboard(toCopy, idx, safe)
    })

    const playstoreLink = card.dataset.playstore
    if (playstoreLink) {
      card.classList.add('playstore-loading')
      const nameEl = card.querySelector('.game-name')
      if (nameEl) nameEl.textContent = 'PlayStore Game Loading'
      fetchPlayStoreInfo(playstoreLink).then((data) => {
        card.classList.remove('playstore-loading')
        if (data) {
          if (data.title) {
            const nameEl = card.querySelector('.game-name')
            if (nameEl) nameEl.textContent = data.title
          }
          if (data.icon) {
            const imgEl = card.querySelector('.game-image-container img')
            if (imgEl) imgEl.src = data.icon
          }
        }
      })
    }
  })

  renderGroupedTabs([])
  updateGameCount(uniqueGames.length)

  try {
    window.dispatchEvent(new CustomEvent('jm:games-loaded', { detail: { count: uniqueGames.length } }))
  } catch (e) {}
}

function renderGames(gameData) {
  refreshElements()
  const uniqueGames = getUniqueGames(Array.isArray(gameData) ? gameData : [])
  if (currentViewMode === 'flat') {
    renderFlatGames(uniqueGames)
  } else {
    if (categoryTabs) categoryTabs.classList.remove('flat-mode')
    renderGroupedGames(uniqueGames)
  }
}

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
      try {
        window.dispatchEvent(new CustomEvent('jm:games-loaded', { detail: { count: 0 } }))
      } catch (e) {}
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
      renderGames(getFilteredGames())
    })
    .catch((err) => {
      refreshElements()
      if (gameListContent) {
        gameListContent.innerHTML += `<p style="color:red;">⚠️ ${escapeHtml(err.message)}</p>`
      }
    })
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
    try {
      console.warn('Copy to clipboard failed', e)
    } catch (err) {}
  }
}

function copyToClipboard(text, index, safeCategoryId) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
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

function attachSearchHandler() {
  refreshElements()
  if (!searchInput) return
  try {
    searchInput.removeEventListener('input', searchInput._handler)
  } catch (e) {}
  const handler = () => {
    renderGames(getFilteredGames())
  }
  searchInput.addEventListener('input', handler)
  searchInput._handler = handler
}

window.gamespage = {
  refreshElements,
  loadGames,
  loadForgottenAccounts,
  getGameKey,
  getUniqueGames,
  renderGames,
  normalizeLabel,
  safeCenterScroll,
  copyToClipboard,
  fallbackCopy,
  attachSearchHandler,
  getFilteredGames,
  get categoryTabs() {
    return categoryTabs
  },
  get jsonGames() {
    return jsonGames
  },
  get forgottenGames() {
    return forgottenGames
  },
  get allGames() {
    return allGames
  },
  get currentViewMode() {
    return currentViewMode
  }
}