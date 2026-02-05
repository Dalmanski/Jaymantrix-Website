function formatSeconds(sec) {
  if (sec == null) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
function numberToLocale(n) {
  if (n == null || n === 'NA') return 'NA';
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  return num.toLocaleString();
}
function formatDate(dateInput) {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return dateInput;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function createVideoGrid(videos) {
  const grid = document.createElement('div');
  grid.className = 'yt-vid-grid';
  videos.forEach(video => {
    const item = document.createElement('div');
    item.className = 'yt-vid-item';
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'yt-vid-thumb-wrap';
    const img = document.createElement('img');
    img.className = 'yt-vid-thumb';
    img.alt = (video.title || '').replace(/"/g, '&quot;');
    img.src = video.thumbnail || '';
    thumbWrap.appendChild(img);
    const duration = document.createElement('div');
    duration.className = 'yt-duration-badge';
    duration.textContent = formatSeconds(video.duration_seconds);
    thumbWrap.appendChild(duration);
    const meta = document.createElement('div');
    meta.className = 'yt-vid-meta';
    const title = document.createElement('div');
    title.className = 'yt-vid-title';
    title.textContent = video.title || '';
    const info = document.createElement('div');
    info.className = 'yt-vid-info';
    const dateBadge = document.createElement('div');
    dateBadge.className = 'yt-vid-badge';
    dateBadge.textContent = formatDate(video.upload_date);
    const viewsBadge = document.createElement('div');
    viewsBadge.className = 'yt-vid-badge';
    viewsBadge.textContent = video.view_count != null ? numberToLocale(video.view_count) + ' views' : 'NA';
    info.appendChild(dateBadge);
    info.appendChild(viewsBadge);
    const desc = document.createElement('div');
    desc.className = 'yt-vid-desc';
    const fullDesc = video.description || '';
    const shortDesc = fullDesc.length > 180 ? fullDesc.slice(0, 180) + '…' : fullDesc;
    desc.textContent = shortDesc;
    desc.setAttribute('data-full', fullDesc);
    desc.addEventListener('click', (e) => {
      const el = e.currentTarget;
      const full = el.getAttribute('data-full') || '';
      if (el.classList.contains('expanded')) {
        el.classList.remove('expanded');
        el.textContent = full.length > 180 ? full.slice(0, 180) + '…' : full;
      } else {
        el.classList.add('expanded');
        el.textContent = full;
      }
    });
    item.appendChild(thumbWrap);
    meta.appendChild(title);
    meta.appendChild(info);
    meta.appendChild(desc);
    item.appendChild(meta);
    item.addEventListener('click', (e) => {
      const target = e.target;
      if (target && (target.classList && (target.classList.contains('yt-vid-desc') || target.closest('.yt-vid-desc')))) {
        return;
      }
      openVideoModal(video);
    });
    grid.appendChild(item);
  });
  return grid;
}
let rawApiKey = (import.meta && import.meta.env && import.meta.env.VITE_YT_API_KEY) || (typeof window !== 'undefined' ? window.YT_API_KEY || '' : '') || '';
const apiKey = rawApiKey.replace(/^"|"$/g, '');
const channelId = 'UCPrdw58ZZXJyKYXdcCGViWw';
let allYTChannelVideos = [];
let allYTChannelData = null;
async function fetchAllYTData() {
  let channelData = null;
  let videos = [];
  try {
    if (apiKey) {
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet,statistics,contentDetails`);
      if (channelRes.ok) {
        const channelJson = await channelRes.json();
        if (channelJson.items && channelJson.items.length > 0) {
          channelData = channelJson.items[0];
        }
      }
      const uploadsPlaylistId = channelData && channelData.contentDetails && channelData.contentDetails.relatedPlaylists && channelData.contentDetails.relatedPlaylists.uploads;
      if (uploadsPlaylistId) {
        let nextPageToken = '';
        do {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
          if (!res.ok) break;
          const data = await res.json();
          const newVideos = (data.items || []).map(item => {
            return {
              id: item.contentDetails.videoId || '',
              title: item.snippet.title || '',
              thumbnail: item.snippet.thumbnails && item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : '',
              duration_seconds: null,
              upload_date: item.snippet.publishedAt || '',
              view_count: 'NA',
              description: item.snippet.description || ''
            };
          });
          videos = videos.concat(newVideos);
          nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
      } else {
        let nextPageToken = '';
        do {
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
          if (!res.ok) break;
          const data = await res.json();
          const newVideos = (data.items || []).filter(it => it.id && it.id.kind === 'youtube#video').map(item => {
            return {
              id: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails && item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : '',
              duration_seconds: null,
              upload_date: item.snippet.publishedAt || '',
              view_count: 'NA',
              description: item.snippet.description || ''
            };
          });
          videos = videos.concat(newVideos);
          nextPageToken = data.nextPageToken || '';
        } while (nextPageToken);
      }
      for (let i = 0; i < videos.length; i += 50) {
        const batchIds = videos.slice(i, i + 50).map(v => v.id).join(',');
        if (!batchIds) continue;
        const statsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${batchIds}&part=statistics,contentDetails`);
        if (!statsRes.ok) continue;
        const statsJson = await statsRes.json();
        (statsJson.items || []).forEach(statItem => {
          const v = videos.find(vid => vid.id === statItem.id);
          if (v && statItem.statistics && statItem.statistics.viewCount) {
            v.view_count = statItem.statistics.viewCount;
          }
          if (v && statItem.contentDetails && statItem.contentDetails.duration) {
            const dur = statItem.contentDetails.duration;
            const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (match) {
              const h = parseInt(match[1] || '0', 10);
              const m = parseInt(match[2] || '0', 10);
              const s = parseInt(match[3] || '0', 10);
              v.duration_seconds = h * 3600 + m * 60 + s;
            }
          }
        });
      }
    } else {
      const apiUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const rssRes = await fetch(apiUrl);
      if (rssRes.ok) {
        const txt = await rssRes.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(txt, 'application/xml');
        const items = Array.from(xml.querySelectorAll('entry, item'));
        const newVideos = items.map(it => {
          const idNode = it.querySelector('yt\\:videoId, guid');
          const titleNode = it.querySelector('title');
          const thumbNode = it.querySelector('media\\:thumbnail, thumbnail');
          const descriptionNode = it.querySelector('media\\:description, description');
          const pubNode = it.querySelector('published, pubDate');
          return {
            id: idNode ? idNode.textContent : '',
            title: titleNode ? titleNode.textContent : '',
            thumbnail: thumbNode ? thumbNode.getAttribute('url') : '',
            duration_seconds: null,
            upload_date: pubNode ? pubNode.textContent : '',
            view_count: 'NA',
            description: descriptionNode ? descriptionNode.textContent : ''
          };
        });
        videos = videos.concat(newVideos);
      }
    }
    allYTChannelVideos = videos.sort((a, b) => {
      const da = a.upload_date ? new Date(a.upload_date).getTime() : 0;
      const db = b.upload_date ? new Date(b.upload_date).getTime() : 0;
      return db - da;
    });
    allYTChannelData = channelData;
  } catch (e) {
    console.error('Error fetching/parsing YouTube API:', e);
  }
}
function ensureModal() {
  let modal = document.querySelector('.yt-vid-modal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.className = 'yt-vid-modal';
  modal.innerHTML = `
    <div class="yt-vid-modal-content">
      <button class="yt-vid-modal-close" aria-label="close">✕</button>
      <div class="yt-vid-modal-video"><iframe src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
      <div class="yt-vid-modal-details">
        <h2 class="yt-vid-modal-title"></h2>
        <div class="yt-vid-modal-meta"></div>
        <p class="yt-vid-modal-desc"></p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.yt-vid-modal-close').addEventListener('click', () => {
    closeVideoModal();
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVideoModal();
  });
  return modal;
}
function openVideoModal(video) {
  const modal = ensureModal();
  const iframe = modal.querySelector('iframe');
  iframe.src = video.id ? `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=1` : (video.url || '');
  modal.querySelector('.yt-vid-modal-title').textContent = video.title || '';
  modal.querySelector('.yt-vid-modal-meta').textContent = `${formatDate(video.upload_date)} • ${video.view_count != null ? numberToLocale(video.view_count) + ' views' : 'NA'}`;
  modal.querySelector('.yt-vid-modal-desc').textContent = video.description || '';
  modal.classList.add('open');
}
function closeVideoModal() {
  const modal = document.querySelector('.yt-vid-modal');
  if (!modal) return;
  const iframe = modal.querySelector('iframe');
  iframe.src = '';
  modal.classList.remove('open');
}
window.showYTvidSection = function() {
  let section = document.getElementById('yt-vid-section');
  if (!section) return;
  const loadingEl = document.getElementById('yt-loading');
  const container = document.getElementById('yt-container');
  const gridWrap = container.querySelector('.yt-vid-grid-wrap');
  const paginationWrap = container.querySelector('.yt-vid-pagination');
  if (loadingEl) {
    loadingEl.style.display = 'block';
  }
  if (container) {
    container.style.display = 'none';
  }
  section.style.display = '';
  (async () => {
    if (!allYTChannelVideos.length || !allYTChannelData) {
      await fetchAllYTData();
    }
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    if (container) {
      container.style.display = '';
    }
    let filteredVideos = allYTChannelVideos.slice();
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
      const q = searchInput.value.toLowerCase();
      filteredVideos = allYTChannelVideos.filter(v => (v.title || '').toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q));
    }
    let currentPage = 1;
    const videosPerPage = 21;
    const totalPages = Math.max(1, Math.ceil(filteredVideos.length / videosPerPage));
    function renderPage(page) {
      currentPage = page;
      gridWrap.innerHTML = '';
      const start = (page - 1) * videosPerPage;
      const end = start + videosPerPage;
      const slice = filteredVideos.slice(start, end);
      gridWrap.appendChild(createVideoGrid(slice));
      renderPagination();
    }
    function renderPagination() {
      paginationWrap.innerHTML = '';
      if (totalPages <= 1) return;
      const nav = document.createElement('div');
      nav.className = 'yt-pagination-nav';
      const firstBtn = document.createElement('button');
      firstBtn.className = 'arrow-btn';
      firstBtn.textContent = '<<';
      firstBtn.onclick = () => renderPage(1);
      nav.appendChild(firstBtn);
      const prevBtn = document.createElement('button');
      prevBtn.className = 'arrow-btn';
      prevBtn.textContent = '<';
      prevBtn.onclick = () => { if (currentPage > 1) renderPage(currentPage - 1); };
      nav.appendChild(prevBtn);
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
          const btn = document.createElement('button');
          btn.textContent = i;
          if (i === currentPage) btn.disabled = true;
          btn.onclick = () => renderPage(i);
          nav.appendChild(btn);
        } else if (i === currentPage - 3 || i === currentPage + 3) {
          const dots = document.createElement('span');
          dots.textContent = '...';
          nav.appendChild(dots);
        }
      }
      const nextBtn = document.createElement('button');
      nextBtn.className = 'arrow-btn';
      nextBtn.textContent = '>';
      nextBtn.onclick = () => { if (currentPage < totalPages) renderPage(currentPage + 1); };
      nav.appendChild(nextBtn);
      const lastBtn = document.createElement('button');
      lastBtn.className = 'arrow-btn';
      lastBtn.textContent = '>>';
      lastBtn.onclick = () => renderPage(totalPages);
      nav.appendChild(lastBtn);
      paginationWrap.appendChild(nav);
    }
    renderPage(1);
    const headerInfoContainer = document.createElement('div');
    headerInfoContainer.className = 'yt-header-information';
    if (allYTChannelData && allYTChannelData.snippet) {
      const snippet = allYTChannelData.snippet;
      const stats = allYTChannelData.statistics || {};
      const thumbUrl = (snippet.thumbnails && snippet.thumbnails.high && snippet.thumbnails.high.url) ? snippet.thumbnails.high.url : '';
      const descSafe = snippet.description ? snippet.description.replace(/"/g, '&quot;') : '';
      headerInfoContainer.innerHTML = `
        <img src="${thumbUrl}" class="yt-header-pfp" alt="${snippet.title || ''}" />
        <div class="yt-header-meta">
          <h1>${snippet.title || 'Channel'}</h1>
          <p class="yt-header-desc" data-full="${descSafe}">${descSafe.length > 240 ? descSafe.slice(0,240) + '…' : descSafe}</p>
          <div class="yt-channel-stats">
            <div class="yt-videos-row"><a class="subscribe-btn" href="https://www.youtube.com/channel/${channelId}" target="_blank" rel="noreferrer">Subscribe</a><span>Videos: ${stats.videoCount || 'NA'}</span></div>
            <div>Subscribers: ${stats.subscriberCount || 'NA'}</div>
            <div>Total Views: ${stats.viewCount || 'NA'}</div>
          </div>
        </div>
      `;
    } else {
      headerInfoContainer.innerHTML = `
        <img src="" class="yt-header-pfp" alt="Channel" />
        <div class="yt-header-meta">
          <h1>Channel Videos</h1>
          <p class="yt-header-desc" data-full="">Latest uploads</p>
          <div class="yt-channel-stats">
            <div class="yt-videos-row"><a class="subscribe-btn" href="https://www.youtube.com/channel/${channelId}" target="_blank" rel="noreferrer">Subscribe</a><span>Videos: NA</span></div>
            <div>Subscribers: NA</div>
            <div>Total Views: NA</div>
          </div>
        </div>
      `;
    }
    const headerEl = section.querySelector('.yt-vid-section-header');
    const existingHeaderInfo = headerEl.querySelector('.yt-header-information');
    if (existingHeaderInfo) headerEl.replaceChild(headerInfoContainer, existingHeaderInfo); else headerEl.insertBefore(headerInfoContainer, headerEl.firstChild);
    const newHeader = headerEl.querySelector('.yt-header-information');
    if (newHeader) {
      const descEl = newHeader.querySelector('.yt-header-desc');
      if (descEl) {
        const full = descEl.getAttribute('data-full') || '';
        const short = full.length > 240 ? full.slice(0,240) + '…' : full;
        descEl.textContent = short || 'Latest uploads';
        descEl.addEventListener('click', () => {
          if (descEl.classList.contains('expanded')) {
            descEl.classList.remove('expanded');
            descEl.textContent = short || 'Latest uploads';
          } else {
            descEl.classList.add('expanded');
            descEl.textContent = full || 'Latest uploads';
          }
        });
      }
      const subscribe = newHeader.querySelector('.subscribe-btn');
      if (subscribe) {
        subscribe.addEventListener('click', (e) => {
          e.stopPropagation();
        });
      }
    }
    if (searchInput) {
      let t;
      searchInput.oninput = () => {
        clearTimeout(t);
        t = setTimeout(() => window.showYTvidSection(), 300);
      };
    }
  })();
};
window.hideYTvidSection = function() {
  const section = document.getElementById('yt-vid-section');
  if (section) section.style.display = 'none';
};
if (typeof window !== 'undefined') {
  window.YT_API_KEY = window.YT_API_KEY || ''
}
export {}
