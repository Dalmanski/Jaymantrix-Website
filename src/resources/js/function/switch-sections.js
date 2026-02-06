window.showSectionForCurrentPath = showSectionForCurrentPath;

function showSectionForCurrentPath() {
  const currentPath = window.location.pathname;
  if (currentPath === '/my-game-web') {
    if (window.showSection) window.showSection('game-web');
  } else if (currentPath === '/notes') {
    if (window.showSection) window.showSection('notes');
  } else if (currentPath === '/chat') {
    if (window.showSection) window.showSection('chat');
  } else if (currentPath === '/games' || currentPath === '/') {
    if (window.showSection) window.showSection('games');
  } else if (currentPath === '/game-record') {
    if (window.showSection) window.showSection('game-record');
  } else if (currentPath === '/about') {
    if (window.showSection) window.showSection('about');
  } else if (currentPath === '/YT-videos') {
    if (window.showSection) window.showSection('YT-videos');
  } else {
    if (window.showSection) window.showSection('games');
  }
}

window.showSectionForCurrentPath = showSectionForCurrentPath;

function showYTSectionRoute() {
  const sections = [
    'game-list',
    'notes-section',
    'gm-rec-section',
    'chat-section',
    'my-web-section',
    'about-section'
  ];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  import('../YT-vid-section.js').then(() => {
    if (window.showYTvidSection) window.showYTvidSection();
  });
}

function showSection(section) {
  const sections = {
    'games': 'game-list',
    'notes': 'notes-section',
    'game-record': 'gm-rec-section',
    'chat': 'chat-section',
    'game-web': 'my-web-section',
    'about': 'about-section',
    'YT-videos': 'yt-vid-section'
  };
  Object.values(sections).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (section === 'about') {
    const aboutEl = document.getElementById('about-section');
    if (aboutEl) aboutEl.style.display = 'block';
  }
  if (section === 'game-web') {
    import('../my-web-section.js').then(mod => {
      let sectionEl = document.getElementById('my-web-section');
      if (!sectionEl) {
        sectionEl = document.createElement('section');
        sectionEl.id = 'my-web-section';
        document.querySelector('.content-wrapper').appendChild(sectionEl);
      }
      sectionEl.style.display = 'block';
      if (mod && typeof mod.loadMyWebsites === 'function' && typeof mod.renderMyWebSection === 'function') {
        if (typeof mod.resetIdx === 'function') {
          mod.resetIdx();
        } else if (window) {
          window.myWebSectionIdx = 0;
        }
        mod.loadMyWebsites().then(() => {
          mod.renderMyWebSection();
        });
      }
    });
    history.replaceState({}, '', '/my-game-web');
    return;
  }
  const showId = sections[section];
  const showEl = document.getElementById(showId);
  if (showEl) {
    showEl.classList.remove('entering');
    void showEl.offsetWidth;
    showEl.classList.add('entering');
    setTimeout(() => {
      showEl.classList.remove('entering');
    }, 400);
    if (section === 'game-record') {
      showEl.style.display = 'flex';
    } else if (section === 'chat') {
      showEl.classList.add('align-top');
      showEl.style.display = 'flex';
      try { if (typeof renderQuickPrompts === 'function') renderQuickPrompts(); } catch (e) {}
      try {
        const header = showEl.querySelector('.chat-title') || showEl;
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        if (window.innerWidth <= 800) {
          setTimeout(() => {
            try { if (typeof scrollIntoViewWithOffset === 'function') scrollIntoViewWithOffset(header, Math.round(headerHeight + 8)); } catch (e) {}
          }, 300);
        } else {
          try { if (typeof scrollIntoViewWithOffset === 'function') scrollIntoViewWithOffset(header, Math.round(headerHeight + 8)); } catch (e) {}
        }
      } catch (e) {
        try { showEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      }
      setTimeout(() => {
        try {
          if (!showEl.dataset.initialAssistantMessageSent) {
            try { generateInitialAssistantMessage(); } catch (e) {}
            showEl.dataset.initialAssistantMessageSent = 'true';
          }
        } catch (e) {}
      }, 500);
      const footerEl = document.querySelector('footer');
      if (footerEl) footerEl.style.display = (typeof isMobileDevice === 'function' && isMobileDevice()) ? 'none' : '';
      try { updateFooterForChat(); } catch (e) {}
    } else {
      showEl.classList.remove('align-top');
      showEl.style.display = section === 'game-record' ? 'flex' : 'block';
    }
    if (section === 'about') {
      import('../about-section.js').then(mod => {
        if (mod && mod.showAboutSection) {
          showEl.style.display = 'block';
          mod.showAboutSection();
        }
      });
    }
    if (section === 'YT-videos') {
      import('../YT-vid-section.js').then(() => {
        if (window.showYTvidSection) window.showYTvidSection();
      });
    }
    history.replaceState({}, '', section === 'games' ? '/' : (section === 'YT-videos' ? '/YT-videos' : `/${section}`));
  }
  const btnGames = document.getElementById('btn-games');
  const btnNotes = document.getElementById('btn-notes');
  const btnGmRecord = document.getElementById('btn-gm-record');
  const chatTrigger = document.getElementById('chat-trigger');
  if (btnGames) btnGames.classList.toggle('active', section === 'games');
  if (btnNotes) btnNotes.classList.toggle('active', section === 'notes');
  if (btnGmRecord) btnGmRecord.classList.toggle('active', section === 'game-record');
  if (chatTrigger) chatTrigger.classList.toggle('active', section === 'chat');
  const leftNavItems = document.querySelectorAll('.left-nav-item');
  leftNavItems.forEach(item => {
    const sec = item.getAttribute('data-section');
    item.classList.toggle('active', section === sec);
  });
  if (window.gamespage && window.gamespage.categoryTabs) {
    const categoryTabs = window.gamespage.categoryTabs;
    if (section === 'games') {
      categoryTabs.style.display = 'flex';
      if (typeof categoryTabs._updateTop === 'function') {
        try { categoryTabs._updateTop(); } catch (e) {}
        requestAnimationFrame(() => { categoryTabs.getBoundingClientRect(); });
        setTimeout(() => { if (typeof categoryTabs._updateTop === 'function') categoryTabs._updateTop(); }, 120);
      }
    } else {
      categoryTabs.style.display = 'none';
    }
  }
  try { if (typeof window.updateDepthIndicatorNow === 'function') window.updateDepthIndicatorNow(); } catch (e) {}
}

function handleRoute() {
  if (window.location.pathname === '/my-game-web') {
    import('../my-web-section.js').then(() => {
      if (window.showMyWebSection) window.showMyWebSection();
    });
  } else if (window.location.pathname === '/YT-videos') {
    showYTSectionRoute();
  } else {
    if (window.showSection) {
      if (window.location.pathname === '/notes') window.showSection('notes');
      else if (window.location.pathname === '/chat') window.showSection('chat');
      else if (window.location.pathname === '/game-record') window.showSection('game-record');
      else if (window.location.pathname === '/about') window.showSection('about');
      else window.showSection('games');
    }
  }
}

window.addEventListener('popstate', handleRoute);
handleRoute();

window.navigateTo = function(path) {
  window.history.pushState({}, '', path);
  if (path === '/YT-videos') {
    showYTSectionRoute();
  } else if (path === '/my-game-web') {
    import('../my-web-section.js').then(() => {
      if (window.showMyWebSection) window.showMyWebSection();
    });
  } else {
    handleRoute();
  }
}

window.goToMyGameWeb = function() {
  if (window.location.pathname !== '/my-game-web') {
    window.history.pushState({}, '', '/my-game-web');
    import('../my-web-section.js').then(() => {
      if (window.showMyWebSection) window.showMyWebSection();
    });
  } else {
    import('../my-web-section.js').then(() => {
      if (window.showMyWebSection) window.showMyWebSection();
    });
  }
  if (window.closeLeftSidebar) window.closeLeftSidebar();
}

window.showSection = showSection
