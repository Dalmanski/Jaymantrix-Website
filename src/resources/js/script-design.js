export const marqueeTextLeft = 'JAYMANTRIX'
export const marqueeTextRight = 'JAYTRIXIA'
export const copies = 4

document.documentElement.style.setProperty('--fraction', (1 / copies))

export function buildMarquee(containerId, text) {
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

export function initBottomGradientDepthIndicator() {
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

  function scheduleClosePanelOrHide() {
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
      scheduleClosePanelOrHide()
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
      scheduleClosePanelOrHide()
    }
  }

  function onMouseUp(e) {
    const clientX = (typeof e.clientX === 'number') ? e.clientX : -1
    if (isDraggingScrollbar || pointerOverScrollbar(clientX)) {
      stopDragModeAndHide()
      return
    }
    scheduleClosePanelOrHide()
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
      scheduleClosePanelOrHide()
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
    scheduleClosePanelOrHide()
  }

  function onTouchEnd() {
    scheduleClosePanelOrHide()
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

export default function init() {
  try {
    initBottomGradientDepthIndicator()
  } catch (e) {}
}
