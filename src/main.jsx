import React from 'react'
import { createRoot } from 'react-dom/client'
import Main from './pages/Main.jsx'
import './resources/css/base.css'
import './resources/css/games-section.css'
import './resources/css/notes-section.css'
import './resources/css/chat-section.css'
import './resources/css/gm-rec-section.css'

const root = createRoot(document.getElementById('root'))
root.render(<Main />)

requestAnimationFrame(() => {
  import('./resources/js/script.js').catch(() => {})
})
import('./resources/js/games-section.js').catch(() => {})
import('./resources/js/notes-section.js').catch(() => {})
import('./resources/js/chat-section.js').catch(() => {})
import('./resources/js/gm-rec-section.js').catch(() => {})
import('./resources/js/Observer.js').catch(() => {})
