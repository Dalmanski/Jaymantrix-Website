import '../css/about-section.css'

export function showAboutSection() {
  const aboutSection = document.getElementById('about-section')
  if (!aboutSection) return
  fetch('/changelog.txt')
    .then(r => r.text())
    .then(text => {
      aboutSection.innerHTML = `<h2 class='about-title'>About</h2><div class='about-box'>${escapeHtml(text)}</div>`
      aboutSection.classList.add('entering')
      setTimeout(() => aboutSection.classList.remove('entering'), 600)
    })
}

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
