function escapeHtmlLocal(str) {
  if (typeof window !== 'undefined' && window.escapeHtml) return window.escapeHtml(str)
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export function buildNoteSection(title, items) {
  const listItems = items.map((item) => `<li>${escapeHtmlLocal(item)}</li>`).join('')
  return `
    <div class="note-block">
      <h3 class="note-title" role="button" tabindex="0" aria-expanded="false"><span class="title-text">${escapeHtmlLocal(title)}</span><span class="chev" aria-hidden="true"></span></h3>
      <div class="note-content" aria-hidden="true">
        <ol>${listItems}</ol>
      </div>
    </div>`
}

export function addNoteToggleListeners() {
  document.querySelectorAll('.note-title').forEach((title) => {
    const content = title.nextElementSibling
    if (!content) return
    content.style.maxHeight = '0px'
    content.setAttribute('aria-hidden', 'true')
    title.setAttribute('aria-expanded', 'false')
    function open() {
      content.classList.add('open')
      content.setAttribute('aria-hidden', 'false')
      title.setAttribute('aria-expanded', 'true')
      const full = content.scrollHeight
      content.style.maxHeight = full + 'px'
      content.addEventListener('transitionend', function onEnd() {
        content.style.maxHeight = full + 'px'
        content.removeEventListener('transitionend', onEnd)
      })
    }
    function close() {
      content.style.maxHeight = content.scrollHeight + 'px'
      requestAnimationFrame(() => {
        content.style.maxHeight = '0px'
        content.addEventListener('transitionend', function onEnd() {
          content.classList.remove('open')
          content.setAttribute('aria-hidden', 'true')
          title.setAttribute('aria-expanded', 'false')
          content.removeEventListener('transitionend', onEnd)
        })
      })
    }
    function toggle() {
      const expanded = title.getAttribute('aria-expanded') === 'true'
      if (expanded) close()
      else open()
    }
    title.addEventListener('click', (e) => {
      e.preventDefault()
      toggle()
    })
    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        toggle()
      }
    })
  })
}

export async function loadNotes() {
  const container = document.getElementById('notes-container')
  if (!container) return
  container.innerHTML = ''
  try {
    const res = await fetch('/My_Info/notes_section.txt')
    if (!res.ok) throw new Error('Failed to load notes.')
    const text = await res.text()
    const lines = text.split('\n')
    let currentTitle = ''
    let currentItems = []
    let html = ''
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('>')) {
        if (currentTitle && currentItems.length > 0) {
          html += buildNoteSection(currentTitle, currentItems)
        }
        currentTitle = trimmed.replace(/^>\s*/, '')
        currentItems = []
      } else if (trimmed !== '') {
        currentItems.push(trimmed)
      }
      if (index === lines.length - 1 && currentTitle && currentItems.length > 0) {
        html += buildNoteSection(currentTitle, currentItems)
      }
    })
    if (!html) html = `<div class="note-empty">No notes found.</div>`
    container.innerHTML = html
    addNoteToggleListeners()

    // Dispatch an event to indicate notes are rendered (for the loading screen)
    try {
      const notes = container ? Array.from(container.querySelectorAll('.note-block')) : []
      window.dispatchEvent(new CustomEvent('jm:notes-loaded', { detail: { count: notes.length } }))
    } catch (e) {}
  } catch (err) {
    container.innerHTML = `<p style="color:red;">⚠️ ${escapeHtmlLocal(err.message)}</p>`
    try { window.dispatchEvent(new CustomEvent('jm:notes-loaded', { detail: { count: 0 } })) } catch (e) {}
  }
}

if (typeof window !== 'undefined') {
  try { window.loadNotes = loadNotes } catch (e) {}
}
