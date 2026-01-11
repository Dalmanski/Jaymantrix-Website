import React from 'react'
import { createRoot } from 'react-dom/client'
import Main from './pages/Main.jsx'
import LoadingPage from './pages/LoadingPage.jsx'
import './resources/css/base.css'
import './resources/css/games-section.css'
import './resources/css/notes-section.css'
import './resources/css/chat-section.css'
import './resources/css/gm-rec-section.css'
import './resources/css/loading-page.css'

import { useEffect, useState } from 'react'

const root = createRoot(document.getElementById('root'))

function App() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const imports = []

    const pScript = new Promise(resolve => {
      requestAnimationFrame(() => {
        import('./resources/js/script.js').then(resolve).catch(() => resolve())
      })
    })
    imports.push(pScript)

    const pGames = import('./resources/js/games-section.js').catch(() => {})
    const pNotes = import('./resources/js/notes-section.js').catch(() => {})
    const pChat = import('./resources/js/chat-section.js').catch(() => {})
    const pGm = import('./resources/js/gm-rec-section.js').catch(() => {})
    const pObs = import('./resources/js/Observer.js').catch(() => {})

    imports.push(pGames, pNotes, pChat, pGm, pObs)

    let completed = 0
    const total = imports.length + 1

    const tick = () => {
      completed += 1
      const pct = Math.min(100, Math.round((completed / total) * 100))
      setProgress(pct)
    }

    imports.forEach(p => p.then(() => tick()).catch(() => tick()))

    const onLoad = () => tick()
    if (document.readyState === 'complete') {
      onLoad()
    } else {
      window.addEventListener('load', onLoad, { once: true })
    }

    const checkFinish = setInterval(() => {
      if (completed >= total) {
        setProgress(100)
        setTimeout(() => setVisible(false), 300)
        clearInterval(checkFinish)
      }
    }, 80)

    return () => {
      clearInterval(checkFinish)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  return (
    <>
      <Main />
      <LoadingPage progress={progress} visible={visible} />
    </>
  )
}

root.render(<App />)
