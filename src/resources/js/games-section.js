// gamespage.js
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
      if (gameListContent) gameListContent.innerHTML = `<p style="color:red;">⚠️ ${window.escapeHtml ? window.escapeHtml(err.message) : err.message}</p>`
      try { window.dispatchEvent(new CustomEvent('jm:games-loaded', { detail: { count: 0 } })) } catch (e) {}
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
      if (gameListContent) gameListContent.innerHTML += `<p style="color:red;">⚠️ ${window.escapeHtml ? window.escapeHtml(err.message) : err.message}</p>`
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
        cards += `<div class="game-card"><div class="game-name">${(window.escapeHtml||String)(game.name)}</div></div>`
      } else {
        const tooltipText = game.description || 'Click to copy this ID'
        let tagsHtml = ''
        if (Array.isArray(game._categories) && game._categories.length > 1) {
          const tags = game._categories.map((c) => `<span class="category-tag">${(window.escapeHtml||String)(c)}</span>`).join('')
          tagsHtml = `<div class="category-tags">${tags}</div>`
        }
        const safeCatId = safeCategoryIdForGroup.replace(/'/g, "\\'")
        const copiedId = `copied-${safeCatId}-${index}`
        const copyValue = game.id ?? game.user_id ?? game.playstore_id ?? ''
        cards += `
          <div class="game-card" data-copy="${(window.escapeHtml||String)(copyValue)}" data-index="${index}" data-safe="${safeCatId}">
            <div class="tooltip">${(window.escapeHtml||String)(tooltipText)}</div>
            <img src="${(window.escapeHtml||String)(game.icon || 'https://via.placeholder.com/100x100?text=No+Icon')}" alt="${(window.escapeHtml||String)(game.name)}" onerror="this.onerror=null;this.src='public/assets/img/NoImgIcon.png';" />
            <div class="game-name">${(window.escapeHtml||String)(game.name)}</div>
            <div class="player-id">${(window.escapeHtml||String)(game.user_id ?? '')}</div>
            ${tagsHtml}
            <div class="copied-msg" id="${copiedId}">Copied!</div>
          </div>`
      }
    })
    html += `
      <div class="category-section" id="cat-${safeCategoryIdForGroup}">
        <h2 class="category-title" data-cat-name="${(window.escapeHtml||String)(category)}">${(window.escapeHtml||String)(category)} Games</h2>
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

  try {
    const cards = gameListContent ? Array.from(gameListContent.querySelectorAll('.game-card')) : []
    window.dispatchEvent(new CustomEvent('jm:games-loaded', { detail: { count: cards.length } }))
  } catch (e) {}
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

window.gamespage = {
  refreshElements,
  loadGames,
  loadForgottenAccounts,
  getGameKey,
  renderGames,
  normalizeLabel,
  safeCenterScroll,
  buildCategoryTabs,
  copyToClipboard,
  fallbackCopy,
  attachSearchHandler,
  get categoryTabs() { return categoryTabs },
  get jsonGames() { return jsonGames },
  get forgottenGames() { return forgottenGames },
  get allGames() { return allGames },
}
