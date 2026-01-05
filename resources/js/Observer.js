// Observer.js
let animating = false

function animateTop(el, from, to) {
  if (from === to) return
  animating = true
  const start = performance.now()
  const duration = 260

  function step(now) {
    const t = Math.min((now - start) / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    const value = from + (to - from) * eased
    el.style.top = value + 'px'
    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      animating = false
    }
  }

  requestAnimationFrame(step)
}

function computeTopForTabs() {
  const container = document.getElementById('category-tabs')
  if (!container) return
  const header = document.querySelector('header')
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0
  const targetTop = headerBottom > 0 ? headerBottom + 8 : 0
  const currentTop = parseFloat(getComputedStyle(container).top) || 0
  if (!animating) animateTop(container, currentTop, targetTop)
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
  requestAnimationFrame(() => {
    ensureUpdateTop()
    setTimeout(ensureUpdateTop, 80)
    setTimeout(ensureUpdateTop, 300)
  })

  const headerEl = document.querySelector('header')

  if (window.ResizeObserver) {
    if (headerEl) {
      new ResizeObserver(ensureUpdateTop).observe(headerEl)
    }

    const waitTabs = setInterval(() => {
      const t = document.getElementById('category-tabs')
      if (t) {
        new ResizeObserver(ensureUpdateTop).observe(t)
        clearInterval(waitTabs)
      }
    }, 120)
  }

  if (window.MutationObserver) {
    new MutationObserver(ensureUpdateTop).observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  let retry = 0
  const retryInterval = setInterval(() => {
    ensureUpdateTop()
    retry++
    if (retry > 8) clearInterval(retryInterval)
  }, 200)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachObservers)
} else {
  attachObservers()
}
