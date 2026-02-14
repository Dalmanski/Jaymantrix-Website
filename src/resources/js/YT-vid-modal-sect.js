// File: yt-vid-modal-sect.js
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
let rawApiKey = (import.meta && import.meta.env && import.meta.env.VITE_YT_API_KEY) || (typeof window !== 'undefined' ? window.YT_API_KEY || '' : '') || '';
const apiKey = rawApiKey.replace(/^"|"$/g, '');
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
  const effectiveApiKey = (typeof apiKey !== 'undefined') ? apiKey : (window.YT_API_KEY || '');
  if (effectiveApiKey && video.id) {
    try {
      let comments = [];
      let nextPageToken = '';
      do {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?key=${effectiveApiKey}&videoId=${video.id}&part=snippet,replies&maxResults=100${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`);
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
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
