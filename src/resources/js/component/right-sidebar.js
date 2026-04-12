let designModule = null

async function ensureDesignModule() {
  if (designModule) return designModule
  try {
    const mod = await import('../function/script-design.js')
    designModule = mod
    return mod
  } catch (e) {
    return null
  }
}

export function openRightSidebar() {
  try {
    const sb = document.getElementById('right-sidebar')
    if (sb) {
      sb.classList.add('open')
      sb.setAttribute('aria-hidden', 'false')
    }
  } catch (e) {}
}

export function closeRightSidebar() {
  try {
    const sb = document.getElementById('right-sidebar')
    if (sb) {
      sb.classList.remove('open')
      sb.setAttribute('aria-hidden', 'true')
    }
  } catch (e) {}
}

export function toggleRightSidebar() {
  try {
    const sb = document.getElementById('right-sidebar')
    if (!sb) return
    if (sb.classList.contains('open')) closeRightSidebar()
    else openRightSidebar()
  } catch (e) {}
}

export function initRightSidebar(settings, saveSettings, escapeHtml, attemptPlayMusic) {
  try {
    const btn = document.getElementById('settings-toggle')
    const panel = document.getElementById('right-sidebar')
    const closeBtn = document.getElementById('settings-close')

    if (btn && panel) {
      btn.addEventListener('click', () => {
        if (panel.dataset.chatMode === 'true') {
          closeSidebar()
        } else {
          panel.classList.add('open')
          panel.setAttribute('aria-hidden', 'false')
        }
      })
    }

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', () => {
        panel.classList.remove('open')
        panel.setAttribute('aria-hidden', 'true')
      })
    }

    if (panel) {
      panel.addEventListener('mouseleave', () => {
        panel.classList.remove('open')
        panel.setAttribute('aria-hidden', 'true')
      })
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (panel) {
            panel.classList.remove('open')
            panel.setAttribute('aria-hidden', 'true')
          }
        }
      })
    }

    const sSounds = document.getElementById('setting-sounds')
    const sMusic = document.getElementById('setting-music')
    const sMusicLoop = document.getElementById('setting-music-loop')
    const sType = document.getElementById('setting-typewriter')
    const sSpeedInput = document.getElementById('setting-typewriter-speed')
    const sVolume = document.getElementById('setting-music-volume')

    if (sSounds) sSounds.addEventListener('change', () => {
      settings.sounds = sSounds.checked
      saveSettings()
    })
    if (sMusic) sMusic.addEventListener('change', () => {
      settings.music = sMusic.checked
      saveSettings()
      applySettingsToUI(settings, attemptPlayMusic)
    })
    if (sMusicLoop) sMusicLoop.addEventListener('change', () => {
      settings.musicLoop = sMusicLoop.checked
      saveSettings()
      const bg = document.getElementById('bg-music')
      if (bg) bg.loop = sMusicLoop.checked
    })
    if (sType) sType.addEventListener('change', () => {
      settings.typewriter = sType.checked
      saveSettings()
      if (!settings.typewriter) {
        if (window.chatpage && Array.isArray(window.chatpage.chatMessages)) window.chatpage.chatMessages.forEach(m => m._typed = true)
        if (window.renderChatMessages) window.renderChatMessages()
      }
    })
    if (sSpeedInput) sSpeedInput.addEventListener('input', () => {
      settings.typewriterSpeed = Number(sSpeedInput.value) || 0.015
      saveSettings()
    })

    if (sVolume) {
      sVolume.addEventListener('input', () => {
        const val = Number(sVolume.value)
        settings.musicVolume = isNaN(val) ? 0.65 : val
        saveSettings()
        const bg = document.getElementById('bg-music')
        if (bg) bg.volume = settings.musicVolume
      })
      sVolume.addEventListener('change', () => {
        const val = Number(sVolume.value)
        settings.musicVolume = isNaN(val) ? 0.65 : val
        saveSettings()
      })
    }

    const prevBtn = document.getElementById('music-prev')
    const nextBtn = document.getElementById('music-next')
    const titleEl = document.getElementById('music-title')
    const bg = document.getElementById('bg-music')

    if (bg) {
      try {
        bg.loop = false
        bg.addEventListener('ended', () => {
          try {
            if (settings.musicLoop) {
              try {
                bg.currentTime = 0
                bg.play && bg.play().catch(() => {})
              } catch (e) {}
            } else {
              nextMusic()
              if (settings.music) {
                setTimeout(() => {
                  bg.play && bg.play().catch(() => {})
                }, 50)
              }
            }
          } catch (e) {}
        })
      } catch (e) {}
    }

    window._musicList = window._musicList || []
    window._musicIndex = window._musicIndex || 0

    async function loadMusicManifest() {
      try {
        const resp = await fetch('/assets/audio/music/manifest.json')
        if (!resp.ok) throw new Error('no manifest')
        let list = await resp.json()
        if (Array.isArray(list) && list.length) {
          list = list.map(x => {
            if (typeof x === 'string' && (x.startsWith('http') || x.startsWith('/'))) {
              const parts = x.split('/')
              return parts[parts.length - 1]
            }
            return x
          })
          window._musicList = list
          window._musicIndex = 0
          updateMusicTitle()
        }
      } catch (e) {
        if ((!window._musicList || !window._musicList.length) && bg && bg.src) {
          window._musicList = [bg.src]
          window._musicIndex = 0
          updateMusicTitle()
        }
      }
    }

    function getMusicSrcByIdx(idx) {
      const list = window._musicList || []
      if (!list.length) return ''
      const file = list[idx] || ''
      if (!file) return ''
      if (file.startsWith('http') || file.startsWith('/')) return file
      return '/assets/audio/music/' + file
    }

    function updateMusicTitle() {
      const list = window._musicList || []
      const i = window._musicIndex || 0
      const src = list[i] || ''
      const name = src.split('/').pop() || 'No music'
      if (titleEl) titleEl.innerHTML = `<span>${escapeHtml(name)}</span>`
      if (bg && src) {
        const realSrc = getMusicSrcByIdx(i)
        const cur = bg.src || ''
        if (cur !== realSrc) {
          try {
            bg.loop = false
            bg.src = realSrc
            bg.currentTime = 0
            bg.load && bg.load()
          } catch (e) {
            bg.src = realSrc
            bg.load && bg.load()
          }
          if (settings.music) {
            setTimeout(() => {
              bg.play && bg.play()
            }, 50)
          }
        }
      }
    }

    function nextMusic() {
      const list = window._musicList || []
      if (!list.length) return
      window._musicIndex = (window._musicIndex + 1) % list.length
      updateMusicTitle()
    }

    function prevMusic() {
      const list = window._musicList || []
      if (!list.length) return
      window._musicIndex = (window._musicIndex - 1 + list.length) % list.length
      updateMusicTitle()
    }

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      prevMusic()
      window._preventSettingsAutoClose = true
    })
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      nextMusic()
      window._preventSettingsAutoClose = true
    })

    loadMusicManifest()
  } catch (e) {}
}

export function applySettingsToUI(settings, attemptPlayMusic) {
  const sSounds = document.getElementById('setting-sounds')
  const sMusic = document.getElementById('setting-music')
  const sMusicLoop = document.getElementById('setting-music-loop')
  const sType = document.getElementById('setting-typewriter')
  const sSpeed = document.getElementById('setting-typewriter-speed')
  const sVolume = document.getElementById('setting-music-volume')
  if (sSounds) sSounds.checked = !!settings.sounds
  if (sMusic) sMusic.checked = !!settings.music
  if (sMusicLoop) sMusicLoop.checked = !!settings.musicLoop
  if (sType) sType.checked = !!settings.typewriter
  if (sSpeed) sSpeed.value = typeof settings.typewriterSpeed === 'number' ? settings.typewriterSpeed : 0.015
  if (sVolume) sVolume.value = typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.65
  const bg = document.getElementById('bg-music')
  if (bg) {
    bg.loop = !!settings.musicLoop
    if (settings.music) {
      bg.volume = typeof settings.musicVolume === 'number' ? settings.musicVolume : 0.65
      attemptPlayMusic()
    } else {
      try {
        bg.pause()
        bg.currentTime = 0
      } catch (e) {}
    }
  }
}

let rawApiKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_YT_API_KEY) ||
  (typeof window !== 'undefined' ? window.YT_API_KEY || '' : '') ||
  '';

const apiKey = String(rawApiKey).replace(/^"|"$/g, '');

const commentsCache = {};

async function fetchVideoComments(videoId, maxResults = 100) {
  if (!videoId || !apiKey) return [];
  
  const cacheKey = `${videoId}_${maxResults}`;
  if (commentsCache[cacheKey]) return commentsCache[cacheKey];

  const comments = [];
  try {
    let nextPageToken = '';
    let iteration = 0;
    
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
      url.searchParams.set('key', apiKey);
      url.searchParams.set('videoId', videoId);
      url.searchParams.set('part', 'snippet,replies');
      url.searchParams.set('maxResults', '100');
      url.searchParams.set('textFormat', 'plainText');
      url.searchParams.set('order', 'relevance');
      
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      const response = await fetch(url.toString());
      if (!response.ok) break;

      const data = await response.json();
      
      if (!data.items) break;

      data.items.forEach(thread => {
        const topComment = thread.snippet.topLevelComment;
        const replies = thread.replies?.comments || [];

        comments.push({
          id: topComment.id,
          videoId: videoId,
          authorName: topComment.snippet.authorDisplayName,
          authorProfileImageUrl: topComment.snippet.authorProfileImageUrl,
          textDisplay: topComment.snippet.textDisplay,
          likeCount: topComment.snippet.likeCount || 0,
          publishedAt: topComment.snippet.publishedAt,
          replyCount: thread.snippet.totalReplyCount || 0,
          replies: replies.map(reply => ({
            id: reply.id,
            videoId: videoId,
            authorName: reply.snippet.authorDisplayName,
            authorProfileImageUrl: reply.snippet.authorProfileImageUrl,
            textDisplay: reply.snippet.textDisplay,
            likeCount: reply.snippet.likeCount || 0,
            publishedAt: reply.snippet.publishedAt,
            isReply: true,
          })),
          isReply: false,
        });
      });

      nextPageToken = data.nextPageToken || '';
      iteration++;
      
      if (comments.length >= maxResults) {
        comments.splice(maxResults);
        break;
      }
    } while (nextPageToken && iteration < 10);

  } catch (error) {
    console.error('Error fetching comments:', error);
  }

  commentsCache[cacheKey] = comments;
  return comments;
}

function clearCommentsCache() {
  for (const key in commentsCache) {
    delete commentsCache[key];
  }
}

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return Math.floor(seconds) + 's ago';
  } catch (e) {
    return '';
  }
}

function numberToLocale(n) {
  if (n == null || n === 'NA') return 'NA';
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  return num.toLocaleString('en-US');
}

const COMMENTS_PER_PAGE = 20;

let currentComments = [];
let currentPage = 1;
let currentVideoId = null;
let currentSortBy = 'newest';
let isLoading = false;

export async function showVideoComments(videoId, openSidebar = true) {
  if (!window.innerWidth) return;
  
  currentPage = 1;
  currentSortBy = 'newest';
  isLoading = true;

  const sidebar = document.getElementById('right-sidebar');
  if (!sidebar) return;

  try {
    const oldContent = sidebar.innerHTML;
    
    const chatContent = document.createElement('div');
    chatContent.id = 'yt-chat-content';
    chatContent.className = 'yt-chat-container';
    chatContent.innerHTML = `
      <div class="yt-chat-header">
        <h3>YouTube Comments</h3>
        <button id="close-sidebar" class="settings-close" aria-label="Close comments"><i class="fas fa-times"></i></button>
      </div>
      <div class="yt-chat-loading">Loading comments from all videos...</div>
    `;
    
    sidebar.innerHTML = '';
    sidebar.appendChild(chatContent);
    
    sidebar.dataset.originalContent = oldContent;
    sidebar.dataset.chatMode = 'true';

    if (openSidebar) {
      openRightSidebar();
    }

    let comments = [];
    const allVideos = window.getAllYTChannelVideos ? window.getAllYTChannelVideos() : [];
    if (Array.isArray(allVideos) && allVideos.length > 0) {
      for (const video of allVideos) {
        const videoComments = await fetchVideoComments(video.id, 20);
        comments = comments.concat(videoComments);
      }
    } else if (videoId) {
      comments = await fetchVideoComments(videoId, 100);
    }
    currentComments = comments;

    if (comments.length === 0) {
      const container = sidebar.querySelector('.yt-chat-container');
      if (container) {
        container.innerHTML = `
          <div class="yt-chat-header">
            <h3>YouTube Comments</h3>
            <button id="close-sidebar" class="settings-close" aria-label="Close comments"><i class="fas fa-times"></i></button>
          </div>
          <div class="yt-chat-no-comments">No comments available for this video</div>
        `;
        attachChatEventListeners();
      }
      return;
    }

    renderCommentsUI();
    attachChatEventListeners();

  } catch (error) {
    console.error('Error loading comments:', error);
    const container = sidebar.querySelector('.yt-chat-container');
    if (container) {
      container.innerHTML = `
        <div class="yt-chat-header">
          <h3>YouTube Comments</h3>
          <button id="close-sidebar" class="settings-close" aria-label="Close comments"><i class="fas fa-times"></i></button>
        </div>
        <div class="yt-chat-error">Failed to load comments. Please try again.</div>
      `;
      attachChatEventListeners();
    }
  } finally {
    isLoading = false;
  }
}

function renderCommentsUI() {
  const sidebar = document.getElementById('right-sidebar');
  if (!sidebar) return;

  let sortedComments = [...currentComments];

  if (currentSortBy === 'newest') {
    sortedComments.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  } else if (currentSortBy === 'oldest') {
    sortedComments.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
  } else if (currentSortBy === 'likes') {
    sortedComments.sort((a, b) => b.likeCount - a.likeCount);
  } else if (currentSortBy === 'replies') {
    sortedComments.sort((a, b) => b.replyCount - a.replyCount);
  }

  const totalPages = Math.ceil(sortedComments.length / COMMENTS_PER_PAGE);
  const startIdx = (currentPage - 1) * COMMENTS_PER_PAGE;
  const endIdx = startIdx + COMMENTS_PER_PAGE;
  const pageComments = sortedComments.slice(startIdx, endIdx);

  let html = `
    <div class="yt-chat-container">
      <div class="yt-chat-header">
        <h3>Comments (${numberToLocale(currentComments.length)})</h3>
        <button id="close-sidebar" class="settings-close" aria-label="Close comments"><i class="fas fa-times"></i></button>
      </div>

      <div class="yt-chat-controls">
        <div class="yt-chat-sort">
          <label for="yt-sort-select">Sort:</label>
          <select id="yt-sort-select" class="yt-sort-select">
            <option value="newest" ${currentSortBy === 'newest' ? 'selected' : ''}>Newest</option>
            <option value="oldest" ${currentSortBy === 'oldest' ? 'selected' : ''}>Oldest</option>
            <option value="likes" ${currentSortBy === 'likes' ? 'selected' : ''}>Most Liked</option>
            <option value="replies" ${currentSortBy === 'replies' ? 'selected' : ''}>Most Replies</option>
          </select>
          <button id="yt-sort-direction" class="yt-sort-direction-btn" title="Toggle sort direction" aria-label="Toggle ascending/descending"><i class="fas fa-arrow-up-down"></i></button>
        </div>
      </div>

      <div class="yt-chat-body">
  `;

  pageComments.forEach(comment => {
    html += renderCommentItem(comment);
  });

  html += `
      </div>

      <div class="yt-chat-pagination">
        <button id="yt-prev-page" class="yt-pagination-btn" ${currentPage === 1 ? 'disabled' : ''}>←</button>
        <span class="yt-page-info">Page ${currentPage} of ${totalPages}</span>
        <button id="yt-next-page" class="yt-pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}>→</button>
      </div>
    </div>
  `;

  sidebar.innerHTML = html;
}

function renderCommentItem(comment) {
  const timeAgo = formatTimeAgo(comment.publishedAt);
  const escapedText = escapeCommentHtml(comment.textDisplay);
  const likeCount = numberToLocale(comment.likeCount);

  let repliesHtml = '';
  
  if (comment.replyCount > 0 && comment.replies && comment.replies.length > 0) {
    repliesHtml = `<div class="yt-comment-replies" id="replies-${escapeHtmlAttr(comment.id)}" style="display: none;">`;
    
    comment.replies.forEach(reply => {
      const replyTimeAgo = formatTimeAgo(reply.publishedAt);
      const escapedReplyText = escapeCommentHtml(reply.textDisplay);
      const replyLikeCount = numberToLocale(reply.likeCount);

      repliesHtml += `
          <div class="yt-comment-reply-item">
            <div class="yt-comment-avatar">
              <img src="${escapeHtmlAttr(reply.authorProfileImageUrl)}" alt="${escapeHtmlAttr(reply.authorName)}" class="yt-comment-avatar-img" />
            </div>

            <div class="yt-comment-content">
              <div class="yt-comment-header">
                <span class="yt-comment-author">${escapeHtmlAttr(reply.authorName)}</span>
                <span class="yt-comment-time">${replyTimeAgo}</span>
              </div>

              <div class="yt-comment-text">${escapedReplyText}</div>

              <div class="yt-comment-meta">
                <span class="yt-comment-like">
                  <i class="fas fa-thumbs-up"></i> ${replyLikeCount}
                </span>
              </div>
            </div>
          </div>
      `;
    });
    
    repliesHtml += `</div>`;
  }

  let html = `
    <div class="yt-comment-item" data-comment-id="${escapeHtmlAttr(comment.id)}">
      <div class="yt-comment-avatar">
        <img src="${escapeHtmlAttr(comment.authorProfileImageUrl)}" alt="${escapeHtmlAttr(comment.authorName)}" class="yt-comment-avatar-img" />
      </div>

      <div class="yt-comment-content">
        <div class="yt-comment-header">
          <span class="yt-comment-author">${escapeHtmlAttr(comment.authorName)}</span>
          <span class="yt-comment-time">${timeAgo}</span>
        </div>

        <div class="yt-comment-text">${escapedText}</div>

        <div class="yt-comment-meta">
          <span class="yt-comment-like">
            <i class="fas fa-thumbs-up"></i> ${likeCount}
          </span>
  `;

  if (comment.replyCount > 0) {
    html += `
          <button class="yt-comment-replies-btn" data-comment-id="${escapeHtmlAttr(comment.id)}">
            <i class="fas fa-reply"></i> ${comment.replyCount} ${comment.replyCount === 1 ? 'Reply' : 'Replies'}
          </button>
    `;
  }

  html += `
        </div>
        ${repliesHtml}
      </div>
    </div>
  `;

  return html;
}

function attachChatEventListeners() {
  const closeBtn = document.getElementById('close-sidebar');
  const sortSelect = document.getElementById('yt-sort-select');
  const sortDirBtn = document.getElementById('yt-sort-direction');
  const prevPageBtn = document.getElementById('yt-prev-page');
  const nextPageBtn = document.getElementById('yt-next-page');
  const repliesBtns = document.querySelectorAll('.yt-comment-replies-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  if (sortDirBtn) {
    sortDirBtn.addEventListener('click', () => {
      currentPage = 1;
      renderCommentsUI();
      attachChatEventListeners();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSortBy = e.target.value;
      currentPage = 1;
      renderCommentsUI();
      attachChatEventListeners();
    });
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderCommentsUI();
        attachChatEventListeners();
        document.querySelector('.yt-chat-body')?.scrollTo(0, 0);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(currentComments.length / COMMENTS_PER_PAGE);
      if (currentPage < totalPages) {
        currentPage++;
        renderCommentsUI();
        attachChatEventListeners();
        document.querySelector('.yt-chat-body')?.scrollTo(0, 0);
      }
    });
  }

  repliesBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const commentId = btn.getAttribute('data-comment-id');
      const repliesContainer = document.getElementById(`replies-${commentId}`);
      
      if (repliesContainer) {
        const isOpen = repliesContainer.style.display !== 'none';
        repliesContainer.style.display = isOpen ? 'none' : 'block';
        btn.classList.toggle('open', !isOpen);
      }
    });
  });
}

function closeSidebar() {
  const sidebar = document.getElementById('right-sidebar');
  if (!sidebar) return;
  const originalContent = sidebar.dataset.originalContent;
  if (originalContent) {
    sidebar.innerHTML = originalContent;
    delete sidebar.dataset.originalContent;
    delete sidebar.dataset.chatMode;
    if (window.initRightSidebar && window.settings) {
      try {
        window.initRightSidebar(window.settings, window.saveSettings, window.escapeHtml, window.attemptPlayMusic);
      } catch (e) {}
    }
  }
  closeRightSidebar();
}

function restoreSettings() {
  closeSidebar();
}

function escapeCommentHtml(text) {
  if (!text) return '';
  let str = String(text);
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  str = str.replace(/"/g, '&quot;');
  str = str.replace(/'/g, '&#039;');
  str = str.replace(/\n/g, '<br>');
  return str;
}

function escapeHtmlAttr(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function closeChatMode() {
  restoreSettings();
}
