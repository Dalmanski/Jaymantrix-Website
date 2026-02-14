function getDeviceInfo() {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    return {
      userAgent: nav.userAgent || '',
      platform: nav.platform || '',
      language: nav.language || '',
      vendor: nav.vendor || '',
      maxTouchPoints: nav.maxTouchPoints || 0,
      hardwareConcurrency: nav.hardwareConcurrency || 0
    };
  } catch (e) {
    return { userAgent: '', platform: '', language: '' };
  }
}

function getDeviceId() {
  try {
    const info = getDeviceInfo();
    const base = [info.userAgent || '', info.platform || '', info.language || ''].join('|');
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = ((hash << 5) - hash) + base.charCodeAt(i);
      hash |= 0;
    }
    return 'dev_' + Math.abs(hash);
  } catch (e) {
    return 'dev_unknown';
  }
}

function capitalize(str = '') {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLogEntry(section, action) {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  let hour = now.getHours();
  const min = now.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const time = `${hour}:${min} ${ampm}`;
  let actionText = '';
  if (action === 'enter' && section === 'website') actionText = 'Enter Website';
  else if (action === 'exit' && section === 'website') actionText = 'Exit Website';
  else if (action === 'enter') actionText = `Visit ${capitalize(section)} Section`;
  else if (action === 'exit') actionText = `Exit ${capitalize(section)} Section`;
  else actionText = `${capitalize(action)} ${capitalize(section)}`;
  return `[${date} at ${time}]: ${actionText}`;
}

async function logSectionEvent(section, action) {
  try {
    if (typeof window !== 'undefined' && window.firebaseDb) {
      const firestore = await import('firebase/firestore');
      const { doc, getDoc, setDoc } = firestore;
      const deviceId = getDeviceId();
      const deviceInfo = getDeviceInfo();
      const completeName = `${deviceId} - Device Info: ${deviceInfo.userAgent || 'unknown'} | ${deviceInfo.platform || 'unknown'} | ${deviceInfo.language || 'unknown'}`;
      const docRef = doc(window.firebaseDb, 'Section Logs', deviceId);
      const entry = formatLogEntry(section, action);
      let prevLog = [];
      try {
        const snap = await getDoc(docRef);
        if (snap.exists() && Array.isArray(snap.data().log)) {
          prevLog = snap.data().log;
        }
      } catch (e) {}
      prevLog.push(entry);
      await setDoc(docRef, { log: prevLog, completeName, deviceInfo }, { merge: true });
    }
  } catch (e) {}
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    logSectionEvent('website', 'enter');
  });
  window.addEventListener('beforeunload', () => {
    logSectionEvent('website', 'exit');
  });
}

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
    if (window.showSection) window.showSection('YT-videos');
  }).catch(() => {});
}

async function showSection(section) {
  const sections = {
    'notes': 'notes-section',
    'game-record': 'gm-rec-section',
    'chat': 'chat-section',
    'game-web': 'my-web-section',
    'about': 'about-section',
    'YT-videos': 'yt-vid-section',
    'games': 'game-list'
  };

  Object.values(sections).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  if (section === 'game-web') {
    import('../my-web-section.js').then(mod => {
      let sectionEl = document.getElementById('my-web-section');
      if (!sectionEl) {
        sectionEl = document.createElement('section');
        sectionEl.id = 'my-web-section';
        const wrapper = document.querySelector('.content-wrapper') || document.body;
        wrapper.appendChild(sectionEl);
      }
      sectionEl.style.display = 'block';
      if (mod) {
        if (typeof mod.resetIdx === 'function') {
          mod.resetIdx();
        } else {
          window.myWebSectionIdx = 0;
        }
        if (typeof mod.loadMyWebsites === 'function') {
          mod.loadMyWebsites().then(() => {
            if (typeof mod.renderMyWebSection === 'function') mod.renderMyWebSection();
          }).catch(() => {});
        }
      }
    }).catch(() => {});
    history.replaceState({}, '', '/my-game-web');
    logSectionEvent(section, 'enter');
    return;
  }

  const showId = sections[section];
  const showEl = showId ? document.getElementById(showId) : null;

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
            if (typeof generateInitialAssistantMessage === 'function') generateInitialAssistantMessage();
            showEl.dataset.initialAssistantMessageSent = 'true';
          }
        } catch (e) {}
      }, 500);
      const footerEl = document.querySelector('footer');
      if (footerEl) footerEl.style.display = (typeof isMobileDevice === 'function' && isMobileDevice()) ? 'none' : '';
      try { if (typeof updateFooterForChat === 'function') updateFooterForChat(); } catch (e) {}
    } else {
      showEl.classList.remove('align-top');
      showEl.style.display = section === 'game-record' ? 'flex' : 'block';
    }

    if (section === 'about') {
      import('../about-section.js').then(mod => {
        if (mod && typeof mod.showAboutSection === 'function') mod.showAboutSection();
      }).catch(() => {});
    }

    if (section === 'YT-videos') {
      import('../YT-vid-section.js').then(() => {
        if (window.showYTvidSection) window.showYTvidSection();
      }).catch(() => {});
    }

    history.replaceState({}, '', section === 'games' ? '/' : (section === 'YT-videos' ? '/YT-videos' : `/${section}`));
  }

  const headerNavButtons = document.querySelectorAll('.nav-button');
  headerNavButtons.forEach(btn => btn.classList.remove('active'));

  const btnGames = document.getElementById('btn-games');
  const btnNotes = document.getElementById('btn-notes');
  const btnGmRecord = document.getElementById('btn-gm-record');
  const btnYTVideos = document.getElementById('btn-yt-videos');
  const chatTrigger = document.getElementById('chat-trigger');

  if (btnGames && section === 'games') btnGames.classList.add('active');
  if (btnNotes && section === 'notes') btnNotes.classList.add('active');
  if (btnGmRecord && section === 'game-record') btnGmRecord.classList.add('active');
  if (btnYTVideos && section === 'YT-videos') btnYTVideos.classList.add('active');
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

  logSectionEvent(section, 'enter');
}

function handleRoute() {
  if (window.location.pathname === '/my-game-web') {
    import('../my-web-section.js').then(() => {
      if (window.showMyWebSection) window.showMyWebSection();
    }).catch(() => {});
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
    }).catch(() => {});
  } else {
    handleRoute();
  }
};

window.goToMyGameWeb = function() {
  if (window.location.pathname !== '/my-game-web') {
    window.history.pushState({}, '', '/my-game-web');
  }
  import('../my-web-section.js').then(() => {
    if (window.showMyWebSection) window.showMyWebSection();
  }).catch(() => {});
  if (window.closeLeftSidebar) window.closeLeftSidebar();
};

window.showSection = showSection;

export {};
