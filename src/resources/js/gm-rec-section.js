// gm-rec-section.js
console.log('GM Rec section module loaded')

function initGmRec() {
  const section = document.getElementById('gm-rec-section')
  const container = document.getElementById('gm-rec-container')
  const block = document.getElementById('gm-rec-block')
  const heading = document.getElementById('gm-rec-game-name')

  if (!section || !heading) return

  fetch('/My_Info/MyGames.json')
    .then(response => {
      if (!response.ok) throw new Error(`Fetch failed (${response.status})`)
      return response.json()
    })
    .then(data => {
      const list = Array.isArray(data) ? data : (data.games || Object.values(data))
      const items = list.filter(i => i && i.my_gm_rec_img && i.my_gm_rec_link)
      if (!items.length) {
        section.style.display = 'none'
        return
      }

      if (block) block.innerHTML = ''
      if (container) container.style.display = 'block'

      const tooltip = document.createElement('div')
      tooltip.className = 'gm-rec-tooltip'
      document.body.appendChild(tooltip)

      function shorten(s, n = 36) {
        if (!s) return ''
        if (s.length <= n) return s
        try {
          const u = new URL(s)
          const host = u.origin
          const path = u.pathname + (u.search || '')
          const truncated = path.length > (n - host.length - 5) ? path.slice(0, n - host.length - 8) + '...' : path
          return host + truncated
        } catch (err) {
          return s.slice(0, n - 3) + '...'
        }
      }

      function parseTranslateYFromComputed(el) {
        const cs = window.getComputedStyle(el)
        const tr = cs.transform || cs.webkitTransform || cs.mozTransform
        if (!tr || tr === 'none') return 0
        if (tr.startsWith('matrix3d(')) {
          const parts = tr.slice(9, -1).split(',').map(p => parseFloat(p))
          if (parts.length === 16) return isNaN(parts[13]) ? 0 : parts[13]
        } else if (tr.startsWith('matrix(')) {
          const parts = tr.slice(7, -1).split(',').map(p => parseFloat(p))
          if (parts.length === 6) return isNaN(parts[5]) ? 0 : parts[5]
        }
        const m = tr.match(/-?\d+(\.\d+)?/g)
        if (m && m.length) return parseFloat(m[m.length - 1])
        return 0
      }

      const dragThreshold = 6
      const holdThresholdMs = 180
      const defaultCycleSec = 60

      items.forEach(item => {
        const card = document.createElement('div')
        card.className = 'gm-rec-block-item'

        const title = document.createElement('h3')
        title.className = 'gm-rec-card-name'
        title.textContent = item.name || item.title || item.game || 'Unknown Game'
        card.appendChild(title)

        const imgWrap = document.createElement('div')
        imgWrap.className = 'gm-rec-img-wrap'
        const img = document.createElement('img')
        img.src = item.my_gm_rec_img
        img.alt = item.name || item.title || item.game || 'Game record'
        img.draggable = false
        imgWrap.appendChild(img)
        card.appendChild(imgWrap)

        const linkText = document.createElement('p')
        linkText.className = 'gm-rec-link-text'
        const a = document.createElement('a')
        a.href = item.my_gm_rec_link
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        a.className = 'gm-rec-link-short'
        a.textContent = shorten(item.my_gm_rec_link, 36)
        a.dataset.full = item.my_gm_rec_link
        a.style.cursor = 'pointer'
        linkText.appendChild(document.createTextNode('My updated record is found on this link: '))
        linkText.appendChild(a)
        card.appendChild(linkText)

        if (block) block.appendChild(card)

        let delta = 0
        let isImgDragging = false
        let moved = false
        let startY = 0
        let startTranslate = 0
        let autoAnimating = false
        let autoDirection = 'down'
        let autoTimeout = null
        let transitionListener = null
        let pressTime = 0
        let lastAutoDirectionBeforePress = 'down'

        function clearAuto() {
          autoAnimating = false
          if (autoTimeout) {
            clearTimeout(autoTimeout)
            autoTimeout = null
          }
          if (transitionListener) {
            img.removeEventListener('transitionend', transitionListener)
            transitionListener = null
          }
        }

        function startAuto(direction, delay = 20) {
          clearAuto()
          if (delta <= 4) return
          autoDirection = direction
          autoTimeout = setTimeout(() => {
            const current = parseTranslateYFromComputed(img)
            let remainingPx = 0
            if (direction === 'down') {
              remainingPx = Math.max(0, delta + current)
            } else {
              remainingPx = Math.max(0, Math.abs(current))
            }
            if (remainingPx < 0.5) {
              if (direction === 'down') {
                img.style.transition = 'none'
                img.style.transform = `translateY(-${delta}px)`
                autoAnimating = false
                scheduleReverse()
                return
              } else {
                img.style.transition = 'none'
                img.style.transform = `translateY(0px)`
                autoAnimating = false
                scheduleReverse()
                return
              }
            }
            const speed = delta / Math.max(8, defaultCycleSec)
            const duration = Math.max(2, remainingPx / (speed || 1))
            img.style.transition = `transform ${duration}s linear`
            const target = direction === 'down' ? `translateY(-${delta}px)` : 'translateY(0px)'
            transitionListener = function (ev) {
              if (ev.propertyName !== 'transform') return
              img.removeEventListener('transitionend', transitionListener)
              transitionListener = null
              autoAnimating = false
              scheduleReverse()
            }
            img.addEventListener('transitionend', transitionListener)
            autoAnimating = true
            img.style.transform = target
          }, delay)
        }

        function scheduleReverse() {
          clearAuto()
          autoTimeout = setTimeout(() => {
            const nextDir = autoDirection === 'down' ? 'up' : 'down'
            startAuto(nextDir, 40)
          }, 300)
        }

        img.addEventListener('load', function () {
          const visible = imgWrap.clientHeight
          const naturalScaled = img.naturalHeight * (img.clientWidth / (img.naturalWidth || img.clientWidth))
          delta = Math.round(naturalScaled - visible)
          if (delta > 4) {
            img.style.transition = 'none'
            img.style.transform = 'translateY(0px)'
            autoDirection = 'down'
            clearAuto()
            autoTimeout = setTimeout(() => startAuto('down', 220), 600)
          } else {
            delta = 0
            img.style.transform = 'translateY(0px)'
            img.style.transition = 'none'
            clearAuto()
          }
        })

        img.addEventListener('pointerdown', function (e) {
          if (e.button && e.button !== 0) return
          e.stopPropagation()
          isImgDragging = true
          moved = false
          pressTime = performance.now()
          try { img.setPointerCapture(e.pointerId) } catch (err) {}
          startY = e.clientY
          startTranslate = parseTranslateYFromComputed(img)
          lastAutoDirectionBeforePress = autoDirection
          if (autoAnimating) {
            const current = parseTranslateYFromComputed(img)
            img.style.transition = 'none'
            img.style.transform = `translateY(${current}px)`
          } else {
            img.style.transition = 'none'
          }
          clearAuto()
          img.style.cursor = 'grabbing'
        })

        img.addEventListener('pointermove', function (e) {
          if (!isImgDragging) return
          const dy = e.clientY - startY
          if (!moved && Math.abs(dy) > dragThreshold) moved = true
          if (!moved) return
          let t = startTranslate + dy
          if (t < -delta) t = -delta
          if (t > 0) t = 0
          img.style.transform = `translateY(${t}px)`
        })

        function resumeAutoFromCurrent(preferDirection) {
          if (delta <= 4) return
          const current = parseTranslateYFromComputed(img)
          const atTop = Math.abs(current) < 0.5
          const atBottom = Math.abs(current + delta) < 0.5
          if (atBottom) {
            startAuto('up', 50)
            return
          }
          if (atTop) {
            startAuto('down', 50)
            return
          }
          if (preferDirection === 'down' || preferDirection === 'up') {
            startAuto(preferDirection, 50)
            return
          }
          const prefer = lastAutoDirectionBeforePress || 'down'
          startAuto(prefer === 'down' ? 'down' : 'up', 50)
        }

        img.addEventListener('pointerup', function (e) {
          if (!isImgDragging) {
            img.style.cursor = 'grab'
            return
          }
          isImgDragging = false
          try { img.releasePointerCapture(e.pointerId) } catch (err) {}
          img.style.cursor = 'grab'
          const holdDuration = performance.now() - pressTime
          if (moved) {
            startAuto('down', 50)
          } else if (holdDuration >= holdThresholdMs) {
            resumeAutoFromCurrent()
          } else {
            clearAuto()
          }
        })

        img.addEventListener('pointercancel', function () {
          if (!isImgDragging) {
            img.style.cursor = 'grab'
            return
          }
          isImgDragging = false
          try { img.releasePointerCapture && img.releasePointerCapture() } catch (err) {}
          img.style.cursor = 'grab'
          if (moved) {
            startAuto('down', 50)
          } else {
            clearAuto()
          }
        })

        img.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()
        }, true)

        img.addEventListener('dragstart', function (e) { e.preventDefault() })

        a.addEventListener('click', function (e) {
          if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
          e.preventDefault()
          e.stopPropagation()
          const opened = window.open(this.href, '_blank', 'noopener,noreferrer')
          if (!opened) {
            try {
              const w = window.open()
              if (w) {
                w.opener = null
                w.location = this.href
              }
            } catch (err) {
              window.location.href = this.href
            }
          }
        })

        a.addEventListener('mouseenter', function () {
          tooltip.textContent = a.dataset.full || a.href
          tooltip.style.display = 'block'
          const r = a.getBoundingClientRect()
          const top = Math.max(8, r.top - tooltip.offsetHeight - 8)
          const left = Math.min(window.innerWidth - 12 - tooltip.offsetWidth, r.left)
          tooltip.style.top = `${top}px`
          tooltip.style.left = `${left}px`
        })
        a.addEventListener('mouseleave', function () { tooltip.style.display = 'none' })
        a.addEventListener('focus', function () {
          tooltip.textContent = a.dataset.full || a.href
          tooltip.style.display = 'block'
        })
        a.addEventListener('blur', function () { tooltip.style.display = 'none' })
      })

      const oldLinkText = document.getElementById('gm-rec-link-text')
      if (oldLinkText) oldLinkText.style.display = 'none'

      section.style.display = 'block'

      const scrollEl = block || container
      if (!scrollEl) return

      let isDown = false
      let startY = 0
      let scrollTop = 0

      scrollEl.addEventListener('pointerdown', function (e) {
        if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') return
        try {
          const el = e.target && e.target.closest ? e.target.closest('a, button, input, textarea, select, label') : null
          if (el) {
            return
          }
        } catch (err) {
        }
        isDown = true
        try { scrollEl.setPointerCapture(e.pointerId) } catch (err) {}
        startY = e.clientY
        scrollTop = scrollEl.scrollTop
        scrollEl.style.cursor = 'grabbing'
      })

      scrollEl.addEventListener('pointermove', function (e) {
        if (!isDown) return
        const dy = e.clientY - startY
        scrollEl.scrollTop = scrollTop - dy
      })

      scrollEl.addEventListener('pointerup', function (e) {
        isDown = false
        try { scrollEl.releasePointerCapture(e.pointerId) } catch (err) {}
        scrollEl.style.cursor = ''
      })

      scrollEl.addEventListener('pointercancel', function () {
        isDown = false
        scrollEl.style.cursor = ''
      })
    })
    .catch(() => { section.style.display = 'none' })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGmRec)
} else {
  initGmRec()
}
