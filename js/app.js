// URL GeoJSON des départements
const DEPARTMENTS_GEOJSON_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";

// Limite de couverture interne (en km)
const MAX_DISTANCE_KM = 150;

// Données chapitres
let CHAPTERS = [];

// Couleurs des zones
const COLORS = [
  "#e6194b","#3cb44b","#ffe119","#4363d8","#f58231",
  "#911eb4","#46f0f0","#f032e6","#bcf60c","#fabebe",
  "#008080","#e6beff","#9a6324","#fffac8","#800000",
  "#aaffc3","#808000","#ffd8b1","#000075","#808080",
  "#ffffff","#000000","#ff7f50","#6495ed","#ff69b4",
  "#cd5c5c","#ffa500","#40e0d0","#6a5acd","#7fffd4",
  "#deb887","#5f9ea0","#d2691e","#ffb6c1","#20b2aa",
  "#87cefa","#778899","#b0c4de","#00fa9a","#9370db",
  "#3cb371","#7b68ee","#48d1cc","#c71585","#191970",
  "#f4a460","#2e8b57","#fff0f5","#708090","#9acd32"
];

// Carte Leaflet
const map = L.map("map").setView([46.8, 2.5], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// Éléments globaux
let chapterMarkers = [];
let departmentLayers = [];
let selectedChapterIndex = null;
let userMarker = null;

// -------- AUTO-COMPLÉTION PUBLIC --------

let searchSuggestionsData = [];
let searchSuggestTimeout = null;
let lastSearchQuery = "";

async function fetchCitySuggestions(query) {
  if (!query || query.length < 3) {
    renderSearchSuggestions([]);
    return;
  }

  if (query === lastSearchQuery && searchSuggestionsData.length > 0) {
    renderSearchSuggestions(searchSuggestionsData);
    return;
  }

  lastSearchQuery = query;

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    "format=json&addressdetails=1&limit=5&countrycodes=fr&" +
    "q=" +
    encodeURIComponent(query);

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
    const data = await res.json();

    searchSuggestionsData = data.map((item) => {
      return {
        label: item.display_name,
        niceLabel: buildNiceCityLabelPublic(item)
      };
    });

    renderSearchSuggestions(searchSuggestionsData);
  } catch (e) {
    console.warn("Erreur suggestions ville (public) :", e);
    renderSearchSuggestions([]);
  }
}

function buildNiceCityLabelPublic(item) {
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

function renderSearchSuggestions(list) {
  const box = document.getElementById("search-suggestions");
  if (!box) return;

  if (!list || list.length === 0) {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }

  box.innerHTML = "";
  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "search-suggestion-item";
    div.textContent = item.niceLabel || item.label;
    div.dataset.index = index;

    div.addEventListener("click", () => {
      const input = document.getElementById("city-search");
      input.value = item.niceLabel || item.label;

      box.style.display = "none";
      box.innerHTML = "";

      searchCity();
    });

    box.appendChild(div);
  });

  box.style.display = "block";
}

// -------- GÉOCODAGE & DISTANCE --------

function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    city + ", France"
  )}`;
  return fetch(url, { headers: { "Accept-Language": "fr" } })
    .then((res) => res.json())
    .then((results) => {
      if (results && results.length > 0) {
        return {
          lat: parseFloat(results[0].lat),
          lon: parseFloat(results[0].lon)
        };
      }
      return null;
    })
    .catch(() => null);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  function toRad(v) {
    return (v * Math.PI) / 180;
  }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// -------- CHARGEMENT DES CHAPITRES --------

async function initChapters() {
  let i = 0;
  for (const chapter of CHAPTERS) {
    const coords = await geocodeCity(chapter.city);
    if (coords) {
      chapter.lat = coords.lat;
      chapter.lon = coords.lon;

      const color = COLORS[i % COLORS.length];

      const marker = L.circleMarker([chapter.lat, chapter.lon], {
        radius: 7,
        color: "#000000",
        weight: 2,
        fillColor: color,
        fillOpacity: 1
      }).addTo(map);

      marker.bindPopup(`<b>${chapter.name}</b><br>${chapter.city}`);

      chapterMarkers.push(marker);
      i++;
    } else {
      console.warn("Impossible de géocoder la ville:", chapter.city);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

function refreshDepartmentStyles() {
  departmentLayers.forEach(({ layer, chapterIndex, color, distance }) => {
    if (chapterIndex === -1 || distance > MAX_DISTANCE_KM) {
      layer.setStyle({
        color: "#555555",
        weight: 1,
        fillColor: "#202020",
        fillOpacity: 0.15
      });
      return;
    }

    if (selectedChapterIndex === null) {
      layer.setStyle({
        color: color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.25
      });
    } else if (chapterIndex === selectedChapterIndex) {
      layer.setStyle({
        color: color,
        weight: 3,
        fillColor: color,
        fillOpacity: 0.45
      });
    } else {
      layer.setStyle({
        color: color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.12
      });
    }
  });
}

async function loadDepartments() {
  const res = await fetch(DEPARTMENTS_GEOJSON_URL);
  const geojson = await res.json();

  departmentLayers = [];

  L.geoJSON(geojson, {
    style: function () {
      return {
        color: "#d4af37",
        weight: 1.5,
        fillColor: "#ffffff",
        fillOpacity: 0.25
      };
    },
    onEachFeature: function (feature, layer) {
      const center = layer.getBounds().getCenter();

      let bestChapter = null;
      let bestDistance = Infinity;
      let bestIndex = -1;

      CHAPTERS.forEach((ch, idx) => {
        if (typeof ch.lat !== "number" || typeof ch.lon !== "number") return;
        const d = haversineDistance(center.lat, center.lng, ch.lat, ch.lon);
        if (d < bestDistance) {
          bestDistance = d;
          bestChapter = ch;
          bestIndex = idx;
        }
      });

      const deptName =
        feature.properties &&
        (feature.properties.nom || feature.properties.NOM || "Département");

      if (bestChapter && bestIndex >= 0 && bestDistance <= MAX_DISTANCE_KM) {
        const color = COLORS[bestIndex % COLORS.length];

        departmentLayers.push({
          layer,
          chapterIndex: bestIndex,
          color,
          distance: bestDistance
        });

        let popupContent =
          `<b>${deptName}</b><br>` +
          `Chapitre : ${bestChapter.name}<br>` +
          `Ville du chapitre : ${bestChapter.city}<br>` +
          `<small>Vous pouvez prendre contact avec ce chapitre afin d’obtenir des informations ou des conseils.</small>`;

        layer.bindPopup(popupContent);

        layer.on("click", function () {
          selectedChapterIndex = bestIndex;
          refreshDepartmentStyles();
          updateResultCard(bestChapter, deptName, false, bestDistance);
        });
      } else {
        const color = "#555555";
        departmentLayers.push({
          layer,
          chapterIndex: -1,
          color,
          distance: Infinity
        });

        layer.setStyle({
          color: color,
          weight: 1,
          fillColor: "#202020",
          fillOpacity: 0.15
        });

        layer.bindPopup(
          `<b>${deptName}</b><br>` +
            `Aucun chapitre Lag Spirit à proximité.<br>` +
            `<small>Vous pouvez utiliser la recherche en haut de la page pour connaître le chapitre Lag Spirit le plus proche ou utiliser les numéros d’urgence si nécessaire.</small>`
        );
      }
    }
  }).addTo(map);

  refreshDepartmentStyles();
}

// -------- AFFICHAGE DU CHAPITRE --------

function updateResultCard(chapter, searchedCity, notFound, distanceKm) {
  const card = document.getElementById("result-card");

  if (!chapter || notFound) {
    card.innerHTML = `
      <div class="chapter-tag">Chapitre sélectionné</div>
      <h3>Aucun chapitre à proximité</h3>
      <p>
        Aucun chapitre Lag Spirit n’a été identifié à proximité de
        <strong>${searchedCity}</strong>.
      </p>
      <p>
        Vous pouvez utiliser la recherche en haut de la page pour connaître
        le chapitre Lag Spirit le plus proche et obtenir des informations
        ou des conseils.
      </p>
      <div class="chapter-card-mini"></div>
    `;
    const emergencyBox = document.getElementById("emergency-numbers");
    // (les numéros restent dans le bloc dédié)
    return;
  }

  const phone = chapter.contactPhone
    ? `<p><strong>Téléphone :</strong> ${chapter.contactPhone}</p>`
    : "";

  const emailLink = chapter.contactEmail
    ? `<p><strong>Email :</strong> <a href="mailto:${chapter.contactEmail}" target="_blank">${chapter.contactEmail}</a></p>`
    : "";

  const facebookLink = chapter.facebook
    ? `<p><strong>Facebook :</strong> <a href="${chapter.facebook}" target="_blank">Ouvrir la page</a></p>`
    : "";

  const instagramLink = chapter.instagram
    ? `<p><strong>Instagram :</strong> <a href="${chapter.instagram}" target="_blank">Ouvrir le profil</a></p>`
    : "";

  const dist = distanceKm
    ? `<p><strong>Distance estimée :</strong> ~${distanceKm.toFixed(0)} km</p>`
    : "";

  const helpInfo = chapter.helpInfo
    ? `<div class="help-highlight">${chapter.helpInfo}</div>`
    : "";

  card.innerHTML = `
    <div class="chapter-tag">Chapitre sélectionné</div>
    <h3>${chapter.name}</h3>

    <p><strong>Ville du chapitre :</strong> ${chapter.city}</p>
    <p><strong>Ville / zone recherchée :</strong> ${searchedCity}</p>
    ${dist}

    ${phone}
    ${emailLink}
    ${facebookLink}
    ${instagramLink}

    ${helpInfo}
  `;
}

// -------- LISTE DES CHAPITRES --------

function renderChaptersList() {
  const container = document.getElementById("chapters-list");
  if (!container) return;
  container.innerHTML = "";

  CHAPTERS.forEach((ch, idx) => {
    const color = COLORS[idx % COLORS.length];
    const btn = document.createElement("button");
    btn.className = "chapter-list-item";
    btn.dataset.idx = idx;

    btn.innerHTML = `
      <div class="chapter-list-main">
        <span class="chapter-dot" style="background:${color}"></span>
        <span class="chapter-name">${ch.name}</span>
      </div>
    `;

    btn.addEventListener("click", () => {
      selectedChapterIndex = idx;
      refreshDepartmentStyles();

      if (typeof ch.lat === "number" && typeof ch.lon === "number") {
        map.setView([ch.lat, ch.lon], 7);
      }
      updateResultCard(ch, ch.city, false, null);
    });

    container.appendChild(btn);
  });
}

// -------- RECHERCHE PAR VILLE --------

async function searchCity() {
  const input = document.getElementById("city-search");
  const query = input.value.trim();
  if (!query) return;

  const coords = await geocodeCity(query);
  if (!coords) {
    updateResultCard(null, query, true);
    return;
  }

  // Marqueur utilisateur
  if (userMarker) {
    userMarker.remove();
  }
  userMarker = L.circleMarker([coords.lat, coords.lon], {
    radius: 7,
    color: "#000000",
    weight: 3,
    fillColor: "#ffffff",
    fillOpacity: 1
  }).addTo(map);

  let bestChapter = null;
  let bestDistance = Infinity;
  let bestIndex = -1;

  CHAPTERS.forEach((chapter, idx) => {
    if (typeof chapter.lat !== "number" || typeof chapter.lon !== "number")
      return;
    const d = haversineDistance(coords.lat, coords.lon, chapter.lat, chapter.lon);
    if (d < bestDistance) {
      bestDistance = d;
      bestChapter = chapter;
      bestIndex = idx;
    }
  });

  map.setView([coords.lat, coords.lon], 7);

  if (bestChapter) {
    selectedChapterIndex = bestIndex;
    refreshDepartmentStyles();
    updateResultCard(bestChapter, query, bestDistance > MAX_DISTANCE_KM, bestDistance);
  } else {
    updateResultCard(null, query, true);
  }
}

// -------- LOCALISATION --------

function locateUser() {
  if (!navigator.geolocation) {
    alert("La localisation n’est pas disponible sur cet appareil.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      if (userMarker) {
        userMarker.remove();
      }
      userMarker = L.circleMarker([latitude, longitude], {
        radius: 7,
        color: "#000000",
        weight: 3,
        fillColor: "#ffffff",
        fillOpacity: 1
      }).addTo(map);

      map.setView([latitude, longitude], 8);

      let bestChapter = null;
      let bestDistance = Infinity;
      let bestIndex = -1;

      CHAPTERS.forEach((chapter, idx) => {
        if (typeof chapter.lat !== "number" || typeof chapter.lon !== "number")
          return;
        const d = haversineDistance(latitude, longitude, chapter.lat, chapter.lon);
        if (d < bestDistance) {
          bestDistance = d;
          bestChapter = chapter;
          bestIndex = idx;
        }
      });

      if (bestChapter) {
        selectedChapterIndex = bestIndex;
        refreshDepartmentStyles();
        updateResultCard(
          bestChapter,
          "Ta position",
          bestDistance > MAX_DISTANCE_KM,
          bestDistance
        );
      } else {
        updateResultCard(null, "Ta position", true);
      }
    },
    () => {
      alert(
        "Impossible de récupérer ta position. Vérifie les autorisations de localisation."
      );
    }
  );
}

// -------- CHARGEMENT DES CHAPITRES --------

async function loadChapters() {
  try {
    const res = await fetch("chapters.json");
    CHAPTERS = await res.json();

    await initChapters();
    renderChaptersList();
    await loadDepartments();
  } catch (e) {
    console.error("Erreur de chargement de chapters.json", e);
    alert("Impossible de charger la liste des chapitres (chapters.json).");
  }
}

// -------- EVENTS --------

document.addEventListener("DOMContentLoaded", () => {
  loadChapters();

  const searchInput = document.getElementById("city-search");
  const suggestionsBox = document.getElementById("search-suggestions");

  document.getElementById("search-btn").addEventListener("click", () => {
    if (suggestionsBox) {
      suggestionsBox.style.display = "none";
      suggestionsBox.innerHTML = "";
    }
    searchCity();
  });

  document.getElementById("locate-btn").addEventListener("click", () => {
    if (suggestionsBox) {
      suggestionsBox.style.display = "none";
      suggestionsBox.innerHTML = "";
    }
    locateUser();
  });

  if (searchInput && suggestionsBox) {
    searchInput.addEventListener("input", () => {
      const value = searchInput.value.trim();

      if (searchSuggestTimeout) {
        clearTimeout(searchSuggestTimeout);
        searchSuggestTimeout = null;
      }

      if (value.length < 3) {
        suggestionsBox.style.display = "none";
        suggestionsBox.innerHTML = "";
        return;
      }

      searchSuggestTimeout = setTimeout(() => {
        fetchCitySuggestions(value);
      }, 350);
    });

    searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        suggestionsBox.style.display = "none";
        suggestionsBox.innerHTML = "";
        searchCity();
      }
    });

    document.addEventListener("click", (e) => {
      const inSearchArea = e.target.closest(".search-area");
      if (!inSearchArea) {
        suggestionsBox.style.display = "none";
        suggestionsBox.innerHTML = "";
      }
    });
  }

  // Toggle numéros d'urgence
  const emergencyToggle = document.getElementById("emergency-toggle");
  const emergencyBox = document.getElementById("emergency-numbers");

  if (emergencyToggle && emergencyBox) {
    emergencyBox.style.display = "none";
    emergencyToggle.addEventListener("click", () => {
      const isVisible = emergencyBox.style.display === "block";
      emergencyBox.style.display = isVisible ? "none" : "block";
    });
  }
});
