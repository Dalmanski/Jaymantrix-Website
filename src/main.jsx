import React from 'react'
import { createRoot } from 'react-dom/client'
import Home from './pages/Home'
import './resources/css/base.css'
import './resources/css/games-section.css'
import './resources/css/notes-section.css'
import './resources/css/chat-section.css'

const root = createRoot(document.getElementById('root'))
root.render(<Home />)

// Defer loading legacy scripts to the next frame so React can commit DOM
requestAnimationFrame(() => {
  import('./resources/js/script.js').catch(() => {})
})
import('./resources/js/Observer.js').catch(() => {})
