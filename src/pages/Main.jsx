import React from 'react'
import typeSound from '../assets/audio/sound/type-sound.wav'
import sendSound from '../assets/audio/sound/send.mp3'
import notifSound from '../assets/audio/sound/notif.ogg'

export default function Home() {
  return (
    <>
      <div className="bg-gif" />
      <header>
        <div className="header-left">
          <button id="menu-toggle" className="menu-button" onClick={() => { if (window.toggleLeftSidebar) return window.toggleLeftSidebar(); }}>
            <i className="fas fa-bars" />
          </button>
          <h1 id="yt-header" />
        </div>

        <div className="header-controls">
          <nav>
            <button
              id="btn-games"
              className="nav-button"
              style={{ fontFamily: 'Poppins' }}
              onClick={() => {
                if (window.navigateTo) return window.navigateTo('/');
                window.showSection && window.showSection('games');
              }}
            >My Games</button>

            <button
              id="btn-yt-videos"
              className="nav-button"
              style={{ fontFamily: 'Poppins' }}
              onClick={() => {
                if (window.navigateTo) return window.navigateTo('/YT-videos');
                window.showSection && window.showSection('YT-videos');
                import('../resources/js/YT-vid-section.js').then(() => {
                  if (window.showYTvidSection) window.showYTvidSection();
                });
              }}
            >YT Videos</button>
          </nav>

          <div id="chat-trigger" className="chat-trigger" onClick={() => { if (window.navigateTo) return window.navigateTo('/chat'); if (window.showSection) window.showSection('chat'); import('../resources/js/chat-section.js').then(() => { if (window.bindChatUI) window.bindChatUI(); if (window.renderChatMessages) window.renderChatMessages(); }); setTimeout(() => { if (window.innerWidth <= 800) { const chatSection = document.getElementById('chat-section'); if (chatSection) chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 400); } } role="button" tabIndex={0} aria-label="Chat with Jaymantrix AI">
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
            <input type="text" id="searchInput" className="search-input" placeholder="Search Games / Videos..." />
          </div>

          <button id="settings-toggle" className="settings-button" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-cog" style={{ pointerEvents: 'none' }} /></button>
        </div>
      </header>

      <div id="left-sidebar-overlay" className="left-sidebar-overlay" aria-hidden="true" />

      <aside id="left-sidebar" className="left-sidebar" aria-hidden="true">
        <div className="left-sidebar-header">
          <div className="logo-row">
            <div id="yt-header-mini" className="logo-mini" />
          </div>
        </div>
        <nav className="left-sidebar-nav" role="navigation" aria-label="Main menu">
          <button className="left-nav-item chat-tab" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) return window.navigateTo('/chat'); if (window.showSection) window.showSection('chat'); if (window.closeLeftSidebar) window.closeLeftSidebar(); import('../resources/js/chat-section.js').then(() => { if (window.bindChatUI) window.bindChatUI(); if (window.renderChatMessages) window.renderChatMessages(); }); }}>Chat with Jaymantrix AI</button>
          <button className="left-nav-item" data-section="games" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) return window.navigateTo('/'); window.showSection && window.showSection('games'); if (window.closeLeftSidebar) window.closeLeftSidebar(); }}>My Games</button>
          <button className="left-nav-item" data-section="notes" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) return window.navigateTo('/notes'); window.showSection && window.showSection('notes'); if (window.closeLeftSidebar) window.closeLeftSidebar(); }}>Notes</button>
          <button className="left-nav-item" data-section="YT-videos" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) return window.navigateTo('/YT-videos'); window.showSection && window.showSection('YT-videos'); if (window.closeLeftSidebar) window.closeLeftSidebar(); import('../resources/js/YT-vid-section.js').then(() => { if (window.showYTvidSection) window.showYTvidSection(); }); }}>YouTube Videos</button>
          <button className="left-nav-item" data-section="game-record" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) return window.navigateTo('/game-record'); window.showSection && window.showSection('game-record'); if (window.closeLeftSidebar) window.closeLeftSidebar(); }}>Game Records</button>
          <button className="left-nav-item" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) window.navigateTo('/my-game-web'); if (window.showSection) window.showSection('game-web'); if (window.closeLeftSidebar) window.closeLeftSidebar(); }}>My Game Web</button>
          <button className="left-nav-item" data-section="about" style={{ fontFamily: 'Poppins', fontWeight: 600, fontSize: 16 }} onClick={() => { if (window.navigateTo) return window.navigateTo('/about'); if (window.showSection) window.showSection('about'); if (window.closeLeftSidebar) window.closeLeftSidebar(); import('../resources/js/about-section.js').then(mod => { if (mod && mod.showAboutSection) mod.showAboutSection(); }); }}>About</button>
        </nav>
      </aside>

      <div id="settings-panel" className="settings-panel" aria-hidden="true">
        <div className="settings-header">
          <h3>Settings</h3>
          <button id="settings-close" className="settings-close" aria-label="Close settings"><i className="fas fa-times" /></button>
        </div>

        <div className="mini-playlist">
          <button id="music-prev" className="music-btn" aria-label="Previous">◀</button>
          <div className="music-title-wrap"><div id="music-title" className="music-marquee" aria-hidden="true"><span>No music</span></div></div>
          <div className="mini-playlist-controls">
            <button id="music-next" className="music-btn" aria-label="Next">▶</button>
          </div>
        </div>

        <div className="settings-body">
          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-sounds">UI Sounds</label>
            <div style={{ marginLeft: 'auto' }}>
              <label className="switch">
                <input id="setting-sounds" type="checkbox" />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-music">Background Music</label>
            <div style={{ marginLeft: 'auto' }}>
              <label className="switch">
                <input id="setting-music" type="checkbox" />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-music-volume">Music Volume</label>
            <div className="volume-control" style={{ marginLeft: '12px' }}>
              <input id="setting-music-volume" className="volume-slider" type="range" min="0" max="1" step="0.01" />
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-typewriter">Typewriter Effect</label>
            <div style={{ marginLeft: 'auto' }}>
              <label className="switch">
                <input id="setting-typewriter" type="checkbox" />
                <span className="slider" />
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label" htmlFor="setting-typewriter-speed">Typewriter Speed</label>
            <input id="setting-typewriter-speed" type="number" step="0.001" min="0" max="1" className="speed-number" />
          </div>
        </div>
      </div>

      <audio id="bg-music" loop preload="auto" src={"/assets/audio/music/アークナイツ_ エンドフィールド BGM - Website Theme  Arknights_ Endfield明日方舟終末地 OST.mp3"} />
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

        <section id="yt-vid-section" className="yt-vid-section" style={{ display: 'none', paddingTop: 24 }}>
          <div id="yt-loading" className="yt-loading" style={{ display: 'none', textAlign: 'center', padding: 28 }}>Loading my YT Channel and Videos...<br />Pls wait...</div>
          <div className="container" id="yt-container">
            <div className="yt-vid-section-header">
              <div className="yt-header-information" aria-live="polite">
                <img src="" className="yt-header-pfp" alt="Channel" />
                <div className="yt-header-meta">
                  <h1 id="yt-channel-title">Channel Videos</h1>
                  <p className="yt-header-desc" data-full="">Latest uploads</p>
                  <div className="yt-channel-stats">
                    <div className="yt-videos-row"><a className="subscribe-btn" href={`https://www.youtube.com/channel/UCPrdw58ZZXJyKYXdcCGViWw`} target="_blank" rel="noreferrer">Subscribe</a><span>Subscribers: NA</span></div>
                    <div>Videos: NA</div>
                    <div>Total Views: NA</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="yt-vid-grid-wrap" />
            <div className="yt-vid-pagination" />
          </div>
        </section>

        <section id="my-web-section" style={{ display: 'none' }}></section>
        <section id="notes-section" style={{ display: 'none' }}>
          <h2>MY NOTES</h2>
          <div id="notes-container" />
        </section>

        <section id="gm-rec-section" style={{ display: 'none' }}>
          <h2>GAME RECORD</h2>
          <div id="gm-rec-block">
            <h3 id="gm-rec-game-name">Unknown Game</h3>
            <div className="gm-rec-container" id="gm-rec-container">
              <img id="gm-rec-img" alt="Game record" draggable="true" />
            </div>
            <p id="gm-rec-link-text">My updated record is found on this link: <a id="gm-rec-link" href="#" target="_blank" rel="noreferrer">Open record</a></p>
          </div>
        </section>

        <section id="about-section" style={{ display: 'none' }}></section>

        <section id="chat-section" style={{ display: 'none' }}>
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
