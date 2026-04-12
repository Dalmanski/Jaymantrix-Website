import {
  escapeHtml,
  decodeHtml,
  formatSeconds,
  numberToLocale,
  formatDate,
  formatBytes,
  estimateVideoBytes,
  fetchAllYTData,
  fetchPlaylistsForChannel,
  fetchPlaylistVideoIds,
  fetchChannelInfo,
  parseYouTubeLink,
  resolveToChannelId,
  getChannelIds,
  getChannelId,
  setChannelId,
  getCurrentChannelIndex,
  setCurrentChannelIndex,
  getAllYTChannelVideos,
  getAllYTChannelData,
  getCachedPlaylistItems,
  hasApiKey,
} from './function/yt-api.js';

function injectGlyphs() {
  if (document.getElementById('yt-glyphs')) return;
  const div = document.createElement('div');
  div.id = 'yt-glyphs';
  div.style.display = 'none';
  div.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <symbol id="icon-eye" viewBox="0 0 24 24">
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="icon-like" viewBox="0 0 24 24">
        <path d="M7 10v10a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-1.6l1.3-7A2 2 0 0 0 17.8 11H14V6.5A2.5 2.5 0 0 0 11.5 4L7 10z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M2 10h5v12H2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" /> 
      </symbol>
      <symbol id="icon-comment" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="icon-clock" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7v6l4 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
      <symbol id="icon-size" viewBox="0 0 24 24">
        <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2v6h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </symbol>
    </svg>
  `;
  document.body.insertBefore(div, document.body.firstChild || null);
}

function glyphHtml(name, title) {
  return `<svg class="yt-glyph-icon" role="img" aria-hidden="true" focusable="false" width="16" height="16"><use href="#${name}"></use></svg>${title ? ' ' + title : ''}`;
}

function formatSecondsToYMDHMS(totalSeconds) {
  let s = Number(totalSeconds) || 0;
  const SEC_PER_MIN = 60;
  const SEC_PER_HOUR = 60 * SEC_PER_MIN;
  const SEC_PER_DAY = 24 * SEC_PER_HOUR;
  const SEC_PER_MONTH = 30 * SEC_PER_DAY;
  const SEC_PER_YEAR = 365 * SEC_PER_DAY;

  const years = Math.floor(s / SEC_PER_YEAR);
  s = s % SEC_PER_YEAR;
  const months = Math.floor(s / SEC_PER_MONTH);
  s = s % SEC_PER_MONTH;
  const days = Math.floor(s / SEC_PER_DAY);
  s = s % SEC_PER_DAY;
  const hours = Math.floor(s / SEC_PER_HOUR);
  s = s % SEC_PER_HOUR;
  const minutes = Math.floor(s / SEC_PER_MIN);
  const seconds = Math.floor(s % SEC_PER_MIN);

  const parts = [
    { v: years, label: 'y' },
    { v: months, label: 'm' },
    { v: days, label: 'd' },
    { v: hours, label: 'h' },
    { v: minutes, label: 'm' },
    { v: seconds, label: 's' },
  ];

  const firstNonZeroIndex = parts.findIndex(p => p.v !== 0);
  if (firstNonZeroIndex === -1) {
    return '0s';
  }
  return parts.slice(firstNonZeroIndex).map(p => `${p.v}${p.label}`).join(' ');
}

function createVideoGrid(videos) {
  injectGlyphs();
  const grid = document.createElement('div');
  grid.className = 'yt-vid-grid';
  let html = '';
  const allVideos = Array.isArray(getAllYTChannelVideos()) ? getAllYTChannelVideos() : [];
  const totalVideos = allVideos.length ? allVideos.length : videos.length;

  videos.forEach(video => {
    const globalIdxRaw = allVideos.findIndex(v => v.id === video.id);
    const fallbackIdx = videos.indexOf(video) >= 0 ? videos.indexOf(video) + 1 : '';
    const globalIdx = globalIdxRaw >= 0 ? (totalVideos - globalIdxRaw) : fallbackIdx;
    const fullDescRaw = video.description || '';
    const fullDescDecoded = decodeHtml(fullDescRaw);
    const shortDescDecoded = fullDescDecoded.length > 180 ? fullDescDecoded.slice(0, 180) + '…' : fullDescDecoded;
    const escapedShort = escapeHtml(shortDescDecoded);
    const escapedFull = escapeHtml(fullDescDecoded);
    const durationText = formatSeconds(video.duration_seconds);
    const viewsNum = (video.view_count != null && video.view_count !== 'NA') ? numberToLocale(video.view_count) : 'NA';
    const lcount = (typeof video.like_count !== 'undefined' && video.like_count !== null) ? Number(video.like_count) : 0;
    const likesNum = (typeof video.like_count !== 'undefined' && video.like_count !== null) ? numberToLocale(video.like_count) : '0';
    const ccount = (typeof video.comment_count !== 'undefined' && video.comment_count !== null) ? Number(video.comment_count) : 0;
    const commentsNum = (typeof video.comment_count !== 'undefined' && video.comment_count !== null) ? numberToLocale(video.comment_count) : '0';
    const dateText = formatDate(video.upload_date);
    const dateBadge = `<div class="yt-vid-badge">${glyphHtml('icon-clock', escapeHtml(dateText))}</div>`;
    const viewsBadge = `<div class="yt-vid-badge">${glyphHtml('icon-eye', escapeHtml(viewsNum))}</div>`;
    const likesBadge = `<div class="yt-vid-badge yt-vid-like-badge" ${!lcount ? 'style="display:none;"' : ''}>${glyphHtml('icon-like', escapeHtml(likesNum))}</div>`;
    const commentsBadge = `<div class="yt-vid-badge yt-vid-comments-badge" ${!ccount ? 'style="display:none;"' : ''}>${glyphHtml('icon-comment', escapeHtml(commentsNum))}</div>`;
    const estimatedBytes = (typeof video.estimated_bytes !== 'undefined' && video.estimated_bytes !== null) ? video.estimated_bytes : (video.duration_seconds ? estimateVideoBytes(video.duration_seconds) : null);
    const estimatedSizeText = estimatedBytes ? formatBytes(estimatedBytes) : 'NA';
    const sizeBadge = `<div class="yt-vid-badge yt-vid-size-badge">${glyphHtml('icon-size', '')}${escapeHtml(estimatedSizeText)}</div>`;

    html += `
      <div class="yt-vid-item" data-video-id="${escapeHtml(video.id || '')}" data-desc-full="${escapedFull}" data-est-bytes="${estimatedBytes || ''}">
        <div class="yt-vid-thumb-wrap">
          <img class="yt-vid-thumb" alt="${escapeHtml((video.title || '').replace(/"/g, '&quot;'))}" src="${escapeHtml(video.thumbnail || '')}" />
          <div class="yt-duration-badge">${escapeHtml(durationText)}</div>
          <div class="yt-vid-idx">#${escapeHtml(String(globalIdx))}</div>
        </div>
        <div class="yt-vid-meta">
          <div class="yt-vid-title">${escapeHtml(video.title || '')}</div>
          <div class="yt-vid-info">
            ${dateBadge}
            ${viewsBadge}
            ${likesBadge}
            ${commentsBadge}
            ${sizeBadge}
          </div>
          <div class="yt-vid-desc">${escapedShort.replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;

  grid.querySelectorAll('.yt-vid-desc').forEach(descEl => {
    descEl.addEventListener('click', e => {
      e.stopPropagation();
      const item = descEl.closest('.yt-vid-item');
      if (!item) return;
      const vid = item.getAttribute('data-video-id');
      const video = getAllYTChannelVideos().find(v => v.id === vid);
      if (video && window.openVideoModal) window.openVideoModal(video);
    });
  });

  grid.querySelectorAll('.yt-vid-item').forEach(item => {
    item.addEventListener('click', e => {
      const target = e.target;
      if (target && (target.classList && (target.classList.contains('yt-vid-desc') || target.closest('.yt-vid-desc')))) return;
      const vid = item.getAttribute('data-video-id');
      const video = getAllYTChannelVideos().find(v => v.id === vid);
      if (video && window.openVideoModal) window.openVideoModal(video);
    });
  });

  return grid;
}

window.showYTvidSection = function() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (!path.endsWith('/YT-videos')) return;
  const section = document.getElementById('yt-vid-section');
  if (!section) return;
  const loadingEl = document.getElementById('yt-loading');
  const container = document.getElementById('yt-container');
  const gridWrap = container ? container.querySelector('.yt-vid-grid-wrap') : null;
  const paginationWrap = container ? container.querySelector('.yt-vid-pagination') : null;

  if (loadingEl) loadingEl.style.display = 'block';
  if (container) container.style.display = 'none';
  section.style.display = '';

  (async () => {
    try {
      await fetchAllYTData();
    } catch (e) {
      console.error(e);
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      if (container) container.style.display = '';
    }

    const searchInput = document.getElementById('searchInput');
    let currentPage = 1;
    const videosPerPage = 21;
    let sortBy = 'Date';
    let sortOrder = 'desc';
    let showAll = false;
    let commentsOnly = false;
    let likesOnly = false;
    let videoTypeFilter = 'all';
    let playlistFilterSet = null;
    let playlistSelectedValue = '__all__';
    let playlistOptions = [];
    let playlistSearchTerm = '';
    let playlistDropdownOpen = false;
    let resizeBound = false;
    let outsideClickBound = false;

    function isMobileLayout() {
      return window.matchMedia && window.matchMedia('(max-width:720px)').matches;
    }

    function adjustSelectWidth(selectEl) {
      if (!selectEl) return;
      if (isMobileLayout()) {
        if (selectEl.classList.contains('sort-select') || selectEl.classList.contains('video-type-select')) {
          selectEl.style.width = 'auto';
          selectEl.style.minWidth = '0';
          selectEl.style.flex = '1 1 auto';
          return;
        }
        selectEl.style.width = '100%';
        selectEl.style.minWidth = '100%';
        return;
      }
      const computed = window.getComputedStyle(selectEl);
      const font = computed.font || `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const labelEl = selectEl.querySelector ? selectEl.querySelector('.playlist-select-label') : null;
      const opt = selectEl.options ? selectEl.options[selectEl.selectedIndex] : null;
      const text = labelEl ? labelEl.textContent : (opt ? opt.text : (selectEl.value || ''));
      const span = document.createElement('span');
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'nowrap';
      span.style.font = font;
      span.textContent = text || '';
      document.body.appendChild(span);
      const textWidth = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      const paddingLeft = parseFloat(computed.paddingLeft) || 0;
      const paddingRight = parseFloat(computed.paddingRight) || 0;
      const borderLeft = parseFloat(computed.borderLeftWidth) || 0;
      const borderRight = parseFloat(computed.borderRightWidth) || 0;
      const extra = paddingLeft + paddingRight + borderLeft + borderRight;
      const widthPx = Math.ceil(textWidth + extra + 30);
      selectEl.style.width = widthPx + 'px';
      if (!selectEl.style.minWidth) {
        selectEl.style.minWidth = '72px';
      }
      selectEl.style.flex = '';
    }

    function measureTextWidth(text, font) {
      const span = document.createElement('span');
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.style.whiteSpace = 'nowrap';
      span.style.font = font;
      span.textContent = text || '';
      document.body.appendChild(span);
      const width = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      return width;
    }

    function syncToolbarLayout(toolbar) {
      if (!toolbar) return;
      const sortActions = toolbar.querySelector('.sort-actions');
      const sortGroup = toolbar.querySelector('.sort-select-group');
      const sortSelect = toolbar.querySelector('.sort-select');
      const videoTypeGroup = toolbar.querySelector('.video-type-select-group');
      const videoTypeSelect = toolbar.querySelector('.video-type-select');
      const sortBtn = toolbar.querySelector('.sort-btn');
      const playlistWrapper = toolbar.querySelector('.playlist-dropdown-wrapper');
      if (!sortActions || !sortGroup || !sortSelect || !sortBtn) return;

      sortActions.style.display = 'inline-flex';
      sortActions.style.width = '100%';
      sortActions.style.alignItems = isMobileLayout() ? 'flex-start' : 'center';
      sortActions.style.gap = '8px';
      sortActions.style.flexWrap = 'wrap';

      if (playlistWrapper) {
        playlistWrapper.style.flex = '1 1 auto';
        playlistWrapper.style.width = isMobileLayout() ? '100%' : 'auto';
      }

      if (videoTypeGroup) {
        videoTypeGroup.style.display = 'inline-flex';
        videoTypeGroup.style.alignItems = 'center';
        videoTypeGroup.style.gap = '8px';
        videoTypeGroup.style.flex = '0 1 auto';
        videoTypeGroup.style.width = isMobileLayout() ? '100%' : 'auto';
      }

      if (videoTypeSelect) {
        videoTypeSelect.style.flex = '1 1 auto';
        videoTypeSelect.style.minWidth = '0';
        if (isMobileLayout()) {
          videoTypeSelect.style.width = 'auto';
        }
      }

      sortGroup.style.display = 'inline-flex';
      sortGroup.style.alignItems = 'center';
      sortGroup.style.gap = '8px';
      sortGroup.style.flex = '0 1 auto';
      sortGroup.style.width = isMobileLayout() ? '100%' : 'auto';

      sortSelect.style.flex = '1 1 auto';
      sortSelect.style.minWidth = '0';
      if (isMobileLayout()) {
        sortSelect.style.width = 'auto';
      }

      sortBtn.style.flex = '0 0 40px';
    }

    function syncPlaylistDropdownWidth(toolbar) {
      if (!toolbar) return;
      const menu = toolbar.querySelector('.playlist-dropdown-menu');
      const button = toolbar.querySelector('.playlist-select');
      const input = toolbar.querySelector('.playlist-search-input');
      if (!menu || !button) return;

      if (isMobileLayout()) {
        menu.style.width = '100%';
        menu.style.minWidth = '100%';
        return;
      }

      const computed = window.getComputedStyle(menu);
      const buttonComputed = window.getComputedStyle(button);
      const menuFont = computed.font || `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
      const inputFont = input ? (window.getComputedStyle(input).font || `${window.getComputedStyle(input).fontWeight} ${window.getComputedStyle(input).fontSize} ${window.getComputedStyle(input).fontFamily}`) : menuFont;
      const allLabel = 'All Videos Playlist';
      const labels = [allLabel, ...((playlistOptions || []).map(p => String(p.title || p.id || '')))];
      const visibleLabels = labels.filter(Boolean);

      const textWidths = visibleLabels.map(t => measureTextWidth(t, menuFont));
      const inputPlaceholderWidth = measureTextWidth(input ? (input.getAttribute('placeholder') || '') : 'Search playlists', inputFont);
      const buttonText = button.querySelector('.playlist-select-label') ? button.querySelector('.playlist-select-label').textContent : allLabel;
      const buttonTextWidth = measureTextWidth(buttonText, buttonComputed.font || menuFont);

      const maxTextWidth = Math.max(
        180,
        inputPlaceholderWidth,
        buttonTextWidth,
        ...textWidths
      );

      const menuPaddingLeft = parseFloat(computed.paddingLeft) || 0;
      const menuPaddingRight = parseFloat(computed.paddingRight) || 0;
      const menuBorderLeft = parseFloat(computed.borderLeftWidth) || 0;
      const menuBorderRight = parseFloat(computed.borderRightWidth) || 0;
      const innerExtra = menuPaddingLeft + menuPaddingRight + menuBorderLeft + menuBorderRight + 24;

      const viewportMax = Math.max(240, window.innerWidth - 24);
      const widthPx = Math.min(Math.ceil(maxTextWidth + innerExtra), viewportMax);

      menu.style.width = widthPx + 'px';
      menu.style.minWidth = widthPx + 'px';
    }

    function getPlaylistLabel(value) {
      if (!value || value === '__all__') return 'All Videos Playlist';
      const found = playlistOptions.find(p => String(p.id || '') === String(value));
      return found ? String(found.title || found.id || '') : String(value);
    }

    function closePlaylistDropdown() {
      const toolbar = container ? container.querySelector('.yt-vid-toolbar') : null;
      if (!toolbar) return;
      const menu = toolbar.querySelector('.playlist-dropdown-menu');
      const button = toolbar.querySelector('.playlist-select');
      playlistDropdownOpen = false;
      if (menu) menu.hidden = true;
      if (button) button.setAttribute('aria-expanded', 'false');
    }

    function renderPlaylistDropdown(toolbar) {
      const wrapper = toolbar.querySelector('.playlist-dropdown-wrapper');
      if (!wrapper) return;
      const button = wrapper.querySelector('.playlist-select');
      const menu = wrapper.querySelector('.playlist-dropdown-menu');
      const input = wrapper.querySelector('.playlist-search-input');
      const list = wrapper.querySelector('.playlist-dropdown-list');
      if (!button || !menu || !input || !list) return;

      button.querySelector('.playlist-select-label').textContent = getPlaylistLabel(playlistSelectedValue);
      button.setAttribute('aria-expanded', playlistDropdownOpen ? 'true' : 'false');
      menu.hidden = !playlistDropdownOpen;
      input.value = playlistSearchTerm;
      list.innerHTML = '';

      const q = playlistSearchTerm.trim().toLowerCase();
      const filtered = (playlistOptions || []).filter(p => {
        const t = String(p.title || p.id || '').toLowerCase();
        const id = String(p.id || '').toLowerCase();
        return !q || t.includes(q) || id.includes(q);
      });

      const allActive = !playlistSelectedValue || playlistSelectedValue === '__all__';

      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = `playlist-dropdown-item ${allActive ? 'active' : ''}`;
      allBtn.textContent = 'All Videos Playlist';
      allBtn.addEventListener('click', async () => {
        playlistSelectedValue = '__all__';
        playlistFilterSet = null;
        playlistSearchTerm = '';
        playlistDropdownOpen = false;
        closePlaylistDropdown();
        currentPage = 1;
        showAll = false;
        renderPage(1);
      });
      list.appendChild(allBtn);

      if (filtered.length) {
        filtered.forEach(p => {
          const value = String(p.id || '');
          const active = String(playlistSelectedValue || '__all__') === value;
          const itemBtn = document.createElement('button');
          itemBtn.type = 'button';
          itemBtn.className = `playlist-dropdown-item ${active ? 'active' : ''}`;
          itemBtn.textContent = String(p.title || p.id || '');
          itemBtn.title = String(p.id || '');
          itemBtn.addEventListener('click', async () => {
            await applyPlaylistSelection(value);
            playlistDropdownOpen = false;
            closePlaylistDropdown();
          });
          list.appendChild(itemBtn);
        });
      } else {
        const empty = document.createElement('div');
        empty.className = 'playlist-dropdown-empty';
        empty.textContent = 'No playlists found';
        list.appendChild(empty);
      }

      syncPlaylistDropdownWidth(toolbar);
      syncToolbarLayout(toolbar);
    }

    async function populatePlaylistOptions(toolbar, selectedValue) {
      const playlistSelect = toolbar.querySelector('.playlist-select');
      if (!playlistSelect) return;
      try {
        playlistOptions = await fetchPlaylistsForChannel(getChannelId());
      } catch (e) {
        playlistOptions = [];
      }
      if (selectedValue && Array.from(['__all__', ...(playlistOptions || []).map(p => String(p.id || ''))]).includes(String(selectedValue))) {
        playlistSelectedValue = selectedValue;
      } else if (!playlistSelectedValue) {
        playlistSelectedValue = '__all__';
      }
      renderPlaylistDropdown(toolbar);
    }

    async function ensurePlaylistsPopulated(toolbar) {
      await populatePlaylistOptions(toolbar, playlistSelectedValue);
    }

    function isShortVideo(video) {
      const seconds = Number(video && video.duration_seconds) || 0;
      return seconds > 0 && seconds <= 60;
    }

    function getBaseVideos() {
      let arr = Array.isArray(getAllYTChannelVideos()) ? getAllYTChannelVideos().slice() : [];
      if (searchInput && searchInput.value) {
        const q = searchInput.value.toLowerCase();
        arr = arr.filter(v => (v.title || '').toLowerCase().includes(q));
      }
      if (playlistFilterSet && playlistFilterSet.size) {
        arr = arr.filter(v => playlistFilterSet.has(v.id));
      }
      if (videoTypeFilter === 'videos') {
        arr = arr.filter(v => !isShortVideo(v));
      } else if (videoTypeFilter === 'shorts') {
        arr = arr.filter(v => isShortVideo(v));
      }
      return arr;
    }

    function applyFiltersAndSort(arr) {
      let out = arr.slice();
      if (commentsOnly) out = out.filter(v => Number(v.comment_count) > 0);
      if (likesOnly) out = out.filter(v => Number(v.like_count) > 0);
      if (sortBy === 'Views') {
        out.sort((a, b) => {
          const va = Number(a.view_count) || 0;
          const vb = Number(b.view_count) || 0;
          return sortOrder === 'asc' ? va - vb : vb - va;
        });
      } else if (sortBy === 'Duration') {
        out.sort((a, b) => {
          const va = Number(a.duration_seconds) || 0;
          const vb = Number(b.duration_seconds) || 0;
          return sortOrder === 'asc' ? va - vb : vb - va;
        });
      } else if (sortBy === 'Comments') {
        out.sort((a, b) => {
          const va = Number(a.comment_count) || 0;
          const vb = Number(b.comment_count) || 0;
          return sortOrder === 'asc' ? va - vb : vb - va;
        });
      } else if (sortBy === 'Likes') {
        out.sort((a, b) => {
          const va = Number(a.like_count) || 0;
          const vb = Number(b.like_count) || 0;
          return sortOrder === 'asc' ? va - vb : vb - va;
        });
      } else if (sortBy === 'Size') {
        out.sort((a, b) => {
          const va = Number(a.estimated_bytes) || 0;
          const vb = Number(b.estimated_bytes) || 0;
          return sortOrder === 'asc' ? va - vb : vb - va;
        });
      } else {
        out.sort((a, b) => {
          const da = a.upload_date ? new Date(a.upload_date).getTime() : 0;
          const db = b.upload_date ? new Date(b.upload_date).getTime() : 0;
          return sortOrder === 'asc' ? da - db : db - da;
        });
      }
      return out;
    }

    async function applyPlaylistSelection(val) {
      const toolbar = container ? container.querySelector('.yt-vid-toolbar') : null;
      const nextValue = val || '__all__';
      playlistSelectedValue = nextValue;
      if (nextValue === '__all__') {
        playlistFilterSet = null;
        playlistSearchTerm = '';
        renderPlaylistDropdown(toolbar);
        currentPage = 1;
        showAll = false;
        renderPage(1);
        return;
      }
      const cached = getCachedPlaylistItems(nextValue);
      if (cached) {
        playlistFilterSet = cached;
        playlistSearchTerm = '';
        renderPlaylistDropdown(toolbar);
        currentPage = 1;
        showAll = false;
        renderPage(1);
        return;
      }
      if (!hasApiKey()) {
        playlistFilterSet = null;
        playlistSearchTerm = '';
        renderPlaylistDropdown(toolbar);
        currentPage = 1;
        showAll = false;
        renderPage(1);
        return;
      }
      if (loadingEl) loadingEl.style.display = 'block';
      try {
        const ids = await fetchPlaylistVideoIds(nextValue);
        playlistFilterSet = ids;
      } catch (e) {
        playlistFilterSet = null;
      } finally {
        if (loadingEl) loadingEl.style.display = 'none';
      }
      playlistSearchTerm = '';
      renderPlaylistDropdown(toolbar);
      currentPage = 1;
      showAll = false;
      renderPage(1);
    }

    function renderToolbar() {
      let toolbar = container.querySelector('.yt-vid-toolbar');
      if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'yt-vid-toolbar';
        toolbar.innerHTML = `
          <div class="videos-found" aria-live="polite"></div>
          <div class="sort-controls">
            <div class="toggle-group">
              <button class="comments-btn" type="button"><span class="btn-inner"><span class="check" aria-hidden="true">✓</span><span class="label">Comments</span></span></button>
              <button class="likes-btn" type="button"><span class="btn-inner"><span class="check" aria-hidden="true">✓</span><span class="label">Likes</span></span></button>
            </div>
            <div class="sort-actions">
              <div class="playlist-dropdown-wrapper sort-action">
                <button class="playlist-select sort-action" type="button" aria-expanded="false">
                  <span class="playlist-select-label">All Videos Playlist</span>
                  <span class="playlist-select-caret">▾</span>
                </button>
                <div class="playlist-dropdown-menu" hidden>
                  <input class="playlist-search-input" type="text" placeholder="Search playlists" autocomplete="off" />
                  <div class="playlist-dropdown-list"></div>
                </div>
              </div>
              <div class="video-type-select-group">
                <select class="video-type-select sort-action">
                  <option value="all">All Videos</option>
                  <option value="videos">Videos</option>
                  <option value="shorts">Shorts</option>
                </select>
              </div>
              <div class="sort-select-group">
                <select class="sort-select sort-action"><option value="Date">Date</option><option value="Views">Views</option><option value="Duration">Duration</option><option value="Comments">Comments</option><option value="Likes">Likes</option><option value="Size">Video Size</option></select>
                <button class="sort-btn sort-action" type="button" title="Toggle sort order"><span class="icon">▼</span></button>
              </div>
            </div>
          </div>
        `;
        gridWrap.parentNode.insertBefore(toolbar, gridWrap);

        const select = toolbar.querySelector('.sort-select');
        const videoTypeSelect = toolbar.querySelector('.video-type-select');
        const playlistButton = toolbar.querySelector('.playlist-select');
        const playlistInput = toolbar.querySelector('.playlist-search-input');
        const sortBtn = toolbar.querySelector('.sort-btn');
        const commentsBtn = toolbar.querySelector('.comments-btn');
        const likesBtn = toolbar.querySelector('.likes-btn');
        const sortGroup = toolbar.querySelector('.sort-select-group');
        const videoTypeGroup = toolbar.querySelector('.video-type-select-group');
        const playlistWrapper = toolbar.querySelector('.playlist-dropdown-wrapper');

        if (sortGroup) {
          sortGroup.style.display = 'inline-flex';
          sortGroup.style.alignItems = 'center';
          sortGroup.style.gap = '8px';
          sortGroup.style.flex = '0 1 auto';
        }

        if (videoTypeGroup) {
          videoTypeGroup.style.display = 'inline-flex';
          videoTypeGroup.style.alignItems = 'center';
          videoTypeGroup.style.gap = '8px';
          videoTypeGroup.style.flex = '0 1 auto';
        }

        select.addEventListener('change', e => {
          sortBy = e.target.value;
          currentPage = 1;
          showAll = false;
          adjustSelectWidth(select);
          renderPage(1);
        });

        videoTypeSelect.addEventListener('change', e => {
          videoTypeFilter = e.target.value;
          currentPage = 1;
          showAll = false;
          adjustSelectWidth(videoTypeSelect);
          renderPage(1);
        });

        playlistButton.addEventListener('click', e => {
          e.stopPropagation();
          playlistDropdownOpen = !playlistDropdownOpen;
          renderPlaylistDropdown(toolbar);
          if (playlistDropdownOpen && playlistInput) {
            setTimeout(() => playlistInput.focus(), 0);
          }
        });

        playlistInput.addEventListener('click', e => {
          e.stopPropagation();
        });

        playlistInput.addEventListener('input', e => {
          playlistSearchTerm = e.target.value || '';
          renderPlaylistDropdown(toolbar);
        });

        playlistInput.addEventListener('keydown', async e => {
          if (e.key === 'Escape') {
            playlistDropdownOpen = false;
            closePlaylistDropdown();
            playlistButton.focus();
          }
          if (e.key === 'Enter') {
            const q = (playlistSearchTerm || '').trim().toLowerCase();
            const filtered = (playlistOptions || []).filter(p => {
              const t = String(p.title || p.id || '').toLowerCase();
              const id = String(p.id || '').toLowerCase();
              return !q || t.includes(q) || id.includes(q);
            });
            if (filtered.length === 1) {
              await applyPlaylistSelection(filtered[0].id);
              playlistDropdownOpen = false;
              closePlaylistDropdown();
            }
          }
        });

        sortBtn.addEventListener('click', () => {
          sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
          const ico = sortBtn.querySelector('.icon');
          if (ico) ico.textContent = sortOrder === 'asc' ? '▲' : '▼';
          currentPage = 1;
          showAll = false;
          renderPage(1);
        });

        commentsBtn.addEventListener('click', () => {
          commentsOnly = !commentsOnly;
          if (commentsOnly) {
            commentsBtn.classList.add('active');
            commentsBtn.setAttribute('aria-pressed', 'true');
          } else {
            commentsBtn.classList.remove('active');
            commentsBtn.setAttribute('aria-pressed', 'false');
          }
          currentPage = 1;
          showAll = false;
          renderPage(1);
        });

        likesBtn.addEventListener('click', () => {
          likesOnly = !likesOnly;
          if (likesOnly) {
            likesBtn.classList.add('active');
            likesBtn.setAttribute('aria-pressed', 'true');
          } else {
            likesBtn.classList.remove('active');
            likesBtn.setAttribute('aria-pressed', 'false');
          }
          currentPage = 1;
          showAll = false;
          renderPage(1);
        });

        if (!resizeBound) {
          resizeBound = true;
          window.addEventListener('resize', () => {
            adjustSelectWidth(select);
            adjustSelectWidth(videoTypeSelect);
            adjustSelectWidth(playlistButton);
            syncPlaylistDropdownWidth(toolbar);
            syncToolbarLayout(toolbar);
          });
        }

        if (!outsideClickBound) {
          outsideClickBound = true;
          document.addEventListener('pointerdown', e => {
            const activeToolbar = container ? container.querySelector('.yt-vid-toolbar') : null;
            if (!activeToolbar) return;
            const activeWrapper = activeToolbar.querySelector('.playlist-dropdown-wrapper');
            if (!activeWrapper) return;
            if (activeWrapper.contains(e.target)) return;
            closePlaylistDropdown();
          }, true);
        }

        ensurePlaylistsPopulated(toolbar).catch(() => {});
        setTimeout(() => {
          adjustSelectWidth(select);
          adjustSelectWidth(videoTypeSelect);
          adjustSelectWidth(playlistButton);
          syncPlaylistDropdownWidth(toolbar);
          syncToolbarLayout(toolbar);
        }, 50);
      } else {
        ensurePlaylistsPopulated(toolbar).catch(() => {});
      }

      const leftEl = toolbar.querySelector('.videos-found');
      const filtered = applyFiltersAndSort(getBaseVideos());
      leftEl.textContent = `Videos Found: ${filtered.length}`;

      const selectEl = toolbar.querySelector('.sort-select');
      if (selectEl) {
        selectEl.value = sortBy || 'Date';
        adjustSelectWidth(selectEl);
      }

      const videoTypeSelectEl = toolbar.querySelector('.video-type-select');
      if (videoTypeSelectEl) {
        videoTypeSelectEl.value = videoTypeFilter || 'all';
        adjustSelectWidth(videoTypeSelectEl);
      }

      const playlistButton = toolbar.querySelector('.playlist-select');
      if (playlistButton) {
        playlistButton.querySelector('.playlist-select-label').textContent = getPlaylistLabel(playlistSelectedValue);
        adjustSelectWidth(playlistButton);
      }

      const sortBtnEl = toolbar.querySelector('.sort-btn');
      if (sortBtnEl) {
        const ico = sortBtnEl.querySelector('.icon');
        if (ico) ico.textContent = sortOrder === 'asc' ? '▲' : '▼';
      }

      const commentsBtnEl = toolbar.querySelector('.comments-btn');
      if (commentsBtnEl) {
        if (commentsOnly) commentsBtnEl.classList.add('active'); else commentsBtnEl.classList.remove('active');
      }

      const likesBtnEl = toolbar.querySelector('.likes-btn');
      if (likesBtnEl) {
        if (likesOnly) likesBtnEl.classList.add('active'); else likesBtnEl.classList.remove('active');
      }

      syncToolbarLayout(toolbar);
      renderPlaylistDropdown(toolbar);
    }

    function renderPage(page) {
      currentPage = page;
      renderToolbar();
      if (!gridWrap) return;
      gridWrap.innerHTML = '';
      const sorted = applyFiltersAndSort(getBaseVideos());
      if (showAll) {
        gridWrap.appendChild(createVideoGrid(sorted));
      } else {
        const start = (page - 1) * videosPerPage;
        const end = start + videosPerPage;
        const slice = sorted.slice(start, end);
        gridWrap.appendChild(createVideoGrid(slice));
      }
      renderPagination();
    }

    function renderPagination() {
      if (!paginationWrap) return;
      paginationWrap.innerHTML = '';
      const sorted = applyFiltersAndSort(getBaseVideos());
      const total = Math.max(1, Math.ceil(sorted.length / videosPerPage));
      const remaining = Math.max(0, sorted.length - videosPerPage);

      if (!showAll && total > 1) {
        let navHtml = '<div class="yt-pagination-nav">';
        navHtml += `<button class="arrow-btn" data-page="1"><<</button>`;
        navHtml += `<button class="arrow-btn" data-action="prev"><</button>`;
        for (let i = 1; i <= total; i++) {
          if (i === 1 || i === total || Math.abs(i - currentPage) <= 1) {
            navHtml += `<button class="page-btn" data-page="${i}" ${i === currentPage ? 'disabled class="active"' : ''}>${i}</button>`;
          } else if (i === currentPage - 2 || i === currentPage + 2) {
            navHtml += `<span class="dots">...</span>`;
          }
        }
        navHtml += `<button class="arrow-btn" data-action="next">></button>`;
        navHtml += `<button class="arrow-btn" data-page="${total}">>></button>`;
        navHtml += `</div>`;
        paginationWrap.innerHTML = navHtml;

        paginationWrap.querySelectorAll('.page-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const p = Number(btn.getAttribute('data-page'));
            renderPage(p);
          });
        });
        const prevBtn = paginationWrap.querySelector('[data-action="prev"]');
        if (prevBtn) prevBtn.addEventListener('click', () => { if (currentPage > 1) renderPage(currentPage - 1); });
        const nextBtn = paginationWrap.querySelector('[data-action="next"]');
        if (nextBtn) nextBtn.addEventListener('click', () => { if (currentPage < total) renderPage(currentPage + 1); });
        const firstBtn = paginationWrap.querySelector('[data-page="1"]');
        if (firstBtn) firstBtn.addEventListener('click', () => renderPage(1));
        const lastBtn = paginationWrap.querySelector(`[data-page="${total}"]`);
        if (lastBtn) lastBtn.addEventListener('click', () => renderPage(total));
      }

      if (remaining > 0) {
        const showAllWrap = document.createElement('div');
        showAllWrap.className = 'show-all-wrap';
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'show-all-btn';
        showAllBtn.textContent = showAll ? `Hide all ${Math.max(0, sorted.length - videosPerPage)} videos` : `Show all ${remaining} videos`;
        showAllBtn.addEventListener('click', () => {
          showAll = !showAll;
          renderPage(1);
        });
        showAllWrap.appendChild(showAllBtn);
        paginationWrap.appendChild(showAllWrap);
      } else if (showAll && sorted.length > 0) {
        const showAllWrap = document.createElement('div');
        showAllWrap.className = 'show-all-wrap';
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'show-all-btn';
        showAllBtn.textContent = `Hide all ${Math.max(0, sorted.length - videosPerPage)} videos`;
        showAllBtn.addEventListener('click', () => {
          showAll = false;
          renderPage(1);
        });
        showAllWrap.appendChild(showAllBtn);
        paginationWrap.appendChild(showAllWrap);
      }
    }

    async function loadChannelById(newId) {
      if (!newId) return;
      setChannelId(newId);
      if (loadingEl) loadingEl.style.display = 'block';
      if (container) container.style.display = 'none';
      try {
        await fetchAllYTData();
      } catch (e) {
        console.error(e);
      }
      if (loadingEl) loadingEl.style.display = 'none';
      if (container) container.style.display = '';
      playlistFilterSet = null;
      playlistSelectedValue = '__all__';
      playlistSearchTerm = '';
      const toolbarEl = container.querySelector('.yt-vid-toolbar');
      if (toolbarEl) {
        try {
          await ensurePlaylistsPopulated(toolbarEl);
        } catch (err) {}
        renderPlaylistDropdown(toolbarEl);
      }
      currentPage = 1;
      showAll = false;
      renderToolbar();
      renderPage(1);
      updateHeaderInformation();
    }

    async function updateHeaderInformation() {
      injectGlyphs();
      const headerEl = section.querySelector('.yt-vid-section-header');
      if (!headerEl) return;
      const existingHeaderInfo = headerEl.querySelector('.yt-header-information');
      const headerInfoContainer = document.createElement('div');
      headerInfoContainer.className = 'yt-header-information';

      const videos = getAllYTChannelVideos();
      const channelData = getAllYTChannelData();
      const totalComments = videos.reduce((s, v) => s + (Number(v.comment_count) || 0), 0);
      const totalLikes = videos.reduce((s, v) => s + (Number(v.like_count) || 0), 0);
      let avatarUrl = '';
      let coverUrl = '';
      let title = 'Channel Videos';
      let descDecoded = '';
      if (channelData && channelData.snippet) {
        const snippet = channelData.snippet;
        avatarUrl = (snippet.thumbnails && snippet.thumbnails.high && snippet.thumbnails.high.url) ? snippet.thumbnails.high.url : '';
        coverUrl = (channelData.brandingSettings && channelData.brandingSettings.image && (channelData.brandingSettings.image.bannerExternalUrl || channelData.brandingSettings.image.bannerMobileImageUrl || channelData.brandingSettings.image.bannerTvHighImageUrl)) ? (channelData.brandingSettings.image.bannerExternalUrl || channelData.brandingSettings.image.bannerMobileImageUrl || channelData.brandingSettings.image.bannerTvHighImageUrl) : '';
        const descRaw = snippet.description || '';
        descDecoded = decodeHtml(descRaw);
        title = snippet.title || 'Channel';
      }

      const AVG_BITRATE_BPS = 5000000;
      const totalDurationSeconds = videos.reduce((s, v) => s + (Number(v.duration_seconds) || 0), 0);
      const totalBytes = videos.reduce((s, v) => {
        if (v && v.duration_seconds) {
          const b = estimateVideoBytes(v.duration_seconds, AVG_BITRATE_BPS) || 0;
          return s + b;
        }
        return s;
      }, 0);

      headerInfoContainer.innerHTML = `
        <img src="${escapeHtml(avatarUrl)}" class="yt-header-pfp" alt="${escapeHtml(title)}" />
        <div class="yt-header-meta" role="region" aria-label="channel header">
        <h1>${escapeHtml(title)}</h1>
        <p class="yt-header-desc" data-full="${escapeHtml(descDecoded)}"></p>
        <div class="yt-channel-stats">
          <div class="yt-videos-row">
            <a class="subscribe-btn" href="https://www.youtube.com/channel/${getChannelId()}${channelData && channelData.statistics ? '?sub_confirmation=1' : ''}" target="_blank" rel="noreferrer">
              <span class="sub-label">Subscribe</span><span class="sub-count">${channelData && channelData.statistics ? numberToLocale(channelData.statistics.subscriberCount) : 'NA'}</span>
            </a>
          </div>
          <div class="stat-videos-count">Videos: ${channelData && channelData.statistics ? numberToLocale(channelData.statistics.videoCount) : 'NA'}</div>
          <div class="stat-total-views">Total Views: ${channelData && channelData.statistics ? numberToLocale(channelData.statistics.viewCount) : 'NA'}</div>
          <div class="stat-total-likes">Total Likes: ${numberToLocale(totalLikes)}</div>
          <div class="stat-total-comments">Total Comments: ${numberToLocale(totalComments)}</div>
          <div class="stat-videos">Total Videos Length:&nbsp;<strong class="tp-inline-duration">${escapeHtml(formatSecondsToYMDHMS(totalDurationSeconds))}</strong> &nbsp; Total Videos GB:&nbsp;<strong class="tp-inline-gb">${escapeHtml(formatBytes(totalBytes))}</strong></div>
          <button class="details-button" type="button" aria-pressed="false" title="More details">…</button>
        </div>
        </div>
      `;
      setTimeout(() => {
        const metaEl = headerInfoContainer.querySelector('.yt-header-meta');
        if (metaEl) {
          metaEl.style.setProperty('--yt-cover', coverUrl ? `url("${coverUrl}")` : 'none');
        }
      }, 0);

      if (existingHeaderInfo) headerEl.replaceChild(headerInfoContainer, existingHeaderInfo); else headerEl.insertBefore(headerInfoContainer, headerEl.firstChild);

      const newHeader = headerEl.querySelector('.yt-header-information');
      if (newHeader) {
        const descEl = newHeader.querySelector('.yt-header-desc');
        if (descEl) {
          const fullEscaped = descEl.getAttribute('data-full') || '';
          const fullDecoded = decodeHtml(fullEscaped);
          const short = fullDecoded.length > 240 ? fullDecoded.slice(0, 240) + '…' : fullDecoded;
          descEl.innerHTML = (short || 'Latest uploads').replace(/\n/g, '<br>');
          descEl.addEventListener('click', () => {
            if (descEl.classList.contains('expanded')) {
              descEl.classList.remove('expanded');
              descEl.innerHTML = (short || 'Latest uploads').replace(/\n/g, '<br>');
            } else {
              descEl.classList.add('expanded');
              descEl.innerHTML = (fullDecoded || 'Latest uploads').replace(/\n/g, '<br>');
            }
          });
        }

        const subscribe = newHeader.querySelector('.subscribe-btn');
        if (subscribe) {
          subscribe.addEventListener('click', e => {
            e.stopPropagation();
          });
        }

        const meta = newHeader.querySelector('.yt-header-meta');
        if (meta) {
          let titleRow = meta.querySelector('.yt-title-row');
          let h1 = meta.querySelector('h1');
          if (!titleRow) {
            titleRow = document.createElement('div');
            titleRow.className = 'yt-title-row';
            if (h1) titleRow.appendChild(h1);
            meta.insertBefore(titleRow, meta.firstChild);
          } else {
            if (h1 && h1.parentNode !== titleRow) titleRow.insertBefore(h1, titleRow.firstChild);
          }

          let switchBtn = titleRow.querySelector('.channel-switch-btn');
          if (!switchBtn) {
            switchBtn = document.createElement('button');
            switchBtn.className = 'channel-switch-btn';
            switchBtn.type = 'button';
            switchBtn.setAttribute('aria-label', 'Switch channel');
            switchBtn.innerHTML = `<span class="icon">⇄</span>`;
            titleRow.appendChild(switchBtn);

            switchBtn.addEventListener('mouseenter', async () => {
              const ids = getChannelIds();
              const otherIndex = getCurrentChannelIndex() === 0 ? 1 : 0;
              const otherId = ids[otherIndex];
              let otherName = otherId;
              if (otherId) {
                const info = await fetchChannelInfo(otherId);
                if (info && info.snippet && info.snippet.title) otherName = info.snippet.title;
              }
              switchBtn.setAttribute('data-tooltip', `Switch to ${otherName}?`);
            });

            switchBtn.addEventListener('mouseleave', () => {
              switchBtn.setAttribute('data-tooltip', '');
            });

            switchBtn.addEventListener('click', async e => {
              e.stopPropagation();
              const newIndex = getCurrentChannelIndex() === 0 ? 1 : 0;
              setCurrentChannelIndex(newIndex);
              if (loadingEl) loadingEl.style.display = 'block';
              if (container) container.style.display = 'none';
              await fetchAllYTData();
              if (loadingEl) loadingEl.style.display = 'none';
              if (container) container.style.display = '';
              playlistFilterSet = null;
              playlistSelectedValue = '__all__';
              playlistSearchTerm = '';
              const toolbarEl = container.querySelector('.yt-vid-toolbar');
              if (toolbarEl) {
                try {
                  await ensurePlaylistsPopulated(toolbarEl);
                } catch (err) {}
                renderPlaylistDropdown(toolbarEl);
              }
              currentPage = 1;
              showAll = false;
              renderToolbar();
              renderPage(1);
              updateHeaderInformation();
            });
          }

          let searchBtn = titleRow.querySelector('.channel-search-btn');
          if (!searchBtn) {
            searchBtn = document.createElement('button');
            searchBtn.className = 'channel-search-btn';
            searchBtn.type = 'button';
            searchBtn.setAttribute('aria-label', 'Load YouTube channel');
            searchBtn.title = 'Load YouTube channel (paste channel/video/handle link)';
            searchBtn.innerHTML = `<span class="icon">🔍︎</span>`;
            titleRow.appendChild(searchBtn);

            searchBtn.addEventListener('click', async ev => {
              ev.stopPropagation();
              const input = prompt('Paste YouTube link (channel, video, user, custom handle). Example: https://www.youtube.com/channel/UC... or https://youtu.be/VIDEOID');
              if (!input) return;
              const parsed = parseYouTubeLink(input);
              let resolved = parsed.channelId || null;
              if (!resolved) {
                resolved = await resolveToChannelId(parsed);
              }
              if (resolved) {
                await loadChannelById(resolved);
                return;
              }
              try {
                const u = new URL(input);
                const cid = u.searchParams.get('channel_id') || u.searchParams.get('channelId') || u.searchParams.get('channel');
                if (cid && /^UC[A-Za-z0-9_-]{22}$/.test(cid)) {
                  await loadChannelById(cid);
                  return;
                }
              } catch (e) {}
              const maybe = (input || '').trim();
              if (/^UC[A-Za-z0-9_-]{22}$/.test(maybe)) {
                await loadChannelById(maybe);
                return;
              }
              if (!hasApiKey()) {
                alert('Could not resolve channel from the link. To resolve video URLs, usernames or custom handles, you need to supply a YouTube Data API key (set window.YT_API_KEY or VITE_YT_API_KEY). Alternatively, paste the full channel URL that contains /channel/UC...');
              } else {
                alert('Could not resolve channel from the link. Try pasting the full channel URL (https://www.youtube.com/channel/UC...) or a video link (so the API can map it).');
              }
            });
          }

          // YT Chat Button
          let chatBtn = titleRow.querySelector('.yt-chat-btn');
          if (!chatBtn) {
            chatBtn = document.createElement('button');
            chatBtn.className = 'yt-chat-btn';
            chatBtn.type = 'button';
            chatBtn.setAttribute('aria-label', 'View YouTube Comments');
            chatBtn.title = 'View YouTube Comments';
            chatBtn.innerHTML = `<i class="fas fa-comments"></i>`;
            titleRow.appendChild(chatBtn);

            chatBtn.addEventListener('click', async ev => {
              ev.stopPropagation();
              try {
                // Get first video from list to fetch comments
                const allVideos = getAllYTChannelVideos();
                if (!allVideos || allVideos.length === 0) {
                  alert('No videos available. Please load a channel first.');
                  return;
                }
                
                const firstVideo = allVideos[0];
                const { showVideoComments } = await import('./component/right-sidebar.js');
                await showVideoComments(firstVideo.id, true);
              } catch (error) {
                console.error('Error opening comments:', error);
                alert('Failed to load comments. Make sure YouTube API key is configured.');
              }
            });
          }
        }
      }

      const detailsBtn = headerInfoContainer.querySelector('.details-button');
      const tpDuration = headerInfoContainer.querySelector('.tp-inline-duration');
      const tpGb = headerInfoContainer.querySelector('.tp-inline-gb');
      const statVideosEl = headerInfoContainer.querySelector('.stat-videos');
      if (statVideosEl) statVideosEl.style.display = 'none';

      if (detailsBtn) {
        detailsBtn.addEventListener('click', e => {
          e.stopPropagation();
          const pressed = detailsBtn.getAttribute('aria-pressed') === 'true';
          if (pressed) {
            detailsBtn.setAttribute('aria-pressed', 'false');
            section.removeAttribute('data-show-size');
            if (statVideosEl) statVideosEl.style.display = 'none';
          } else {
            detailsBtn.setAttribute('aria-pressed', 'true');
            section.setAttribute('data-show-size', 'true');
            if (tpDuration) tpDuration.textContent = formatSecondsToYMDHMS(getAllYTChannelVideos().reduce((s, v) => s + (Number(v.duration_seconds) || 0), 0));
            if (tpGb) tpGb.textContent = formatBytes(getAllYTChannelVideos().reduce((s, v) => {
              if (v && v.duration_seconds) {
                const b = estimateVideoBytes(Number(v.duration_seconds), AVG_BITRATE_BPS) || 0;
                return s + b;
              }
              return s;
            }, 0));
            if (statVideosEl) {
              if (window.matchMedia && window.matchMedia('(max-width:720px)').matches) {
                statVideosEl.style.display = 'block';
              } else {
                statVideosEl.style.display = 'flex';
              }
            }
          }
        });
      }
    }

    renderToolbar();
    renderPage(1);
    updateHeaderInformation();

    if (searchInput) {
      let t;
      searchInput.oninput = () => {
        clearTimeout(t);
        t = setTimeout(() => renderPage(1), 300);
      };
    }
  })();
};

window.getAllYTChannelVideos = getAllYTChannelVideos;