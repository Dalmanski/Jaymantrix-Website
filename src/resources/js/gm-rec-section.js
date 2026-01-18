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
      const items = list.filter(i => i && (i.my_gm_rec_img || i.my_gm_pulls_img) && (i.my_gm_rec_link || i.my_gm_rec_date))
      if (!items.length) {
        section.style.display = 'none'
        return
      }

      if (block) block.innerHTML = ''
      if (container) container.style.display = 'block'

      const tooltip = document.createElement('div')
      tooltip.className = 'gm-rec-tooltip'
      document.body.appendChild(tooltip)

      const gmRecModal = document.createElement('div')
      gmRecModal.className = 'gm-rec-modal-overlay'
      gmRecModal.style.display = 'none'
      gmRecModal.innerHTML = '<div class="gm-rec-modal"><div class="gm-rec-modal-content"><img src="" alt=""></div></div><button class="gm-rec-modal-close" aria-label="Close">×</button>'
      gmRecModal.addEventListener('click', function (e) {
        if (e.target === gmRecModal) closeGmRecModal()
      })
      const gmRecModalContent = gmRecModal.querySelector('.gm-rec-modal')
      gmRecModalContent.addEventListener('click', function (e) { e.stopPropagation() })
      const gmRecModalImg = gmRecModal.querySelector('.gm-rec-modal-content img')
      const gmRecModalClose = gmRecModal.querySelector('.gm-rec-modal-close')
      gmRecModalClose.addEventListener('click', function () { closeGmRecModal() })
      document.body.appendChild(gmRecModal)

      function openGmRecModal(src, alt) {
        gmRecModalImg.src = src
        gmRecModalImg.alt = alt || ''
        try { gmRecModal.style.display = 'flex' } catch (err) {}
        try { document.body.style.overflow = 'hidden' } catch (err) {}
        requestAnimationFrame(() => {
          try {
            gmRecModalContent.classList.remove('gm-rec-modal-leave')
            gmRecModalContent.classList.add('gm-rec-modal-enter')
            gmRecModalContent.scrollTop = 0
            const onEnterEnd = function () {
              gmRecModalContent.classList.remove('gm-rec-modal-enter')
              gmRecModalContent.removeEventListener('animationend', onEnterEnd)
            }
            gmRecModalContent.addEventListener('animationend', onEnterEnd)
          } catch (err) {}
        })
      }
      function closeGmRecModal() {
        try {
          gmRecModalContent.classList.remove('gm-rec-modal-enter')
          gmRecModalContent.classList.add('gm-rec-modal-leave')
          const onAnimEnd = function () {
            gmRecModal.style.display = 'none'
            try { document.body.style.overflow = '' } catch (err) {}
            gmRecModalImg.src = ''
            gmRecModalImg.alt = ''
            gmRecModalContent.removeEventListener('animationend', onAnimEnd)
            gmRecModalContent.classList.remove('gm-rec-modal-leave')
          }
          gmRecModalContent.addEventListener('animationend', onAnimEnd)
        } catch (err) {
          gmRecModal.style.display = 'none'
          try { document.body.style.overflow = '' } catch (err) {}
          gmRecModalImg.src = ''
          gmRecModalImg.alt = ''
        }
      }
      window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeGmRecModal() })

      let isModalDragging = false
      let modalStartY = 0
      let modalStartScroll = 0
      gmRecModalImg.style.cursor = 'grab'
      gmRecModalImg.addEventListener('pointerdown', function (e) {
        if (e.button && e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        isModalDragging = true
        modalStartY = e.clientY
        modalStartScroll = gmRecModalContent.scrollTop
        try { this.setPointerCapture(e.pointerId) } catch (err) {}
        this.style.cursor = 'grabbing'
      })
      gmRecModalImg.addEventListener('pointermove', function (e) {
        if (!isModalDragging) return
        const dy = e.clientY - modalStartY
        gmRecModalContent.scrollTop = modalStartScroll - dy
      })
      gmRecModalImg.addEventListener('pointerup', function (e) {
        if (!isModalDragging) return
        isModalDragging = false
        try { this.releasePointerCapture(e.pointerId) } catch (err) {}
        this.style.cursor = 'grab'
      })
      gmRecModalImg.addEventListener('pointercancel', function (e) {
        if (!isModalDragging) return
        isModalDragging = false
        try { this.releasePointerCapture && this.releasePointerCapture(e.pointerId) } catch (err) {}
        this.style.cursor = 'grab'
      })

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

      const defaultCycleSec = 60

      items.forEach(item => {
        const card = document.createElement('div')
        card.className = 'gm-rec-block-item'

        const headerRow = document.createElement('div')
        headerRow.className = 'gm-rec-header-row'

        const title = document.createElement('h3')
        title.className = 'gm-rec-card-name'
        title.textContent = item.name || item.title || item.game || 'Unknown Game'
        headerRow.appendChild(title)

        if (item.my_gm_rec_date) {
          const dateLabel = document.createElement('span')
          dateLabel.className = 'gm-rec-date-label'
          dateLabel.textContent = item.my_gm_rec_date
          headerRow.appendChild(dateLabel)
        }
        card.appendChild(headerRow)

        const imagesContainer = document.createElement('div')
        imagesContainer.className = 'gm-rec-images-container'
        
        if (item.my_gm_rec_img && item.my_gm_pulls_img) {
          imagesContainer.classList.add('gm-rec-images-grid')
        }

        if (item.my_gm_rec_img) {
          const recLabel = document.createElement('div')
          recLabel.className = 'gm-rec-img-label'
          recLabel.textContent = 'Game Record'
          imagesContainer.appendChild(recLabel)

          const recImgWrap = document.createElement('div')
          recImgWrap.className = 'gm-rec-img-wrap'

          const img = document.createElement('img')
          img.src = item.my_gm_rec_img
          img.alt = item.name || item.title || item.game || 'Game record'
          img.draggable = false
          recImgWrap.appendChild(img)
          imagesContainer.appendChild(recImgWrap)
        }

        if (item.my_gm_pulls_img) {
          const pullsLabel = document.createElement('div')
          pullsLabel.className = 'gm-rec-img-label'
          pullsLabel.textContent = 'Game Pulls Record'
          imagesContainer.appendChild(pullsLabel)

          const pullsImgWrap = document.createElement('div')
          pullsImgWrap.className = 'gm-rec-img-wrap'

          const pullsImg = document.createElement('img')
          pullsImg.src = item.my_gm_pulls_img
          pullsImg.alt = `${item.name || item.title || item.game || 'Game'} pulls`
          pullsImg.draggable = false
          pullsImgWrap.appendChild(pullsImg)
          imagesContainer.appendChild(pullsImgWrap)
        }

        if (imagesContainer.children.length > 0) {
          card.appendChild(imagesContainer)
        }

        if (item.my_gm_rec_link) {
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
        }

        if (block) block.appendChild(card)

        const allImages = card.querySelectorAll('.gm-rec-img-wrap img')
        allImages.forEach(img => {
          let delta = 0
          let autoAnimating = false
          let autoDirection = 'down'
          let autoTimeout = null
          let transitionListener = null

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

          const imgWrap = img.closest('.gm-rec-img-wrap')

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

          img.addEventListener('click', function (e) {
            e.preventDefault()
            e.stopPropagation()
            openGmRecModal(this.src, this.alt)
          })

          img.addEventListener('dragstart', function (e) { e.preventDefault() })
        })

        const linkElement = card.querySelector('.gm-rec-link-short')
        if (linkElement) {
          linkElement.addEventListener('click', function (e) {
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

          linkElement.addEventListener('mouseenter', function () {
            tooltip.textContent = this.dataset.full || this.href
            tooltip.style.display = 'block'
            const r = this.getBoundingClientRect()
            const top = Math.max(8, r.top - tooltip.offsetHeight - 8)
            const left = Math.min(window.innerWidth - 12 - tooltip.offsetWidth, r.left)
            tooltip.style.top = `${top}px`
            tooltip.style.left = `${left}px`
          })
          linkElement.addEventListener('mouseleave', function () { tooltip.style.display = 'none' })
          linkElement.addEventListener('focus', function () {
            tooltip.textContent = this.dataset.full || this.href
            tooltip.style.display = 'block'
          })
          linkElement.addEventListener('blur', function () { tooltip.style.display = 'none' })
        }
      })

      const oldLinkText = document.getElementById('gm-rec-link-text')
      if (oldLinkText) oldLinkText.style.display = 'none'

      const searchEl = document.getElementById('searchInput')
      if (searchEl && block) {
        searchEl.addEventListener('input', function () {
          const q = (this.value || '').trim().toLowerCase()
          const cards = Array.from(block.querySelectorAll('.gm-rec-block-item'))
          if (!q) {
            cards.forEach(c => c.style.display = '')
            return
          }
          cards.forEach(c => {
            const title = (c.querySelector('.gm-rec-card-name') && c.querySelector('.gm-rec-card-name').textContent || '').toLowerCase()
            const link = (c.querySelector('.gm-rec-link-short') && c.querySelector('.gm-rec-link-short').dataset && (c.querySelector('.gm-rec-link-short').dataset.full || '') || '').toLowerCase()
            if (title.indexOf(q) !== -1 || link.indexOf(q) !== -1) c.style.display = ''
            else c.style.display = 'none'
          })
        })
      }

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
