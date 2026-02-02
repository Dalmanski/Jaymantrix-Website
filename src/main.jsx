import React, { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'

import '../firebaseConfig.js'

import Main from './pages/Main.jsx'
import LoadingPage from './pages/LoadingPage.jsx'

import './resources/css/base.css'
import './resources/css/games-section.css'
import './resources/css/notes-section.css'
import './resources/css/chat-section.css'
import './resources/css/gm-rec-section.css'
import './resources/css/about-section.css'
import './resources/css/loading-page.css'

import './components/CustomScrollbar.css'

const root = createRoot(document.getElementById('root'))

function App() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  const resolvedModulesRef = useRef([])
  const finishedCalledRef = useRef(false)

  useEffect(() => {
    const waitForStylesheets = () => {
      return new Promise(resolve => {
        const checkCSS = () => {
          let allLoaded = true
          for (let i = 0; i < document.styleSheets.length; i++) {
            try {
              const rules = document.styleSheets[i].cssRules
              if (rules === null) {
                allLoaded = false
                break
              }
            } catch (e) {
              if (e.name !== 'SecurityError') {
                allLoaded = false
                break
              }
            }
          }
          if (allLoaded && document.styleSheets.length > 0) {
            resolve()
          } else {
            requestAnimationFrame(checkCSS)
          }
        }
        if (document.styleSheets.length === 0) {
          requestAnimationFrame(checkCSS)
        } else {
          checkCSS()
        }
      })
    }

    const imports = []

    const addImport = (impPromise) => {
      const p = impPromise
        .then(mod => {
          resolvedModulesRef.current.push(mod)
          return mod
        })
        .catch(err => {
          console.warn('Import failed:', err)
          return undefined
        })
      imports.push(p)
      return p
    }

    const pScript = new Promise(resolve => {
      requestAnimationFrame(() => {
        import('./resources/js/script.js').then(resolve).catch(() => resolve(undefined))
      })
    }).then(mod => {
      resolvedModulesRef.current.push(mod)
      return mod
    })

    imports.push(pScript)
    addImport(import('./resources/js/games-section.js'))
    addImport(import('./resources/js/notes-section.js'))
    addImport(import('./resources/js/chat-section.js'))
    addImport(import('./resources/js/gm-rec-section.js'))
    addImport(import('./resources/js/about-section.js'))
    addImport(import('./resources/js/Observer.js'))

    let completed = 0
    const total = imports.length + 2 

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

    waitForStylesheets().then(() => tick())

    const checkFinish = setInterval(() => {
      if (completed >= total) {
        setProgress(100)
        setTimeout(() => {
          setVisible(false)

          if (!finishedCalledRef.current) {
            finishedCalledRef.current = true
            requestAnimationFrame(() => {
              const mods = resolvedModulesRef.current
              mods.forEach(mod => {
                if (!mod) return
                try {
                  if (typeof mod.init === 'function') {
                    mod.init()
                  } else if (typeof mod.default === 'function') {
                    mod.default()
                  } else if (typeof window.appInit === 'function') {
                    window.appInit()
                  } else {
                  }
                } catch (e) {
                  console.error('Error running init for module:', e)
                }
              })
            })
          }
        }, 300)
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

export default App
