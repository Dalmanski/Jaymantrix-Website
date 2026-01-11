// Home.jsx
import React from 'react'
import bgMusic from '../assets/audio/music/アークナイツ_ エンドフィールド BGM - Website Theme  Arknights_ Endfield明日方舟終末地 OST.mp3'
import typeSound from '../assets/audio/sound/type-sound.wav'
import sendSound from '../assets/audio/sound/send.mp3'
import notifSound from '../assets/audio/sound/notif.ogg'

export default function Home() {
  return (
    <>
      <div className="bg-gif" />
      <header>
        <h1 id="yt-header"></h1>
        <div className="header-controls">
            <nav>
            <button id="btn-games" className="nav-button" style={{ fontFamily: 'Poppins' }} onClick={() => { if (window.navigateTo) return window.navigateTo('/'); window.showSection && window.showSection('games') } }>My Games</button>
            <button id="btn-notes" className="nav-button" style={{ fontFamily: 'Poppins' }} onClick={() => { if (window.navigateTo) return window.navigateTo('/notes'); return window.showSection && window.showSection('notes') } }>Notes</button>
            <button id="btn-gm-record" className="nav-button" style={{ fontFamily: 'Poppins' }} onClick={() => { if (window.navigateTo) return window.navigateTo('/game-record'); return window.showSection && window.showSection('game-record') } }>Game Records</button>
          </nav>

          <div id="chat-trigger" className="chat-trigger" onClick={() => {if (window.navigateTo) return window.navigateTo('/chat'); return window.showSection && window.showSection('chat') } } role="button" tabIndex={0} aria-label="Chat with Jaymantrix AI">
            <div className="marquee" aria-hidden="true">
              <span>Chat with Jaymantrix AI&nbsp;&nbsp;</span>
              <span>Chat with Jaymantrix AI&nbsp;&nbsp;</span>
              <span>Chat with Jaymantrix AI&nbsp;&nbsp;</span>
            </div>
          </div>

          <div className="social-links">
            <a className="social-box" href="https://www.youtube.com/@Jaymantrix" target="_blank" aria-label="YouTube" rel="noreferrer">
              <i className="fab fa-youtube" />
              <span className="link-pop">youtube.com/@Jaymantrix</span>
            </a>
            <a className="social-box" href="https://www.facebook.com/Jaymantrixx" target="_blank" aria-label="Facebook" rel="noreferrer">
              <i className="fab fa-facebook-f" />
              <span className="link-pop">facebook.com/Jaymantrixx</span>
            </a>
            <a className="social-box" href="https://github.com/Dalmanski" target="_blank" aria-label="GitHub" rel="noreferrer">
              <i className="fab fa-github" />
              <span className="link-pop">github.com/Dalmanski</span>
            </a>
            <a className="social-box" href="https://www.youtube.com/@dalmanskigd" target="_blank" aria-label="YouTube 2" rel="noreferrer">
              <i className="fab fa-youtube" />
              <span className="link-pop">youtube.com/@dalmanskigd</span>
            </a>
          </div>

          <div className="search-container">
            <i className="fas fa-search search-icon" aria-hidden="true" />
            <input type="text" id="searchInput" className="search-input" placeholder="Search games..." />
          </div>

          <button id="settings-toggle" className="settings-button" aria-label="Settings"><i className="fas fa-cog" /></button>
        </div>
      </header>

      <aside id="settings-panel" className="settings-panel" aria-hidden="true">
        <div className="settings-header">
          <h3>Settings</h3>
          <button id="settings-close" className="settings-close" aria-label="Close">X</button>
        </div>
        <div className="settings-body">
          <div className="setting-item">
            <label className="switch">
              <input type="checkbox" id="setting-sounds" />
              <span className="slider" />
            </label>
            <span className="setting-label">Sounds</span>
          </div>

          <div className="setting-item">
            <label className="switch">
              <input type="checkbox" id="setting-music" />
              <span className="slider" />
            </label>
            <span className="setting-label">Music</span>
          </div>

          <div className="setting-item">
            <label className="switch">
              <input type="checkbox" id="setting-typewriter" />
              <span className="slider" />
            </label>
            <span className="setting-label">Typewriter Effect</span>
          </div>

          <div className="setting-item">
            <div className="speed-control">
              <label htmlFor="setting-typewriter-speed" className="setting-label">Typewriter Speed</label>
              <input id="setting-typewriter-speed" className="speed-number" type="number" min="0.01" max="1.00" step="0.01" defaultValue="0.015" aria-label="Typewriter speed in seconds" />
            </div>
          </div>
        </div>
      </aside>

      <audio id="bg-music" loop preload="auto" src={bgMusic} />
      <audio id="type-sound" preload="auto" src={typeSound} />
      <audio id="send-sound" preload="auto" src={sendSound} />
      <audio id="notif-sound" preload="auto" src={notifSound} />

      <div className="vertical-marquee-stage">
        <div className="vertical-marquee">
          <div className="vertical-marquee-content" id="marqueeLeft" />
        </div>

        <div className="vertical-marquee">
          <div className="vertical-marquee-content" id="marqueeRight" />
        </div>
      </div>

      <div className="content-wrapper" style={{ position: 'relative', zIndex: 2 }}>
        <main id="game-list" style={{ display: 'block' }}>
          <div className="count-row">
          <div className="game-count" id="game-count" />
          <div className="fetch-date" id="fetch-date" />
        </div>
          <div id="category-tabs" className="category-tabs" aria-label="Game categories" role="navigation" />
          <div id="game-list-content" />
        </main>

        <section id="notes-section" style={{ display: 'none' }}>
          <h2>MY NOTES</h2>
          <div id="notes-container" />
        </section>

        <section id="gm-rec-section" style={{ display: 'none' }}>
          <h2>GAME RECORD</h2>
          <p>You can drag the image up and down. Double click to show in full image<br />Make sure you log-in on their website to view my updated game record</p>
          <div id="gm-rec-block">    
            <h3 id="gm-rec-game-name">Unknown Game</h3>
            <div className="gm-rec-container" id="gm-rec-container">
              <img id="gm-rec-img" alt="Game record" draggable="true" />
            </div>
            <p id="gm-rec-link-text">My updated record is found on this link: <a id="gm-rec-link" href="#" target="_blank" rel="noreferrer">Open record</a></p>
          </div>
        </section>

        <section id="chat-section">
          <div className="chat-wrapper">
            <div className="chat-window">
              <div className="chat-header">
                <div className="chat-header-left">
                  <img src="https://via.placeholder.com/48x48?text=AI" alt="AI avatar" className="chat-avatar" />
                  <div className="chat-title">Jaymantrix AI <button id="ai-info" className="ai-info" aria-label="AI details" title="Show AI status"><i className="fas fa-info-circle" /></button></div>
                </div>
                <div className="chat-header-right">
                  <button className="chat-close" onClick={() => window.showSection && window.showSection('games')}><i className="fas fa-times" /></button>
                </div>
              </div>
              <div id="chat-messages" className="chat-messages" />
              <div className="chat-input-area">
                <input id="chat-input" type="text" placeholder="Say something to Jaymantrix AI..." />
                <button id="chat-send" className="chat-send"><i className="fas fa-paper-plane" /></button>
              </div>
            </div>
            <div className="chat-side">
              <h3>Quick prompts</h3>
              <ul id="quick-list" className="quick-list" aria-label="Quick prompts" />
            </div>
          </div>
        </section>

        <div id="ai-modal" className="modal-overlay" aria-hidden="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 id="modal-model-name">Jaymantrix AI</h2>
              <button id="modal-close" className="modal-close" aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p id="modal-model-desc">Model details loading...</p>
              <div className="api-status">
                <div id="api-progress" className="api-progress" role="progressbar" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0" />
                <div className="api-legend"><span className="legend-item"><span className="dot available" /> Available</span> <span className="legend-item"><span className="dot active" /> Active</span> <span className="legend-item"><span className="dot failed" /> Failed</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div id="bottom-gradient" className="bottom-gradient" aria-hidden="true" />

      <div id="depth-indicator" className="depth-indicator" aria-hidden="true">Depth: 0 px</div>

      <footer>
        <p>Copyright @ 2026 Jaymantrix. All rights reserved.</p>
      </footer>

      <div id="api-notification" className="api-notification" aria-hidden="true">
        <div className="api-notif-inner">
          <div className="api-notif-message" id="api-notif-message" />
          <button className="api-notif-close" id="api-notif-close" aria-label="Close">×</button>
        </div>
      </div>
    </>
  )
}
