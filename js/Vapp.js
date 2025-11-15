//----------------------------------------
// CONFIG
//----------------------------------------

const DEPARTMENTS_GEOJSON_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";

// Limite “zone couverte” en km
const MAX_DISTANCE_KM = 150;

// URL de ton Worker Cloudflare (proxy OpenRouteService)
const ORS_WORKER_URL = "https://lagspirit-ors.jimmy-cattiau.workers.dev";

let CHAPTERS = [];

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

//----------------------------------------
// MAP INIT
//----------------------------------------

const map = L.map("map").setView([46.8, 2.5], 6);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

let departmentLayers = [];
let selectedChapterIndex = null;
// marqueur de la ville recherchée
let searchMarker = null;

//----------------------------------------
// GEO UTILS
//----------------------------------------

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

// Temps de trajet approx. en minutes via Worker + ORS
async function getTravelTimeMinutes(latFrom, lonFrom, latTo, lonTo) {
  if (!ORS_WORKER_URL) return null;

  try {
    const body = {
      coordinates: [
        [lonFrom, latFrom],
        [lonTo, latTo]
      ]
    };

    const res = await fetch(ORS_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.warn("Worker ORS status:", res.status);
      return null;
    }

    const data = await res.json();
    if (
      !data ||
      !data.routes ||
      !data.routes[0] ||
      !data.routes[0].summary ||
      typeof data.routes[0].summary.duration !== "number"
    ) {
      return null;
    }

    const seconds = data.routes[0].summary.duration;
    return seconds / 60;
  } catch (e) {
    console.warn("Erreur ORS via worker:", e);
    return null;
  }
}

//----------------------------------------
// INIT CHAPTERS
//----------------------------------------

async function initChapters() {
  let i = 0;
  for (const chapter of CHAPTERS) {
    const coords = await geocodeCity(chapter.city);
    if (coords) {
      chapter.lat = coords.lat;
      chapter.lon = coords.lon;

      const color = COLORS[i % COLORS.length];

      L.circleMarker([chapter.lat, chapter.lon], {
        radius: 7,
        color: "#000000",
        weight: 2,
        fillColor: color,
        fillOpacity: 1
      })
        .bindPopup(`<b>${chapter.name}</b><br>${chapter.city}`)
        .addTo(map);

      i++;
    } else {
      console.warn("Impossible de géocoder :", chapter.city);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

//----------------------------------------
// DÉPARTEMENTS
//----------------------------------------

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
    style: () => ({
      color: "#d4af37",
      weight: 1.5,
      fillColor: "#ffffff",
      fillOpacity: 0.25
    }),
    onEachFeature: (feature, layer) => {
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

        const popupContent =
          `<b>${deptName}</b><br>` +
          `Chapitre : ${bestChapter.name}<br>` +
          `Ville du chapitre : ${bestChapter.city}<br>` +
          `<small>Vous pouvez prendre contact avec ce chapitre afin d’obtenir des informations ou des conseils.</small>`;

        layer.bindPopup(popupContent);

        layer.on("click", () => {
          selectedChapterIndex = bestIndex;
          refreshDepartmentStyles();
          updateResultCard(bestChapter, deptName, false, bestDistance, null);
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
            `<small>Vous pouvez utiliser la recherche en haut de la page pour connaître le chapitre Lag Spirit le plus proche.</small><br><br>` +
            `<small><strong>Numéros d’urgence :</strong><br>` +
            `17 – Police / Gendarmerie<br>` +
            `15 – SAMU (urgence médicale)<br>` +
            `3020 – Harcèlement scolaire<br>` +
            `3018 – Cyberharcèlement et violences numériques<br>` +
            `119 – Enfance en danger</small>`
        );
      }
    }
  }).addTo(map);

  refreshDepartmentStyles();
}

//----------------------------------------
// FICHE CHAPITRE (SIDEBAR)
//----------------------------------------
// status :
//  false -> chapitre trouvé dans la zone
//  "far" -> chapitre trouvé mais hors zone
//  true  -> aucun chapitre / erreur

function updateResultCard(chapter, searchedCity, status, distanceKm, travelMinutes) {
  const card = document.getElementById("result-card");

  // aucun chapitre
  if (!chapter && status) {
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
      <div class="help-highlight">
        <strong>Numéros d’urgence :</strong><br>
        17 – Police / Gendarmerie<br>
        15 – SAMU (urgence médicale)<br>
        3020 – Harcèlement scolaire<br>
        3018 – Cyberharcèlement et violences numériques<br>
        119 – Enfance en danger
      </div>
    `;
    return;
  }

  if (!chapter) {
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
      <div class="help-highlight">
        <strong>Numéros d’urgence :</strong><br>
        17 – Police / Gendarmerie<br>
        15 – SAMU (urgence médicale)<br>
        3020 – Harcèlement scolaire<br>
        3018 – Cyberharcèlement et violences numériques<br>
        119 – Enfance en danger
      </div>
    `;
    return;
  }

  let distBlock = "";
  if (distanceKm) {
    distBlock = `<p><strong>Distance estimée :</strong> ~${distanceKm.toFixed(
      0
    )} km`;
    if (travelMinutes) {
      const hours = Math.floor(travelMinutes / 60);
      const minutes = Math.round(travelMinutes % 60);
      const timeLabel =
        hours > 0
          ? `${hours}h${minutes.toString().padStart(2, "0")}`
          : `${minutes} min`;
      distBlock += ` (~${timeLabel})`;
    }
    distBlock += `</p>`;
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

  const helpInfo = chapter.helpInfo
    ? `<div class="help-highlight">${chapter.helpInfo}</div>`
    : "";

  if (status === "far" && distanceKm) {
    card.innerHTML = `
      <div class="chapter-tag">Chapitre sélectionné</div>
      <h3>${chapter.name}</h3>

      <p><strong>Ville du chapitre :</strong> ${chapter.city}</p>
      <p><strong>Ville / zone recherchée :</strong> ${searchedCity}</p>
      ${distBlock}

      <p>
        Ce chapitre est actuellement le plus proche de la zone recherchée,
        mais la distance peut rendre un déplacement difficile.
        Tu peux néanmoins les contacter pour être écouté(e), obtenir des conseils
        et être orienté(e).
      </p>

      ${phone}
      ${emailLink}
      ${facebookLink}
      ${instagramLink}

      ${helpInfo}

      <div class="help-highlight">
        <strong>Numéros d’urgence :</strong><br>
        17 – Police / Gendarmerie<br>
        15 – SAMU (urgence médicale)<br>
        3020 – Harcèlement scolaire<br>
        3018 – Cyberharcèlement et violences numériques<br>
        119 – Enfance en danger
      </div>
    `;
    return;
  }

  card.innerHTML = `
    <div class="chapter-tag">Chapitre sélectionné</div>
    <h3>${chapter.name}</h3>

    <p><strong>Ville du chapitre :</strong> ${chapter.city}</p>
    <p><strong>Ville / zone recherchée :</strong> ${searchedCity}</p>
    ${distBlock}

    ${phone}
    ${emailLink}
    ${facebookLink}
    ${instagramLink}

    ${helpInfo}
  `;
}

//----------------------------------------
// LISTE DES CHAPITRES
//----------------------------------------

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
      updateResultCard(ch, ch.city, false, null, null);
    });

    container.appendChild(btn);
  });
}

//----------------------------------------
// RECHERCHE + MARQUEUR DE VILLE
//----------------------------------------

async function searchCity() {
  const input = document.getElementById("city-search");
  const query = input.value.trim();
  if (!query) return;

  const coords = await geocodeCity(query);
  if (!coords) {
    updateResultCard(null, query, true, null, null);
    return;
  }

  // 👉 Marqueur de la ville recherchée
  if (searchMarker) {
    map.removeLayer(searchMarker);
  }
  searchMarker = L.circleMarker([coords.lat, coords.lon], {
    radius: 7,
    color: "#d4af37",      // contour or
    weight: 2,
    fillColor: "#ffffff",  // centre blanc
    fillOpacity: 1
  }).addTo(map);

  map.setView([coords.lat, coords.lon], 7);

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

  if (bestChapter) {
    const outOfRange = bestDistance > MAX_DISTANCE_KM;
    selectedChapterIndex = bestIndex;
    refreshDepartmentStyles();

    let travelMinutes = null;
    if (typeof bestChapter.lat === "number" && typeof bestChapter.lon === "number") {
      travelMinutes = await getTravelTimeMinutes(
        bestChapter.lat,
        bestChapter.lon,
        coords.lat,
        coords.lon
      );
    }

    if (outOfRange) {
      updateResultCard(bestChapter, query, "far", bestDistance, travelMinutes);
    } else {
      updateResultCard(bestChapter, query, false, bestDistance, travelMinutes);
    }
  } else {
    updateResultCard(null, query, true, null, null);
  }
}

//----------------------------------------
// EVENTS
//----------------------------------------

document.getElementById("search-btn").addEventListener("click", searchCity);
document.getElementById("city-search").addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchCity();
});

//----------------------------------------
// CHARGEMENT GLOBAL
//----------------------------------------

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

loadChapters();
