// yt-api.js
let rawApiKey = (import.meta && import.meta.env && import.meta.env.VITE_YT_API_KEY) || (typeof window !== 'undefined' ? window.YT_API_KEY || '' : '') || '';
const apiKey = String(rawApiKey).replace(/^"|"$/g, '');

let channelIds = ['UCPrdw58ZZXJyKYXdcCGViWw','UCrEuhIEG3ndKQ0zO9EjMWag'];
let currentChannelIndex = 0;
let channelId = channelIds[currentChannelIndex];

let allYTChannelVideos = [];
let allYTChannelData = null;

const channelInfoCache = {};
const playlistsCache = {};
const playlistItemsCache = {};

export function hasApiKey() {
  return Boolean(apiKey);
}

export function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
export function decodeHtml(str) {
  if (!str) return '';
  let s = String(str);
  s = s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  s = s.replace(/&#(\d+);/g, (m, code) => String.fromCharCode(parseInt(code, 10)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
  return s;
}
export function formatSeconds(sec) {
  if (sec == null) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
export function numberToLocale(n) {
  if (n == null || n === 'NA') return 'NA';
  const num = Number(n);
  if (Number.isNaN(num)) return n;
  return num.toLocaleString('en-US');
}
export function formatDate(dateInput) {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return dateInput;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function secondsToHMS(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return '--:--:--';
  const s = Number(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}
export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return 'NA';
  const b = Number(bytes);
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  const val = b / Math.pow(k, i);
  return `${parseFloat(val.toFixed(2))} ${sizes[i]}`;
}
export function estimateVideoBytes(durationSeconds, bitrateBps=5000000) {
  if (!durationSeconds) return null;
  const bits = Number(durationSeconds) * Number(bitrateBps || 0);
  const bytes = bits / 8;
  return bytes;
}

export function getChannelIds() { return channelIds.slice(); }
export function setChannelIds(ids) {
  if (Array.isArray(ids) && ids.length) {
    channelIds = ids.slice();
    currentChannelIndex = 0;
    channelId = channelIds[0];
  }
}
export function getCurrentChannelIndex() { return currentChannelIndex; }
export function setCurrentChannelIndex(i) {
  if (typeof i === 'number' && i >= 0 && i < channelIds.length) {
    currentChannelIndex = i;
    channelId = channelIds[currentChannelIndex];
  }
}
export function getChannelId() { return channelId; }
export function setChannelId(id) {
  if (!id) return;
  const exist = channelIds.indexOf(id);
  if (exist >= 0) {
    currentChannelIndex = exist;
  } else {
    channelIds.unshift(id);
    currentChannelIndex = 0;
  }
  channelId = channelIds[currentChannelIndex];
}

export function getAllYTChannelVideos() { return allYTChannelVideos.slice(); }
export function getAllYTChannelData() { return allYTChannelData ? JSON.parse(JSON.stringify(allYTChannelData)) : null; }

export function getCachedPlaylistItems(playlistId) {
  return playlistItemsCache[playlistId];
}
export function getCachedPlaylists(channelIdParam) {
  return playlistsCache[channelIdParam];
}
export function getCachedChannelInfo(id) {
  return channelInfoCache[id];
}

export async function fetchChannelInfo(id) {
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

export async function fetchPlaylistsForChannel(id) {
  if (!id) return [];
  if (playlistsCache[id]) return playlistsCache[id];
  const list = [];
  if (!apiKey) {
    playlistsCache[id] = list;
    return list;
  }
  try {
    let nextPage = '';
    do {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlists?key=${apiKey}&channelId=${id}&part=snippet&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}`);
      if (!res.ok) break;
      const j = await res.json();
      (j.items || []).forEach(it => {
        list.push({ id: it.id, title: it.snippet && it.snippet.title ? it.snippet.title : '' });
      });
      nextPage = j.nextPageToken || '';
    } while (nextPage);
  } catch (e) {}
  list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  playlistsCache[id] = list;
  return list;
}

export async function fetchPlaylistVideoIds(playlistId) {
  if (!playlistId) return new Set();
  if (playlistItemsCache[playlistId]) return playlistItemsCache[playlistId];
  const ids = new Set();
  if (!apiKey) {
    playlistItemsCache[playlistId] = ids;
    return ids;
  }
  try {
    let nextPage = '';
    do {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=contentDetails&maxResults=50${nextPage ? `&pageToken=${nextPage}` : ''}`);
      if (!res.ok) break;
      const j = await res.json();
      (j.items || []).forEach(it => {
        const vid = it.contentDetails && it.contentDetails.videoId ? it.contentDetails.videoId : null;
        if (vid) ids.add(vid);
      });
      nextPage = j.nextPageToken || '';
    } while (nextPage);
  } catch (e) {}
  playlistItemsCache[playlistId] = ids;
  return ids;
}

export async function fetchAllYTData() {
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
              v.estimated_bytes = estimateVideoBytes(v.duration_seconds);
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

  return { channelData: allYTChannelData, videos: getAllYTChannelVideos() };
}

export function parseYouTubeLink(input) {
  if (!input) return {};
  const txt = input.trim();
  let u;
  try {
    u = new URL(txt);
  } catch (e) {
    if (/^UC[A-Za-z0-9_-]{22}$/.test(txt)) return { channelId: txt };
    return { raw: txt };
  }
  const host = u.hostname.toLowerCase();
  const pathname = (u.pathname || '').replace(/\/+$/, '');
  const search = u.search || '';
  const chMatch = pathname.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
  if (chMatch) return { channelId: chMatch[1] };
  const userMatch = pathname.match(/\/user\/([^\/\?]+)/);
  if (userMatch) return { username: userMatch[1] };
  const cMatch = pathname.match(/\/c\/([^\/\?]+)/);
  if (cMatch) return { custom: cMatch[1] };
  const atMatch = pathname.match(/\/@([^\/\?]+)/);
  if (atMatch) return { handle: atMatch[1] };
  const vParam = (new URLSearchParams(search)).get('v');
  if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) return { videoId: vParam };
  const shortMatch = pathname.match(/\/([A-Za-z0-9_-]{11})$/);
  if (shortMatch && host.includes('youtu.be')) return { videoId: shortMatch[1] };
  const maybeVid = pathname.replace(/\//g, '');
  if (/^[A-Za-z0-9_-]{11}$/.test(maybeVid)) return { videoId: maybeVid };
  return { raw: txt };
}

export async function resolveToChannelId(parsed) {
  if (!parsed) return null;
  if (parsed.channelId) return parsed.channelId;
  if (parsed.videoId) {
    if (!apiKey) return null;
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${parsed.videoId}&key=${apiKey}`);
      if (!r.ok) return null;
      const j = await r.json();
      if (j.items && j.items[0] && j.items[0].snippet && j.items[0].snippet.channelId) return j.items[0].snippet.channelId;
    } catch (e) { return null; }
  }
  if (parsed.username) {
    if (!apiKey) return null;
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${encodeURIComponent(parsed.username)}&key=${apiKey}`);
      if (!r.ok) return null;
      const j = await r.json();
      if (j.items && j.items[0] && j.items[0].id) return j.items[0].id;
    } catch (e) { return null; }
  }
  if (parsed.custom || parsed.handle) {
    if (!apiKey) return null;
    const q = parsed.custom || parsed.handle;
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(q)}&maxResults=1&key=${apiKey}`);
      if (!r.ok) return null;
      const j = await r.json();
      if (j.items && j.items[0] && j.items[0].snippet && j.items[0].snippet.channelId) return j.items[0].snippet.channelId;
      if (j.items && j.items[0] && j.items[0].id && j.items[0].id.channelId) return j.items[0].id.channelId;
    } catch (e) { return null; }
  }
  return null;
}

if (typeof window !== 'undefined') {
  window.YT_API_KEY = window.YT_API_KEY || apiKey || '';
}
