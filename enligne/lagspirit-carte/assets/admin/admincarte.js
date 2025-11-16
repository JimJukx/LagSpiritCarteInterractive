// URLs relatives depuis assets/admin/
const SECRET_URL   = 'admincarte-secret.json';
const CHAPTERS_URL = '../chapters.json';
const SAVE_URL     = '../../save_chapters.php';

let chapters = [];

// --- Vérification du code d'accès ---

async function checkCode() {
  const input   = document.getElementById('admin-code-input');
  const errorEl = document.getElementById('admin-code-error');
  const code    = input.value.trim();

  if (!code) {
    errorEl.textContent = "Merci d’entrer un code.";
    return;
  }

  try {
    const res = await fetch(SECRET_URL + '?_=' + Date.now());
    const data = await res.json();

    if (data.password && data.password === code) {
      // Code correct -> on affiche l'éditeur
      document.getElementById('login-box').style.display  = 'none';
      document.getElementById('editor-box').style.display = 'block';
      errorEl.textContent = "";
      loadChapters();
    } else {
      errorEl.textContent = "Code incorrect.";
    }
  } catch (e) {
    console.error(e);
    errorEl.textContent = "Erreur lors de la vérification du code.";
  }
}

// --- Chargement du JSON chapters ---

async function loadChapters() {
  const status = document.getElementById('save-status');
  status.textContent = "Chargement de chapters.json...";

  try {
    const res = await fetch(CHAPTERS_URL + '?_=' + Date.now());
    chapters = await res.json();
    renderChapters();
    status.textContent = "Chapitres chargés.";
  } catch (e) {
    console.error(e);
    status.textContent = "❌ Impossible de charger chapters.json.";
  }
}

// --- Affichage des chapitres ---

function renderChapters() {
  const container = document.getElementById('chapters-list');
  container.innerHTML = "";

  chapters.forEach((ch, index) => {
    const div = document.createElement('div');
    div.className = 'chapter-item';

    div.innerHTML = `
      <div class="chapter-header">Chapitre ${index + 1}</div>

      <label>Nom du chapitre</label>
      <input value="${ch.name || ''}" 
             onchange="updateChapterField(${index}, 'name', this.value)" />

      <label>Ville</label>
      <input value="${ch.city || ''}" 
             onchange="updateChapterField(${index}, 'city', this.value)" />

      <label>Email</label>
      <input value="${ch.contactEmail || ''}" 
             onchange="updateChapterField(${index}, 'contactEmail', this.value)" />

      <label>Téléphone</label>
      <input value="${ch.contactPhone || ''}" 
             onchange="updateChapterField(${index}, 'contactPhone', this.value)" />

      <label>Facebook</label>
      <input value="${ch.facebook || ''}" 
             onchange="updateChapterField(${index}, 'facebook', this.value)" />

      <label>Instagram</label>
      <input value="${ch.instagram || ''}" 
             onchange="updateChapterField(${index}, 'instagram', this.value)" />

      <label>Texte d'aide (helpInfo)</label>
      <textarea rows="2"
             onchange="updateChapterField(${index}, 'helpInfo', this.value)">${ch.helpInfo || ''}</textarea>

      <button class="btn-danger" onclick="deleteChapter(${index})">Supprimer ce chapitre</button>
    `;

    container.appendChild(div);
  });
}

window.updateChapterField = function(index, field, value) {
  chapters[index][field] = value;
};

window.deleteChapter = function(index) {
  if (!confirm("Supprimer ce chapitre ?")) return;
  chapters.splice(index, 1);
  renderChapters();
};

// --- Ajout / sauvegarde ---

async function saveChapters() {
  const status = document.getElementById('save-status');
  status.textContent = "Sauvegarde en cours...";

  try {
    const res = await fetch(SAVE_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(chapters)
    });

    const txt = await res.text();
    if (txt.trim() === 'OK') {
      status.textContent = "✅ chapters.json sauvegardé.";
    } else {
      status.textContent = "❌ Erreur de sauvegarde : " + txt;
    }
  } catch (e) {
    console.error(e);
    status.textContent = "❌ Erreur réseau pendant la sauvegarde.";
  }
}

function addChapter() {
  chapters.push({
    name: "Nouveau chapitre",
    city: "",
    contactEmail: "",
    contactPhone: "",
    facebook: "",
    instagram: "",
    helpInfo: ""
  });
  renderChapters();
}

// --- Événements ---

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-code-btn').addEventListener('click', checkCode);
  document.getElementById('add-chapter-btn').addEventListener('click', addChapter);
  document.getElementById('reload-chapters-btn').addEventListener('click', loadChapters);
  document.getElementById('save-chapters-btn').addEventListener('click', saveChapters);

  // Enter sur le champ code
  document.getElementById('admin-code-input').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') checkCode();
  });
});