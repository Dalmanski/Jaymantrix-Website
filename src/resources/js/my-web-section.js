import '../css/my-web-section.css';


export let myWebsites = [];
export let idx = 0;

export function resetIdx() {
  idx = 0;
}

export async function loadMyWebsites() {
  try {
    const res = await fetch('/My_Info/MyWebsite.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        myWebsites = data;
      } else if (data && Array.isArray(data.my_games_website)) {
        myWebsites = data.my_games_website;
      } else {
        myWebsites = [];
      }
    }
  } catch {}
}

export function renderMyWebSection() {
  const section = document.getElementById('my-web-section');
  if (!section) return;
  section.classList.add('entering');
  section.innerHTML = '';
  if (!myWebsites.length) {
    const empty = document.createElement('div');
    empty.className = 'my-web-header';
    empty.textContent = 'No websites found.';
    section.appendChild(empty);
    return;
  }
  const data = myWebsites[idx];
  const header = document.createElement('div');
  header.className = 'my-web-header';
  header.textContent = data.name || 'Untitled Website';
  header.style.cursor = 'pointer';
  header.title = 'Open website in new tab';
  header.onclick = () => {
    if (data.link) window.open(data.link, '_blank', 'noopener');
  };
  const wrap = document.createElement('div');
  wrap.className = 'my-web-iframe-wrap';
  const left = document.createElement('div');
  left.className = 'my-web-arrow';
  left.innerHTML = '&#8592;';
  left.onclick = () => {
    idx = (idx - 1 + myWebsites.length) % myWebsites.length;
    renderMyWebSection();
  };
  const iframe = document.createElement('iframe');
  iframe.className = 'my-web-iframe';
  iframe.src = data.link;
  iframe.title = data.name;
  iframe.allow = 'fullscreen';
  const right = document.createElement('div');
  right.className = 'my-web-arrow';
  right.innerHTML = '&#8594;';
  right.onclick = () => {
    idx = (idx + 1) % myWebsites.length;
    renderMyWebSection();
  };
  wrap.appendChild(left);
  wrap.appendChild(iframe);
  wrap.appendChild(right);
  section.appendChild(header);
  section.appendChild(wrap);
}
