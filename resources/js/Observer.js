// Observer.js
function computeTopForTabs() {
  const container = document.getElementById('category-tabs')
  if (!container) return
  const header = document.querySelector('header')
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0
  const topVal = headerBottom > 0 ? headerBottom + 8 : 0
  container.style.top = `${topVal}px`
}

function ensureUpdateTop() {
  computeTopForTabs()
  const ct = document.getElementById('category-tabs')
  if (ct && typeof ct._updateTop === 'function') {
    try { ct._updateTop() } catch (e) {}
  }
}

function attachObservers() {
  window.addEventListener('load', ensureUpdateTop)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ensureUpdateTop)
  requestAnimationFrame(() => { ensureUpdateTop(); setTimeout(ensureUpdateTop, 80); setTimeout(ensureUpdateTop, 300) })

  const headerEl = document.querySelector('header')
  const tabsEl = document.getElementById('category-tabs')
  if (window.ResizeObserver) {
    if (headerEl) {
      const ro = new ResizeObserver(() => { ensureUpdateTop() })
      ro.observe(headerEl)
    }
    if (tabsEl) {
      const ro2 = new ResizeObserver(() => { ensureUpdateTop() })
      ro2.observe(tabsEl)
    } else {
      const roWait = new ResizeObserver(() => { ensureUpdateTop() })
      const waiter = setInterval(() => {
        const t = document.getElementById('category-tabs')
        if (t) {
          roWait.observe(t)
          clearInterval(waiter)
        }
      }, 120)
    }
  }

  if (window.MutationObserver) {
    const bodyObserver = new MutationObserver(() => { ensureUpdateTop() })
    bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: false })
  }

  let retryCount = 0
  const retryInterval = setInterval(() => {
    ensureUpdateTop()
    retryCount++
    if (retryCount > 8) clearInterval(retryInterval)
  }, 200)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachObservers)
} else {
  attachObservers()
}
