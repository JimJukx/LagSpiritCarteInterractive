let chapters = [];
let selectedIndex = -1;

let citySuggestionsData = [];
let citySuggestTimeout = null;
let lastCityQuery = "";

// Chargement du chapters.json existant
async function loadChapters() {
  try {
    const res = await fetch("chapters.json");
    chapters = await res.json();
    if (!Array.isArray(chapters)) chapters = [];
    renderTable();
    if (chapters.length > 0) {
      selectChapter(0);
    } else {
      clearForm();
      updateJsonOutput();
    }
  } catch (e) {
    alert("Impossible de charger chapters.json");
    console.error(e);
  }
}

// Affichage du tableau des chapitres
function renderTable() {
  const tbody = document.querySelector("#chapters-table tbody");
  tbody.innerHTML = "";

  chapters.forEach((ch, idx) => {
    const tr = document.createElement("tr");
    if (idx === selectedIndex) tr.classList.add("selected");
    const mode = ch.coverageMode || "distance";
    const maxDist =
      typeof ch.maxDistanceKm === "number" ? ch.maxDistanceKm : "";

    tr.innerHTML = `
      <td>${ch.name || ""}</td>
      <td>${ch.city || ""}</td>
      <td>${mode}</td>
      <td>${maxDist}</td>
    `;

    tr.addEventListener("click", () => {
      selectChapter(idx);
    });

    tbody.appendChild(tr);
  });
}

// Quand on clique sur un chapitre dans la liste
function selectChapter(idx) {
  selectedIndex = idx;
  renderTable();
  const ch = chapters[idx];
  if (!ch) return;

  document.getElementById("field-id").value = ch.id || "";
  document.getElementById("field-name").value = ch.name || "";
  document.getElementById("field-city").value = ch.city || "";
  document.getElementById("field-mode").value = ch.coverageMode || "distance";
  document.getElementById("field-maxdist").value =
    typeof ch.maxDistanceKm === "number" ? ch.maxDistanceKm : "";
  document.getElementById("field-depts").value = Array.isArray(ch.departments)
    ? ch.departments.join(", ")
    : "";
  document.getElementById("field-email").value = ch.contactEmail || "";
  document.getElementById("field-phone").value = ch.contactPhone || "";
  document.getElementById("field-facebook").value = ch.facebook || "";
  document.getElementById("field-instagram").value = ch.instagram || "";
  document.getElementById("field-help").value = ch.helpInfo || "";

  updateJsonOutput();
}

// Réinitialiser le formulaire
function clearForm() {
  selectedIndex = -1;
  document.getElementById("field-id").value = "";
  document.getElementById("field-name").value = "";
  document.getElementById("field-city").value = "";
  document.getElementById("field-mode").value = "distance";
  document.getElementById("field-maxdist").value = "";
  document.getElementById("field-depts").value = "";
  document.getElementById("field-email").value = "";
  document.getElementById("field-phone").value = "";
  document.getElementById("field-facebook").value = "";
  document.getElementById("field-instagram").value = "";
  document.getElementById("field-help").value = "";
  renderTable();
  updateJsonOutput();
}

// Récupérer les données du formulaire sous forme d'objet chapitre
function formToChapter() {
  const idInput = document.getElementById("field-id").value.trim();
  const name = document.getElementById("field-name").value.trim();
  const city = document.getElementById("field-city").value.trim();
  const coverageMode = document.getElementById("field-mode").value;
  const maxDistVal = document.getElementById("field-maxdist").value;
  const deptsRaw = document.getElementById("field-depts").value;
  const contactEmail = document.getElementById("field-email").value.trim();
  const contactPhone = document.getElementById("field-phone").value.trim();
  const facebook = document.getElementById("field-facebook").value.trim();
  const instagram = document.getElementById("field-instagram").value.trim();
  const helpInfo = document.getElementById("field-help").value.trim();

  const maxDistanceKm = maxDistVal ? Number(maxDistVal) : undefined;

  const departments = deptsRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let id = idInput;
  if (!id) {
    id = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  return {
    id,
    name,
    city,
    coverageMode,
    maxDistanceKm,
    departments,
    contactEmail,
    contactPhone,
    facebook,
    instagram,
    helpInfo
  };
}

// Met à jour la zone JSON à partir du tableau chapters
function updateJsonOutput() {
  const cleaned = chapters.map((ch) => {
    const obj = {
      id: ch.id || "",
      name: ch.name || "",
      city: ch.city || "",
      coverageMode: ch.coverageMode || "distance",
      maxDistanceKm:
        typeof ch.maxDistanceKm === "number" ? ch.maxDistanceKm : undefined,
      departments: Array.isArray(ch.departments) ? ch.departments : [],
      contactEmail: ch.contactEmail || "",
      contactPhone: ch.contactPhone || "",
      facebook: ch.facebook || "",
      instagram: ch.instagram || "",
      helpInfo: ch.helpInfo || ""
    };

    if (obj.maxDistanceKm === undefined) delete obj.maxDistanceKm;
    return obj;
  });

  document.getElementById("json-output").value = JSON.stringify(
    cleaned,
    null,
    2
  );
}

// Télécharger le JSON généré
function downloadJson() {
  const blob = new Blob([document.getElementById("json-output").value], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chapters.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------- Auto-complétion de la ville dans l'admin (version fluide) --------

async function fetchCitySuggestionsAdmin(query) {
  if (!query || query.length < 3) {
    renderCitySuggestionsAdmin([]);
    return;
  }

  // Si la requête est identique à la dernière, on ne relance pas
  if (query === lastCityQuery && citySuggestionsData.length > 0) {
    renderCitySuggestionsAdmin(citySuggestionsData);
    return;
  }

  lastCityQuery = query;

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    "format=json&addressdetails=1&limit=5&countrycodes=fr&" +
    "q=" +
    encodeURIComponent(query);

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
    const data = await res.json();

    citySuggestionsData = data.map((item) => {
      const display = item.display_name || "";
      return {
        label: display,
        cityLabel: buildNiceCityLabel(item)
      };
    });

    renderCitySuggestionsAdmin(citySuggestionsData);
  } catch (e) {
    console.warn("Erreur suggestions ville admin :", e);
    renderCitySuggestionsAdmin([]);
  }
}

function buildNiceCityLabel(item) {
  const addr = item.address || {};
  const city =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.municipality ||
    addr.county ||
    "";
  const postcode = addr.postcode || "";
  const state = addr.state || "";
  const country = addr.country || "";

  let parts = [];
  if (city) parts.push(city);
  if (postcode) parts.push(postcode);
  else if (state) parts.push(state);
  else if (country) parts.push(country);

  return parts.join(" – ");
}

function renderCitySuggestionsAdmin(list) {
  const box = document.getElementById("city-suggestions");
  if (!box) return;

  if (!list || list.length === 0) {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }

  box.innerHTML = "";
  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "city-suggestion-item";
    div.textContent = item.cityLabel || item.label;
    div.dataset.index = index;

    div.addEventListener("click", () => {
      const input = document.getElementById("field-city");
      input.value = item.cityLabel || item.label;
      box.style.display = "none";
      box.innerHTML = "";
    });

    box.appendChild(div);
  });

  box.style.display = "block";
}

// ---- Events ----

document.addEventListener("DOMContentLoaded", () => {
  loadChapters();

  const form = document.getElementById("chapter-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ch = formToChapter();

    if (selectedIndex === -1) {
      chapters.push(ch);
      selectedIndex = chapters.length - 1;
    } else {
      chapters[selectedIndex] = ch;
    }
    renderTable();
    selectChapter(selectedIndex);
    alert("Chapitre mis à jour dans la liste (pense à télécharger chapters.json).");
  });

  document.getElementById("reset-form-btn").addEventListener("click", () => {
    if (selectedIndex >= 0 && chapters[selectedIndex]) {
      selectChapter(selectedIndex);
    } else {
      clearForm();
    }
  });

  document.getElementById("new-chapter-btn").addEventListener("click", () => {
    clearForm();
    selectedIndex = -1;
  });

  document
    .getElementById("duplicate-chapter-btn")
    .addEventListener("click", () => {
      if (selectedIndex < 0 || !chapters[selectedIndex]) return;
      const copy = { ...chapters[selectedIndex] };
      copy.id = "";
      copy.name = copy.name + " (copie)";
      chapters.push(copy);
      selectedIndex = chapters.length - 1;
      renderTable();
      selectChapter(selectedIndex);
    });

  document
    .getElementById("delete-chapter-btn")
    .addEventListener("click", () => {
      if (selectedIndex < 0 || !chapters[selectedIndex]) return;
      if (!confirm("Supprimer ce chapitre ?")) return;
      chapters.splice(selectedIndex, 1);
      selectedIndex = Math.min(selectedIndex, chapters.length - 1);
      renderTable();
      if (selectedIndex >= 0) selectChapter(selectedIndex);
      else clearForm();
    });

  document
    .getElementById("download-json-btn")
    .addEventListener("click", downloadJson);

  // Auto-complétion fluide sur le champ "Ville"
  const cityInput = document.getElementById("field-city");
  const cityBox = document.getElementById("city-suggestions");

  if (cityInput && cityBox) {
    cityInput.addEventListener("input", (e) => {
      const value = cityInput.value.trim();

      // on annule la requête précédente si on continue à taper
      if (citySuggestTimeout) {
        clearTimeout(citySuggestTimeout);
        citySuggestTimeout = null;
      }

      if (value.length < 3) {
        cityBox.style.display = "none";
        cityBox.innerHTML = "";
        return;
      }

      // temporisation de 350ms après la dernière frappe
      citySuggestTimeout = setTimeout(() => {
        fetchCitySuggestionsAdmin(value);
      }, 350);
    });

    // Fermer la liste si on clique ailleurs
    document.addEventListener("click", (e) => {
      const wrapper = cityInput.parentElement;
      if (!wrapper.contains(e.target)) {
        cityBox.style.display = "none";
        cityBox.innerHTML = "";
      }
    });
  }
});