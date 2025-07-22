let jsonGames = [];
let forgottenGames = [];
let allGames = [];

const gameList = document.getElementById("game-list");
const gameCount = document.getElementById("game-count");
const searchInput = document.getElementById("searchInput");

fetch("MyYTinfo.json")
  .then((response) => response.json())
  .then((data) => {
    const iconUrl = data.icon || "https://via.placeholder.com/100x100?text=No+Icon";
    document.getElementById("dynamic-favicon").href = iconUrl;

    const h1 = document.getElementById("yt-header");
    h1.innerHTML = `<img src="${iconUrl}" alt="Channel Icon" style="width:32px;height:32px;vertical-align:middle;border-radius:50%;margin-right:10px;">${h1.innerHTML}`;
  });

function loadGames() {
  fetch("MyGames.json")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load game list.");
      return res.text();
    })
    .then((text) => {
      jsonGames = eval(text);
      return loadForgottenAccounts();
    })
    .catch((err) => {
      gameList.innerHTML = `<p style="color:red;">⚠️ ${err.message}</p>`;
    });
}

function loadForgottenAccounts() {
  return fetch("forget_acc.txt")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load forgotten accounts.");
      return res.text();
    })
    .then((text) => {
      forgottenGames = text
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((name) => ({ name: name.trim(), category: "Forgotten Accounts", isForgotten: true }));

      allGames = [...jsonGames, ...forgottenGames];
      renderGames(allGames);
    })
    .catch((err) => {
      gameList.innerHTML += `<p style="color:red;">⚠️ ${err.message}</p>`;
    });
}

function renderGames(gameData) {
  const grouped = {};

  gameData.forEach((game) => {
    const category = game.category || "Other Games";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(game);
  });

  const categories = Object.keys(grouped).sort((a, b) => {
    if (a === "Forgotten Accounts") return 1;
    if (b === "Forgotten Accounts") return -1;
    if (a === "Other Games") return 1;
    if (b === "Other Games") return -1;
    return a.localeCompare(b);
  });

  let html = "";
  categories.forEach((category) => {
    let cards = "";
    grouped[category].forEach((game, index) => {
      if (game.isForgotten) {
        cards += `<div class="game-card"><div class="game-name">${game.name}</div></div>`;
      } else {
        const tooltipText = game.description || "Click to copy this ID";
        cards += `
          <div class="game-card" onclick="copyToClipboard('${game.id}', ${index}, '${category.replace(/'/g, "\\'")}')">
            <div class="tooltip">${tooltipText}</div>
            <img src="${game.icon}" alt="${game.name}" />
            <div class="game-name">${game.name}</div>
            <div class="player-id">${game.user_id}</div>
            <div class="copied-msg" id="copied-${category}-${index}">Copied!</div>
          </div>`;
      }
    });

    html += `
      <div class="category-section">
        <h2 class="category-title">${category}</h2>
        <div class="game-grid">${cards}</div>
      </div>`;
  });

  gameList.innerHTML = html;
  gameCount.textContent = `Games Found: ${gameData.length}`;
}

function copyToClipboard(text, index, category) {
  navigator.clipboard.writeText(text);
  const el = document.getElementById(`copied-${category}-${index}`);
  el.parentElement.classList.add("show-copied");
  setTimeout(() => {
    el.parentElement.classList.remove("show-copied");
  }, 1200);
}

// Search filter
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();

  const filtered = allGames.filter((game) => {
    if (game.isForgotten) {
      return game.name.toLowerCase().includes(query);
    } else {
      return game.name.toLowerCase().includes(query) || game.id?.toLowerCase().includes(query) || game.category?.toLowerCase().includes(query);
    }
  });

  renderGames(filtered);
});

function showSection(section) {
  document.getElementById("game-list").style.display = section === "games" ? "block" : "none";
  document.getElementById("notes-section").style.display = section === "notes" ? "block" : "none";
  gameCount.style.display = section === "games" ? "block" : "none";
}

function loadNotes() {
  const container = document.getElementById("notes-container");
  container.innerHTML = "";

  fetch("notes_section.txt")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load notes.");
      return res.text();
    })
    .then((text) => {
      const lines = text.split("\n");
      let currentTitle = "";
      let currentItems = [];
      let html = "";

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith(">")) {
          if (currentTitle && currentItems.length > 0) {
            html += buildNoteSection(currentTitle, currentItems);
          }
          currentTitle = trimmed.replace(/^>\s*/, "");
          currentItems = [];
        } else if (trimmed !== "") {
          currentItems.push(trimmed);
        }

        if (index === lines.length - 1 && currentTitle && currentItems.length > 0) {
          html += buildNoteSection(currentTitle, currentItems);
        }
      });

      container.innerHTML = html;
      addNoteToggleListeners();
    })
    .catch((err) => {
      container.innerHTML = `<p style="color:red;">⚠️ ${err.message}</p>`;
    });
}

function buildNoteSection(title, items) {
  const listItems = items.map((item) => `<li>${item}</li>`).join("");
  return `
    <div class="note-block">
      <h3 class="note-title">${title}</h3>
      <div class="note-content" style="display:none;">
        <ol>${listItems}</ol>
      </div>
    </div>`;
}

function addNoteToggleListeners() {
  document.querySelectorAll(".note-title").forEach((title) => {
    title.addEventListener("click", () => {
      const content = title.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadGames();
  loadNotes();
});
