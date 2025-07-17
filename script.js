let jsonGames = [];
let forgottenGames = [];
let allGames = [];

const gameList = document.getElementById("game-list");
const gameCount = document.getElementById("game-count");
const searchInput = document.getElementById("searchInput");

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
  return fetch("Forget account on this game.txt")
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
      const error = document.createElement("p");
      error.textContent = `⚠️ ${err.message}`;
      error.style.color = "red";
      gameList.appendChild(error);
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

  gameList.innerHTML = "";
  categories.forEach((category) => {
    const section = document.createElement("div");
    section.className = "category-section";
    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category;
    const grid = document.createElement("div");
    grid.className = "game-grid";

    grouped[category].forEach((game) => {
      const card = document.createElement("div");
      card.className = "game-card";

      if (game.isForgotten) {
        card.innerHTML = `<div class="game-name">${game.name}</div>`;
      } else {
        const tooltipText = game.description || "Click to copy this ID";
        card.innerHTML = `
            <div class="tooltip">${tooltipText}</div>
            <img src="${game.icon}" alt="${game.name}" />
            <div class="game-name">${game.name}</div>
            <div class="player-id">${game.user_id}</div>
            <div class="copied-msg">Copied!</div>
          `;
        card.addEventListener("click", () => {
          navigator.clipboard.writeText(game.id);
          card.classList.add("show-copied");
          setTimeout(() => card.classList.remove("show-copied"), 1200);
        });
      }

      grid.appendChild(card);
    });

    section.appendChild(title);
    section.appendChild(grid);
    gameList.appendChild(section);
  });

  gameCount.textContent = `Games Found: ${gameData.length}`;
}

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

      lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith(">")) {
          if (currentTitle && currentItems.length > 0) {
            renderNoteSection(container, currentTitle, currentItems);
          }
          currentTitle = trimmed.replace(/^>\s*/, "");
          currentItems = [];
        } else if (trimmed !== "") {
          currentItems.push(trimmed);
        }

        if (index === lines.length - 1 && currentTitle && currentItems.length > 0) {
          renderNoteSection(container, currentTitle, currentItems);
        }
      });
    })
    .catch((err) => {
      const error = document.createElement("p");
      error.textContent = `⚠️ ${err.message}`;
      error.style.color = "red";
      container.appendChild(error);
    });
}

function renderNoteSection(container, titleText, items) {
  const section = document.createElement("div");
  section.className = "note-block";

  const title = document.createElement("h3");
  title.textContent = titleText;
  title.addEventListener("click", () => {
    const content = title.nextElementSibling;
    content.style.display = content.style.display === "block" ? "none" : "block";
  });

  const content = document.createElement("div");
  content.className = "note-content";

  const list = document.createElement("ol");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  content.appendChild(list);
  section.appendChild(title);
  section.appendChild(content);
  container.appendChild(section);
}

document.addEventListener("DOMContentLoaded", () => {
  loadGames();
  loadNotes();
});
