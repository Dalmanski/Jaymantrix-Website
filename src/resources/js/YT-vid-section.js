function timestampToSeconds(ts) {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}
function highlightTimestamps(text, videoId) {
  return text.replace(/\b(\d{1,2}:(?:\d{2}:)?\d{2})\b/g, function(match) {
    const seconds = timestampToSeconds(match);
    if (!videoId) return match;
    return `<span class="yt-timestamp-link" data-seconds="${seconds}">${match}</span>`;
  });
}
function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function decodeHtml(str) {
  const t = document.createElement('textarea');
  t.innerHTML = str || '';
  return t.value || '';
}
function highlightHashtags(text) {
  return (text || '').replace(/#([\w\-]+)/g, '<span class="hashtag">#$1</span>');
}
function highlightLinks(text) {
  const urlRegex = /((https?:\/\/|www\.)[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/gi;
  return text.replace(urlRegex, url => {
    let href = url;
    if (!href.startsWith('http')) href = 'https://' + href;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}
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
  return num.toLocaleString('en-US');
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
  let html = '';
  videos.forEach(video => {
    const totalVideos = Array.isArray(allYTChannelVideos) && allYTChannelVideos.length ? allYTChannelVideos.length : videos.length;
    const globalIdxRaw = (Array.isArray(allYTChannelVideos) ? allYTChannelVideos.findIndex(v => v.id === video.id) : -1);
    const fallbackIdx = videos.indexOf(video) >= 0 ? videos.indexOf(video) + 1 : '';
    const globalIdx = (globalIdxRaw >= 0) ? (totalVideos - globalIdxRaw) : fallbackIdx;
    const fullDescRaw = video.description || '';
    const fullDescDecoded = decodeHtml(fullDescRaw);
    const shortDescDecoded = fullDescDecoded.length > 180 ? fullDescDecoded.slice(0, 180) + '…' : fullDescDecoded;
    const escapedShort = escapeHtml(shortDescDecoded);
    const escapedFull = escapeHtml(fullDescDecoded);
    const durationText = formatSeconds(video.duration_seconds);
    const viewsText = video.view_count != null ? numberToLocale(video.view_count) + ' views' : 'NA';
    const lcount = (typeof video.like_count !== 'undefined' && video.like_count !== null) ? Number(video.like_count) : 0;
    const likesText = numberToLocale(lcount) + ' likes';
    const ccount = (typeof video.comment_count !== 'undefined' && video.comment_count !== null) ? Number(video.comment_count) : 0;
    const commentsText = numberToLocale(ccount) + ' comments';
    const dateText = formatDate(video.upload_date);
    html += `
      <div class="yt-vid-item" data-video-id="${escapeHtml(video.id || '')}" data-desc-full="${escapedFull}">
        <div class="yt-vid-thumb-wrap">
          <img class="yt-vid-thumb" alt="${escapeHtml((video.title || '').replace(/"/g, '&quot;'))}" src="${escapeHtml(video.thumbnail || '')}" />
          <div class="yt-duration-badge">${escapeHtml(durationText)}</div>
          <div class="yt-vid-idx">#${escapeHtml(String(globalIdx))}</div>
        </div>
        <div class="yt-vid-meta">
          <div class="yt-vid-title">${escapeHtml(video.title || '')}</div>
          <div class="yt-vid-info">
            <div class="yt-vid-badge">${escapeHtml(dateText)}</div>
            <div class="yt-vid-badge">${escapeHtml(viewsText)}</div>
            <div class="yt-vid-badge yt-vid-like-badge" ${!lcount ? 'style="display:none;"' : ''}>${escapeHtml(likesText)}</div>
            <div class="yt-vid-comments-badge" ${!ccount ? 'style="display:none;"' : ''}>${escapeHtml(commentsText)}</div>
          </div>
          <div class="yt-vid-desc">${highlightHashtags(escapedShort).replace(/\n/g, '<br>')}</div>
        </div>
      </div>
    `;
  });
  grid.innerHTML = html;
  grid.querySelectorAll('.yt-vid-desc').forEach(descEl => {
    descEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = descEl.closest('.yt-vid-item');
      if (!item) return;
      const vid = item.getAttribute('data-video-id');
      const video = Array.isArray(allYTChannelVideos) ? allYTChannelVideos.find(v => v.id === vid) : null;
      if (video) openVideoModal(video);
    });
  });
  grid.querySelectorAll('.yt-vid-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.target;
      if (target && (target.classList && (target.classList.contains('yt-vid-desc') || target.closest('.yt-vid-desc')))) {
        return;
      }
      const vid = item.getAttribute('data-video-id');
      const video = Array.isArray(allYTChannelVideos) ? allYTChannelVideos.find(v => v.id === vid) : null;
      if (video) openVideoModal(video);
    });
  });
  return grid;
}
let rawApiKey = (import.meta && import.meta.env && import.meta.env.VITE_YT_API_KEY) || (typeof window !== 'undefined' ? window.YT_API_KEY || '' : '') || '';
const apiKey = rawApiKey.replace(/^"|"$/g, '');
const channelIds = ['UCPrdw58ZZXJyKYXdcCGViWw','UCrEuhIEG3ndKQ0zO9EjMWag'];
let currentChannelIndex = 0;
let channelId = channelIds[currentChannelIndex];
let allYTChannelVideos = [];
let allYTChannelData = null;
const channelInfoCache = {};
async function fetchChannelInfo(id) {
  if (!id) return null;
  if (channelInfoCache[id]) return channelInfoCache[id];
  if (apiKey) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${id}&part=snippet,brandingSettings,statistics`);
      if (res.ok) {
        const j = await res.json();
        if (j.items && j.items.length) {
          channelInfoCache[id] = j.items[0];
          return channelInfoCache[id];
        }
      }
    } catch (e) {}
  }
  channelInfoCache[id] = null;
  return null;
}
async function fetchAllYTData() {
  channelId = channelIds[currentChannelIndex];
  let channelData = null;
  let videos = [];
  try {
    if (apiKey) {
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet,statistics,contentDetails,brandingSettings`);
      if (channelRes.ok) {
        const channelJson = await channelRes.json();
        if (channelJson.items && channelJson.items.length > 0) {
          channelData = channelJson.items[0];
          if (channelData.snippet && channelData.snippet.description) {
            channelData.snippet.description = decodeHtml(channelData.snippet.description);
          }
          channelInfoCache[channelId] = channelData;
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
              comment_count: null,
              like_count: null,
              description: decodeHtml(item.snippet.description || '')
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
              comment_count: null,
              like_count: null,
              description: decodeHtml(item.snippet.description || '')
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
          if (v && statItem.statistics && typeof statItem.statistics.commentCount !== 'undefined') {
            v.comment_count = statItem.statistics.commentCount;
          }
          if (v && statItem.statistics && typeof statItem.statistics.likeCount !== 'undefined') {
            v.like_count = statItem.statistics.likeCount;
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
            comment_count: null,
            like_count: null,
            description: decodeHtml((descriptionNode && (descriptionNode.textContent || descriptionNode.innerHTML)) || '')
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
      <div class="yt-vid-modal-left">
        <div class="yt-vid-modal-video"><iframe src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>
        <div class="yt-vid-modal-info">
          <h2 class="yt-vid-modal-title"></h2>
          <div class="yt-vid-modal-meta"></div>
        </div>
      </div>
      <div class="yt-vid-modal-details">
        <div class="yt-vid-details-header">
          <div class="desc-label">Description</div>
          <div class="comments-count">Comments</div>
        </div>
        <div class="yt-vid-modal-desc"></div>
        <div class="yt-comments" aria-live="polite"></div>
      </div>
    </div>
    <button class="yt-vid-modal-close" aria-label="close">✕</button>
  `;
  document.body.appendChild(modal);
  const closeBtn = modal.querySelector('.yt-vid-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeVideoModal();
    });
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVideoModal();
  });
  return modal;
}
let bgAudioCtx = null;
let bgSourceNode = null;
let bgFilterNode = null;
let bgGainNode = null;
let bgOriginalGain = null;
function ensureBgAudioNodes() {
  const bgMusic = document.getElementById('bg-music');
  if (!bgMusic) return false;
  if (!bgAudioCtx) {
    try {
      bgAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      bgSourceNode = bgAudioCtx.createMediaElementSource(bgMusic);
      bgFilterNode = bgAudioCtx.createBiquadFilter();
      bgFilterNode.type = 'lowshelf';
      bgFilterNode.frequency.value = 600;
      bgFilterNode.gain.value = -6;
      bgGainNode = bgAudioCtx.createGain();
      const initialGain = bgMusic.volume != null ? bgMusic.volume : 1;
      bgGainNode.gain.value = initialGain;
      bgSourceNode.connect(bgFilterNode);
      bgFilterNode.connect(bgGainNode);
      bgGainNode.connect(bgAudioCtx.destination);
      bgOriginalGain = bgGainNode.gain.value;
      return true;
    } catch (e) {
      bgAudioCtx = null;
      bgSourceNode = null;
      bgFilterNode = null;
      bgGainNode = null;
      return false;
    }
  }
  return true;
}
function fadeBgVolume(targetGain, durationSec = 1) {
  const bgMusic = document.getElementById('bg-music');
  if (!bgMusic) return;
  if (ensureBgAudioNodes() && bgGainNode && bgAudioCtx) {
    try {
      bgGainNode.gain.cancelScheduledValues(bgAudioCtx.currentTime);
      bgGainNode.gain.setValueAtTime(bgGainNode.gain.value, bgAudioCtx.currentTime);
      bgGainNode.gain.linearRampToValueAtTime(targetGain, bgAudioCtx.currentTime + durationSec);
    } catch (e) {
      const start = bgMusic.volume;
      const steps = 20;
      let i = 0;
      const delta = (targetGain - start) / steps;
      const iv = setInterval(() => {
        i += 1;
        bgMusic.volume = Math.max(0, Math.min(1, start + delta * i));
        if (i >= steps) clearInterval(iv);
      }, (durationSec * 1000) / steps);
    }
  } else {
    const start = bgMusic.volume;
    const steps = 20;
    let i = 0;
    const delta = (targetGain - start) / steps;
    const iv = setInterval(() => {
      i += 1;
      bgMusic.volume = Math.max(0, Math.min(1, start + delta * i));
      if (i >= steps) clearInterval(iv);
    }, (durationSec * 1000) / steps);
  }
}
async function openVideoModal(video) {
  const modal = ensureModal();
  const details = modal.querySelector('.yt-vid-modal-details');
  if (details) {
    details.style.borderRadius = '10px';
    details.style.overflowY = 'auto';
    details.style.maxWidth = 'auto'
    details.style.width = '560px';
    details.style.maxHeight = 'calc(85vh)';
  }
  const iframe = modal.querySelector('iframe');
  iframe.src = video.id ? `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=1` : (video.url || '');
  modal.querySelector('.yt-vid-modal-title').textContent = video.title || '';
  const viewText = video.view_count != null ? numberToLocale(video.view_count) + ' views' : 'NA';
  const likeNum = (typeof video.like_count !== 'undefined' && video.like_count !== null) ? Number(video.like_count) : 0;
  const metaParts = [];
  metaParts.push(formatDate(video.upload_date));
  if (viewText) metaParts.push(viewText);
  if (likeNum > 0) metaParts.push(numberToLocale(likeNum) + ' likes');
  modal.querySelector('.yt-vid-modal-meta').textContent = metaParts.join(' • ');
  const descEl = modal.querySelector('.yt-vid-modal-desc');
  const decoded = decodeHtml(video.description || '');
  let descHtml = escapeHtml(decoded);
  descHtml = highlightHashtags(descHtml);
  descHtml = highlightTimestamps(descHtml, video.id);
  descHtml = highlightLinks(descHtml);
  descEl.innerHTML = descHtml.replace(/\n/g, '<br>');
  descEl.querySelectorAll('.yt-timestamp-link').forEach(el => {
    el.style.cursor = 'pointer';
    el.style.textDecoration = 'none';
    el.style.color = '#1976d2';
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const seconds = el.getAttribute('data-seconds');
      if (video.id && seconds) {
        window.open(`https://www.youtube.com/watch?v=${video.id}&t=${seconds}s`, '_blank');
      }
    });
  });
  const commentsCountEl = modal.querySelector('.comments-count');
  const badgeCount = (typeof video.comment_count !== 'undefined' && video.comment_count !== null) ? Number(video.comment_count) : 0;
  if (commentsCountEl) {
    commentsCountEl.textContent = `${numberToLocale(badgeCount)} Comments`;
  }
  const commentsContainer = modal.querySelector('.yt-comments');
  commentsContainer.innerHTML = '';
  commentsContainer.innerHTML = `<div class="yt-loading">Loading comments...</div>`;
  modal.classList.add('open');
  try {
    const bgMusic = document.getElementById('bg-music');
    const musicEnabled = document.getElementById('setting-music') ? document.getElementById('setting-music').checked : false;
    if (bgMusic && !bgMusic.paused && musicEnabled) {
      ensureBgAudioNodes();
      if (bgGainNode) {
        bgOriginalGain = bgGainNode.gain.value;
        fadeBgVolume(bgOriginalGain * 0.25, 1);
      } else {
        bgOriginalGain = bgMusic.volume;
        fadeBgVolume(Math.max(0, bgOriginalGain * 0.25), 1);
      }
      if (bgAudioCtx && bgFilterNode) {
        try {
          bgFilterNode.gain.cancelScheduledValues(bgAudioCtx.currentTime);
          bgFilterNode.gain.setValueAtTime(bgFilterNode.gain.value, bgAudioCtx.currentTime);
          bgFilterNode.gain.linearRampToValueAtTime(-12, bgAudioCtx.currentTime + 1);
        } catch (e) {}
      }
    }
  } catch (e) {}
  if (apiKey && video.id) {
    try {
      let comments = [];
      let nextPageToken = '';
      do {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&videoId=${video.id}&part=snippet,replies&maxResults=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
        if (!res.ok) break;
        const data = await res.json();
        (data.items || []).forEach(it => {
          const top = it.snippet && it.snippet.topLevelComment && it.snippet.topLevelComment.snippet;
          if (top) {
            const thread = {
              author: top.authorDisplayName || 'Unknown',
              authorAvatar: top.authorProfileImageUrl || '',
              text: top.textDisplay || '',
              publishedAt: top.publishedAt || '',
              replies: []
            };
            if (it.replies && it.replies.comments && Array.isArray(it.replies.comments)) {
              it.replies.comments.forEach(r => {
                const rs = r.snippet || {};
                thread.replies.push({
                  author: rs.authorDisplayName || 'Unknown',
                  authorAvatar: rs.authorProfileImageUrl || '',
                  text: rs.textDisplay || '',
                  publishedAt: rs.publishedAt || ''
                });
              });
            }
            comments.push(thread);
          }
        });
        nextPageToken = data.nextPageToken || '';
      } while (nextPageToken);
      if (comments.length === 0) {
        commentsContainer.innerHTML = `<div class="yt-loading">No comments available.</div>`;
      } else {
        let cHtml = '';
        comments.forEach(c => {
          const author = escapeHtml(c.author || 'Unknown');
          const avatar = escapeHtml(c.authorAvatar || 'https://via.placeholder.com/48');
          const date = c.publishedAt ? new Date(c.publishedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const text = c.text || '';
          cHtml += `
            <div class="yt-comment">
              <div class="comment-avatar"><img src="${avatar}" alt="${author}"></div>
              <div class="comment-body">
                <div class="comment-author"><span>${author}</span><span class="comment-date">${escapeHtml(date)}</span></div>
                <div class="comment-text">${text}</div>
          `;
          if (c.replies && c.replies.length) {
            cHtml += `<div class="comment-replies">`;
            c.replies.forEach(r => {
              const rauthor = escapeHtml(r.author || 'Unknown');
              const ravatar = escapeHtml(r.authorAvatar || 'https://via.placeholder.com/36');
              const rdate = r.publishedAt ? new Date(r.publishedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const rtext = r.text || '';
              cHtml += `
                <div class="comment-reply">
                  <div class="comment-avatar"><img src="${ravatar}" alt="${rauthor}"></div>
                  <div class="comment-body">
                    <div class="comment-author"><span>${rauthor}</span><span class="comment-date">${escapeHtml(rdate)}</span></div>
                    <div class="comment-text">${rtext}</div>
                  </div>
                </div>
              `;
            });
            cHtml += `</div>`;
          }
          cHtml += `</div></div>`;
        });
        commentsContainer.innerHTML = cHtml;
      }
    } catch (e) {
      commentsContainer.innerHTML = `<div class="yt-loading">Unable to load comments.</div>`;
    }
  } else {
    commentsContainer.innerHTML = `<div class="yt-loading">Comments unavailable (API key required).</div>`;
  }
}
function closeVideoModal() {
  const modal = document.querySelector('.yt-vid-modal');
  if (!modal) return;
  const iframe = modal.querySelector('iframe');
  iframe.src = '';
  modal.classList.remove('open');
  try {
    const bgMusic = document.getElementById('bg-music');
    const musicEnabled = document.getElementById('setting-music') ? document.getElementById('setting-music').checked : false;
    if (bgMusic && musicEnabled) {
      if (bgOriginalGain != null) {
        fadeBgVolume(bgOriginalGain, 1);
      }
      if (bgAudioCtx && bgFilterNode) {
        try {
          bgFilterNode.gain.cancelScheduledValues(bgAudioCtx.currentTime);
          bgFilterNode.gain.setValueAtTime(bgFilterNode.gain.value, bgAudioCtx.currentTime);
          bgFilterNode.gain.linearRampToValueAtTime(-6, bgAudioCtx.currentTime + 1);
        } catch (e) {}
      }
    }
  } catch (e) {}
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
    allYTChannelVideos = [];
    allYTChannelData = null;
    await fetchAllYTData();
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
    if (container) {
      container.style.display = '';
    }
    const searchInput = document.getElementById('searchInput');
    let currentPage = 1;
    const videosPerPage = 21;
    let sortBy = 'Date';
    let sortOrder = 'desc';
    let showAll = false;
    let commentsOnly = false;
    let likesOnly = false;
    function getBaseVideos() {
      let arr = Array.isArray(allYTChannelVideos) ? allYTChannelVideos.slice() : [];
      if (searchInput && searchInput.value) {
        const q = searchInput.value.toLowerCase();
        arr = arr.filter(v => (v.title || '').toLowerCase().includes(q));
      }
      return arr;
    }
    function applyFiltersAndSort(arr) {
      let out = arr.slice();
      if (commentsOnly) {
        out = out.filter(v => Number(v.comment_count) > 0);
      }
      if (likesOnly) {
        out = out.filter(v => Number(v.like_count) > 0);
      }
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
      } else {
        out.sort((a, b) => {
          const da = a.upload_date ? new Date(a.upload_date).getTime() : 0;
          const db = b.upload_date ? new Date(b.upload_date).getTime() : 0;
          return sortOrder === 'asc' ? da - db : db - da;
        });
      }
      return out;
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
              <select class="sort-select sort-action"><option value="Date">Date</option><option value="Views">Views</option><option value="Duration">Duration</option><option value="Comments">Comments</option><option value="Likes">Likes</option></select>
              <button class="sort-btn sort-action" type="button" title="Toggle sort order"><span class="icon">▼</span></button>
            </div>
          </div>
        `;
        gridWrap.parentNode.insertBefore(toolbar, gridWrap);
        const select = toolbar.querySelector('.sort-select');
        const sortBtn = toolbar.querySelector('.sort-btn');
        const commentsBtn = toolbar.querySelector('.comments-btn');
        const likesBtn = toolbar.querySelector('.likes-btn');
        select.addEventListener('change', (e) => {
          sortBy = e.target.value;
          currentPage = 1;
          showAll = false;
          renderPage(1);
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
      }
      const leftEl = toolbar.querySelector('.videos-found');
      const filtered = applyFiltersAndSort(getBaseVideos());
      leftEl.textContent = `Videos Found: ${filtered.length}`;
      const selectEl = toolbar.querySelector('.sort-select');
      if (selectEl) selectEl.value = sortBy || 'Date';
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
    }
    function renderPage(page) {
      currentPage = page;
      renderToolbar();
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
      } else {
        paginationWrap.innerHTML = '';
      }
      if (remaining > 0) {
        const showAllWrap = document.createElement('div');
        showAllWrap.className = 'show-all-wrap';
        const showAllBtn = document.createElement('button');
        showAllBtn.className = 'show-all-btn';
        if (showAll) {
          showAllBtn.textContent = `Hide all ${Math.max(0, sorted.length - videosPerPage)} videos`;
        } else {
          showAllBtn.textContent = `Show all ${remaining} videos`;
        }
        showAllBtn.addEventListener('click', () => {
          showAll = !showAll;
          renderPage(1);
        });
        showAllWrap.appendChild(showAllBtn);
        paginationWrap.appendChild(showAllWrap);
      } else {
        if (showAll && sorted.length > 0) {
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
    }
    renderToolbar();
    renderPage(1);
    const headerInfoContainer = document.createElement('div');
    headerInfoContainer.className = 'yt-header-information';
    const totalComments = allYTChannelVideos.reduce((s, v) => s + (Number(v.comment_count) || 0), 0);
    const totalLikes = allYTChannelVideos.reduce((s, v) => s + (Number(v.like_count) || 0), 0);
    let avatarUrl = '';
    let coverUrl = '';
    let title = 'Channel Videos';
    let descDecoded = '';
    if (allYTChannelData && allYTChannelData.snippet) {
      const snippet = allYTChannelData.snippet;
      const stats = allYTChannelData.statistics || {};
      avatarUrl = (snippet.thumbnails && snippet.thumbnails.high && snippet.thumbnails.high.url) ? snippet.thumbnails.high.url : '';
      coverUrl = (allYTChannelData.brandingSettings && allYTChannelData.brandingSettings.image && (allYTChannelData.brandingSettings.image.bannerExternalUrl || allYTChannelData.brandingSettings.image.bannerMobileImageUrl || allYTChannelData.brandingSettings.image.bannerTvHighImageUrl)) ? (allYTChannelData.brandingSettings.image.bannerExternalUrl || allYTChannelData.brandingSettings.image.bannerMobileImageUrl || allYTChannelData.brandingSettings.image.bannerTvHighImageUrl) : '';
      const descRaw = snippet.description || '';
      descDecoded = decodeHtml(descRaw);
      title = snippet.title || 'Channel';
    }
    headerInfoContainer.innerHTML = `
      <img src="${escapeHtml(avatarUrl)}" class="yt-header-pfp" alt="${escapeHtml(title)}" />
      <div class="yt-header-meta" role="region" aria-label="channel header">
      <h1>${escapeHtml(title)}</h1>
      <p class="yt-header-desc" data-full="${escapeHtml(descDecoded)}"></p>
      <div class="yt-channel-stats">
        <div class="yt-videos-row">
        <a class="subscribe-btn" href="https://www.youtube.com/channel/${channelId}${allYTChannelData && allYTChannelData.statistics ? '?sub_confirmation=1' : ''}" target="_blank" rel="noreferrer">
          <span class="sub-label">Subscribe</span><span class="sub-count">${allYTChannelData && allYTChannelData.statistics ? numberToLocale(allYTChannelData.statistics.subscriberCount) : 'NA'}</span>
        </a>
        </div>
        <div>Videos: ${allYTChannelData && allYTChannelData.statistics ? numberToLocale(allYTChannelData.statistics.videoCount) : 'NA'}</div>
        <div>Total Views: ${allYTChannelData && allYTChannelData.statistics ? numberToLocale(allYTChannelData.statistics.viewCount) : 'NA'}</div>
        <div>Total Likes: ${numberToLocale(totalLikes)}</div>
        <div>Total Comments: ${numberToLocale(totalComments)}</div>
      </div>
      </div>
    `;
    setTimeout(() => {
      const metaEl = headerInfoContainer.querySelector('.yt-header-meta');
      if (metaEl) {
        metaEl.style.setProperty('--yt-cover', coverUrl ? `url("${coverUrl}")` : 'none');
      }
    }, 0);
    const headerEl = section.querySelector('.yt-vid-section-header');
    const existingHeaderInfo = headerEl.querySelector('.yt-header-information');
    if (existingHeaderInfo) headerEl.replaceChild(headerInfoContainer, existingHeaderInfo); else headerEl.insertBefore(headerInfoContainer, headerEl.firstChild);
    const newHeader = headerEl.querySelector('.yt-header-information');
    if (newHeader) {
      const descEl = newHeader.querySelector('.yt-header-desc');
      if (descEl) {
        const fullEscaped = descEl.getAttribute('data-full') || '';
        const fullDecoded = decodeHtml(fullEscaped);
        const short = fullDecoded.length > 240 ? fullDecoded.slice(0,240) + '…' : fullDecoded;
        descEl.innerHTML = highlightLinks(highlightHashtags(escapeHtml(short || 'Latest uploads'))).replace(/\n/g, '<br>');
        descEl.addEventListener('click', () => {
          if (descEl.classList.contains('expanded')) {
            descEl.classList.remove('expanded');
            descEl.innerHTML = highlightLinks(highlightHashtags(escapeHtml(short || 'Latest uploads'))).replace(/\n/g, '<br>');
          } else {
            descEl.classList.add('expanded');
            descEl.innerHTML = highlightLinks(highlightHashtags(escapeHtml(fullDecoded || 'Latest uploads'))).replace(/\n/g, '<br>');
          }
        });
      }
      const subscribe = newHeader.querySelector('.subscribe-btn');
      if (subscribe) {
        subscribe.addEventListener('click', (e) => {
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
            const otherIndex = currentChannelIndex === 0 ? 1 : 0;
            const otherId = channelIds[otherIndex];
            let otherName = otherId;
            if (channelInfoCache[otherId] && channelInfoCache[otherId].snippet && channelInfoCache[otherId].snippet.title) {
              otherName = channelInfoCache[otherId].snippet.title;
            } else {
              const info = await fetchChannelInfo(otherId);
              if (info && info.snippet && info.snippet.title) otherName = info.snippet.title;
            }
            switchBtn.setAttribute('data-tooltip', `Switch to ${otherName}?`);
          });
          switchBtn.addEventListener('mouseleave', () => {
            switchBtn.setAttribute('data-tooltip', '');
          });
          switchBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            currentChannelIndex = currentChannelIndex === 0 ? 1 : 0;
            channelId = channelIds[currentChannelIndex];
            allYTChannelVideos = [];
            allYTChannelData = null;
            if (loadingEl) loadingEl.style.display = 'block';
            if (container) container.style.display = 'none';
            await fetchAllYTData();
            if (loadingEl) loadingEl.style.display = 'none';
            if (container) container.style.display = '';
            window.showYTvidSection();
          });
        }
      }
    }
    if (searchInput) {
      let t;
      searchInput.oninput = () => {
        clearTimeout(t);
        t = setTimeout(() => renderPage(1), 300);
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
