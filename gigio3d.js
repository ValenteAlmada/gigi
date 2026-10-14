'use strict';
/* Relevo e sol (especificação GIGIO 3d): picos, hora Madeira, sol/sombra, postos, antenas, IPMA.
   Adaptado a GitHub Pages estático: DEM = AWS Terrarium; places = data/places.json.
   Não usa as palavras «seguro» nem «dá». Estilo visual = Gigi. */
(function () {
  if (!window.maplibregl || !window.map) return;

  const RAD = Math.PI / 180;
  const DAY_MS = 86400000;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const OBLIQUITY = RAD * 23.4397;
  const R_EARTH = 6371000;
  const DEM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
  const IPMA_URL = 'https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json';
  const IPMA_ZONES = { MCN: 'Costa Norte', MCS: 'Costa Sul', MRM: 'Regiões montanhosas', MPS: 'Porto Santo' };
  const OPS = ['MEO', 'NOS', 'Vodafone', 'DIGI'];
  const SHADOW_DISTS = [200, 450, 800, 1200, 1800, 2600];

  const PEAKS = [
    { id: 'ruivo', name: 'Pico Ruivo', elev: 1862, lat: 32.758733333333, lon: -16.942255555556, source: 'Wikidata Q473169' },
    { id: 'torres', name: 'Pico das Torres', elev: 1853, lat: 32.750469444444, lon: -16.938261111111, source: 'Wikidata Q775217' },
    { id: 'areeiro', name: 'Pico do Areeiro', note: 'Na Wikidata o nome está grafado Pico do Arieiro.', elev: 1818, lat: 32.735555555556, lon: -16.928888888889, source: 'Wikidata Q1192102' },
    { id: 'paul', name: 'Pico Ruivo do Paul', elev: 1639, lat: 32.77777778, lon: -17.07916667, source: 'Wikidata Q17591066' },
    { id: 'facho', name: 'Pico do Facho', elev: 516, lat: 33.08439, lon: -16.32324, source: 'Wikipédia, Pico do Facho (Porto Santo)' },
    { id: 'castelo', name: 'Pico do Castelo', elev: null, lat: 33.0778839, lon: -16.3342981, source: 'OpenStreetMap, miradouro' },
  ];

  function peakLabel(name) {
    return name.replace(/^Pico\s+/i, '').replace(/^do\s+/i, '').replace(/^das\s+/i, '');
  }

  function madeiraParts(date = new Date()) {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Atlantic/Madeira', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    const bag = {};
    for (const p of fmt.formatToParts(date)) if (p.type !== 'literal') bag[p.type] = p.value;
    return { y: +bag.year, m: +bag.month, d: +bag.day, h: +bag.hour, min: +bag.minute };
  }

  function madeiraToUtc(y, mo, d, h, min) {
    let utc = Date.UTC(y, mo - 1, d, h, min);
    for (let i = 0; i < 4; i++) {
      const parts = madeiraParts(new Date(utc));
      const shown = Date.UTC(parts.y, parts.m - 1, parts.d, parts.h, parts.min);
      const want = Date.UTC(y, mo - 1, d, h, min);
      const delta = want - shown;
      if (delta === 0) break;
      utc += delta;
    }
    return new Date(utc);
  }

  function hhmm(h, min) {
    return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
  }

  function toDays(date) {
    return date.valueOf() / DAY_MS - 0.5 + J1970 - J2000;
  }
  function rightAscension(eclipticLon) {
    return Math.atan2(Math.sin(eclipticLon) * Math.cos(OBLIQUITY), Math.cos(eclipticLon));
  }
  function declination(eclipticLon) {
    return Math.asin(Math.sin(OBLIQUITY) * Math.sin(eclipticLon));
  }

  function sunPosition(utc, latDeg, lonDeg) {
    const days = toDays(utc);
    const anomaly = RAD * (357.5291 + 0.98560028 * days);
    const center = RAD * (1.9148 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly) + 0.0003 * Math.sin(3 * anomaly));
    const ecliptic = anomaly + center + RAD * 102.9372 + Math.PI;
    const dec = declination(ecliptic);
    const ra = rightAscension(ecliptic);
    const hourAngle = RAD * (280.16 + 360.9856235 * days) - RAD * -lonDeg - ra;
    const lat = latDeg * RAD;
    const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle));
    const azFromSouth = Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
    );
    const azimuthDeg = (((azFromSouth / RAD + 180) % 360) + 360) % 360;
    return { altitudeDeg: alt / RAD, azimuthDeg, aboveHorizon: alt > 0 };
  }

  function destination(lat, lon, bearingDeg, distM) {
    const delta = distM / R_EARTH;
    const theta = (bearingDeg * Math.PI) / 180;
    const phi1 = (lat * Math.PI) / 180;
    const lambda1 = (lon * Math.PI) / 180;
    const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta));
    const lambda2 = lambda1 + Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2),
    );
    return { lat: (phi2 * 180) / Math.PI, lon: (lambda2 * 180) / Math.PI };
  }

  function haversine(aLat, aLon, bLat, bLon) {
    const p1 = (aLat * Math.PI) / 180, p2 = (bLat * Math.PI) / 180;
    const dp = ((bLat - aLat) * Math.PI) / 180, dl = ((bLon - aLon) * Math.PI) / 180;
    const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
    return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  const elevCache = new Map();
  function tileOf(lat, lon, z) {
    const n = 2 ** z;
    const xf = ((lon + 180) / 360) * n;
    const latr = (lat * Math.PI) / 180;
    const yf = ((1 - Math.log(Math.tan(latr) + 1 / Math.cos(latr)) / Math.PI) / 2) * n;
    const x = Math.floor(xf), y = Math.floor(yf);
    const i = Math.min(255, Math.max(0, Math.floor((xf - x) * 256)));
    const j = Math.min(255, Math.max(0, Math.floor((yf - y) * 256)));
    return { x, y, i, j };
  }
  async function tile(z, x, y) {
    const key = z + '/' + x + '/' + y;
    const hit = elevCache.get(key);
    if (hit === 'miss') return null;
    if (hit) return hit;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = DEM.replace('{z}', z).replace('{x}', x).replace('{y}', y);
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height);
      elevCache.set(key, data);
      return data;
    } catch {
      elevCache.set(key, 'miss');
      return null;
    }
  }
  function sample(data, i, j) {
    const idx = (j * data.width + i) * 4;
    return data.data[idx] * 256 + data.data[idx + 1] + data.data[idx + 2] / 256 - 32768;
  }
  async function elevation(lat, lon) {
    for (const z of [12, 11, 10]) {
      const { x, y, i, j } = tileOf(lat, lon, z);
      const data = await tile(z, x, y);
      if (!data) continue;
      const value = sample(data, i, j);
      if (Number.isFinite(value) && value > -500 && value < 9000) return value;
    }
    return null;
  }

  let places = { fuels: [], antennas: [], error: 'a carregar', readAt: null };
  let point = { lat: PEAKS[2].lat, lon: PEAKS[2].lon };
  let peakId = 'areeiro';
  let hour = 12, minute = 0;
  let showPostos = true, showAntenas = false;
  const peakMarks = [];

  function panelHTML() {
    const pks = PEAKS.map((p) => {
      const elev = p.elev == null ? 'altitude por confirmar' : p.elev + ' m';
      return `<button type="button" class="pk" data-pk="${p.id}" aria-pressed="${p.id === peakId}">${peakLabel(p.name)} <small>${elev}</small></button>`;
    }).join('');
    return `<summary><h2>Relevo e sol</h2></summary>
<p class="note">Picos, sol à hora, postos e uma estimativa de rede. Não decide saídas.</p>
<div class="pkrow" role="group" aria-label="Picos">${pks}</div>
<label class="rlab">Hora (Atlantic/Madeira)
<input type="range" id="ghour" min="0" max="23" step="1" value="${hour}" aria-valuemin="0" aria-valuemax="23">
<span id="ghourv">${hhmm(hour, minute)}</span></label>
<div class="pkrow" role="group" aria-label="Minutos">
<button type="button" id="g00" aria-pressed="${minute === 0}">:00</button>
<button type="button" id="g30" aria-pressed="${minute === 30}">:30</button>
<button type="button" id="gnow">Agora</button>
</div>
<div id="gtexts" class="gtexts" aria-live="polite"><p>A carregar relevo…</p></div>
<fieldset><legend>Camadas</legend>
<label><input type="checkbox" id="gpostos" ${showPostos ? 'checked' : ''}> Postos</label>
<label><input type="checkbox" id="gantenas" ${showAntenas ? 'checked' : ''}> Antenas</label>
</fieldset>`;
  }

  function ensurePanel() {
    let d = document.getElementById('relevo');
    if (!d) {
      const ref = document.getElementById('layers') || document.getElementById('hudpanel');
      if (!ref) return null;
      d = document.createElement('details');
      d.id = 'relevo';
      d.innerHTML = panelHTML();
      (ref.id === 'layers' ? ref : null) ? ref.after(d) : ref.appendChild(d);
      try {
        const st = JSON.parse(localStorage.getItem('sbsec') || '{}');
        if ('relevo' in st) d.open = !!st.relevo;
      } catch (e) {}
      bindPanel(d);
    }
    return d;
  }

  function bindPanel(d) {
    d.addEventListener('click', (e) => {
      const b = e.target.closest('[data-pk]');
      if (b) { flyPeak(b.dataset.pk); return; }
      if (e.target.id === 'g00') { minute = 0; syncTime(); refresh(); }
      if (e.target.id === 'g30') { minute = 30; syncTime(); refresh(); }
      if (e.target.id === 'gnow') { agora(); }
    });
    d.addEventListener('input', (e) => {
      if (e.target.id === 'ghour') { hour = +e.target.value; syncTime(); refresh(); }
    });
    d.addEventListener('change', (e) => {
      if (e.target.id === 'gpostos') { showPostos = e.target.checked; setPlacesVis(); }
      if (e.target.id === 'gantenas') { showAntenas = e.target.checked; setPlacesVis(); }
    });
  }

  function syncTime() {
    const v = document.getElementById('ghourv');
    if (v) v.textContent = hhmm(hour, minute);
    const r = document.getElementById('ghour');
    if (r) r.value = hour;
    const a = document.getElementById('g00'), b = document.getElementById('g30');
    if (a) a.setAttribute('aria-pressed', String(minute === 0));
    if (b) b.setAttribute('aria-pressed', String(minute === 30));
    dPk();
  }

  function dPk() {
    document.querySelectorAll('[data-pk]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pk === peakId)));
  }

  function agora() {
    const p = madeiraParts();
    hour = p.h;
    minute = p.min < 30 ? 0 : 30;
    syncTime();
    refresh();
  }

  function flyPeak(id) {
    const p = PEAKS.find((x) => x.id === id);
    if (!p) return;
    peakId = id;
    point = { lat: p.lat, lon: p.lon };
    dPk();
    map.flyTo({ center: [p.lon, p.lat], zoom: 13, pitch: 66, bearing: -24, essential: true });
    refresh();
  }

  function km1(m) {
    return (m / 1000).toFixed(1).replace('.', ',');
  }

  async function shadowText(sun, elev0) {
    if (elev0 == null) return 'Não há relevo neste ponto para estimar a sombra da encosta.';
    if (!sun.aboveHorizon) return 'Sem sol neste ponto a esta hora. A linha mostra a direção, não uma sombra medida.';
    const tanA = Math.tan(sun.altitudeDeg * RAD);
    for (const dist of SHADOW_DISTS) {
      const p = destination(point.lat, point.lon, sun.azimuthDeg, dist);
      const e = await elevation(p.lat, p.lon);
      if (e == null) continue;
      if (e > elev0 + dist * tanA + 12) {
        return `Estimativa: a encosta tapa o sol, a cerca de ${dist} m na direção do sol. O relevo inclui copas e casas (modelo de superfície, ~30 m).`;
      }
    }
    return 'Estimativa: o sol chega a este ponto. O relevo é um modelo de superfície, não uma medição no local.';
  }

  function fuelText() {
    if (places.error && !places.fuels.length) return 'OpenStreetMap está indisponível nesta leitura (postos).';
    if (!places.fuels.length) return 'Sem postos de combustível no OpenStreetMap nesta caixa.';
    let best = null, bestD = Infinity;
    for (const f of places.fuels) {
      const d = haversine(point.lat, point.lon, f.lat, f.lon);
      if (d < bestD) { bestD = d; best = f; }
    }
    const marca = best.brand ? `, ${best.brand}` : '';
    return `${best.name}${marca}, a ${km1(bestD)} km em linha reta. São postos do OpenStreetMap, não uma rede de gás.`;
  }

  async function networkTexts(elev0) {
    const lines = [];
    for (const op of OPS) {
      const cands = places.antennas
        .filter((a) => a.operators.includes(op))
        .map((a) => ({ a, d: haversine(point.lat, point.lon, a.lat, a.lon) }))
        .filter((x) => x.d < 15000)
        .sort((a, b) => a.d - b.d)
        .slice(0, 4);
      if (!cands.length) { lines.push(`${op}: sem antena no OpenStreetMap em 15 km.`); continue; }
      if (elev0 == null) { lines.push(`${op}: há antena, sem relevo para a linha de vista.`); continue; }
      let free = null, blocked = null;
      for (const { a, d } of cands) {
        const antElev = await elevation(a.lat, a.lon);
        if (antElev == null) continue;
        const hAnt = antElev + 25;
        let tap = false;
        for (const f of [0.25, 0.5, 0.75]) {
          const plat = point.lat + (a.lat - point.lat) * f;
          const plon = point.lon + (a.lon - point.lon) * f;
          const ground = await elevation(plat, plon);
          if (ground == null) continue;
          const los = elev0 + (hAnt - elev0) * f;
          const bulge = (d * f * (d * (1 - f))) / (2 * R_EARTH);
          if (ground > los + bulge + 8) { tap = true; break; }
        }
        if (!tap) { free = d; break; }
        if (blocked == null) blocked = d;
      }
      if (free != null) lines.push(`${op}: linha de vista provável até uma antena (a mais próxima está a ${km1(free)} km).`);
      else if (blocked != null) lines.push(`${op}: há antena a ${km1(blocked)} km, mas o relevo parece tapar. Estimativa.`);
      else lines.push(`${op}: há antena, sem relevo para a linha de vista.`);
    }
    lines.push('Confirmar no local. Não é cobertura da operadora. O 112 pode passar quando a chamada já não passa.');
    return lines;
  }

  async function ipmaText() {
    const now = madeiraParts();
    const t = hhmm(now.h, now.min);
    try {
      const j = await (await fetch(IPMA_URL)).json();
      const list = (Array.isArray(j) ? j : []).filter((w) => IPMA_ZONES[w.idAreaAviso] && ['yellow', 'orange', 'red'].includes(w.awarenessLevelID));
      if (!list.length) return `Sem aviso amarelo, laranja ou vermelho nas quatro zonas da Madeira. Lido às ${t}. Isto não decide uma saída.`;
      const body = list.map((w) => `${IPMA_ZONES[w.idAreaAviso]}: ${w.awarenessTypeName} (${w.awarenessLevelID})`).join(' · ');
      return `${body}. Lido às ${t}. O aviso do IPMA fica como está. Não é uma ordem para ir ou ficar.`;
    } catch {
      return 'Avisos do IPMA indisponíveis nesta leitura.';
    }
  }

  function setSunLine(sun) {
    if (!map.isStyleLoaded()) return;
    const len = sun.aboveHorizon ? 7000 : 2000;
    const end = destination(point.lat, point.lon, sun.azimuthDeg, len);
    const gj = { type: 'Feature', geometry: { type: 'LineString', coordinates: [[point.lon, point.lat], [end.lon, end.lat]] }, properties: {} };
    if (!map.getSource('gsun')) {
      map.addSource('gsun', { type: 'geojson', data: gj });
      map.addLayer({ id: 'gsun', type: 'line', source: 'gsun', paint: { 'line-color': '#e2a45a', 'line-width': 3, 'line-opacity': 0.9 } });
    } else map.getSource('gsun').setData(gj);
    if (!map.getSource('gpt')) {
      map.addSource('gpt', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [point.lon, point.lat] }, properties: {} } });
      map.addLayer({ id: 'gpt', type: 'circle', source: 'gpt', paint: { 'circle-radius': 7, 'circle-color': '#e2a45a', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });
    } else map.getSource('gpt').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [point.lon, point.lat] }, properties: {} });
    try {
      if (map.isStyleLoaded()) map.setLight({
        anchor: 'map',
        position: [1.15, sun.azimuthDeg, Math.min(180, Math.max(0, 90 - sun.altitudeDeg))],
        intensity: sun.aboveHorizon ? 0.65 : 0.12,
      });
    } catch (e) {}
  }

  function setPlacesVis() {
    if (map.getLayer('gfuel')) map.setLayoutProperty('gfuel', 'visibility', showPostos ? 'visible' : 'none');
    if (map.getLayer('gant')) map.setLayoutProperty('gant', 'visibility', showAntenas ? 'visible' : 'none');
  }

  function addPlacesLayers() {
    if (!map.isStyleLoaded()) return;
    const fuels = { type: 'FeatureCollection', features: places.fuels.map((f) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [f.lon, f.lat] }, properties: f })) };
    const ants = { type: 'FeatureCollection', features: places.antennas.map((a) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [a.lon, a.lat] }, properties: { ops: a.operators.join(',') } })) };
    if (map.getSource('gfuel')) {
      map.getSource('gfuel').setData(fuels);
      map.getSource('gant').setData(ants);
    } else {
      map.addSource('gfuel', { type: 'geojson', data: fuels });
      map.addSource('gant', { type: 'geojson', data: ants });
      map.addLayer({ id: 'gfuel', type: 'circle', source: 'gfuel', layout: { visibility: showPostos ? 'visible' : 'none' }, paint: { 'circle-radius': 6, 'circle-color': '#e2a45a', 'circle-stroke-width': 1, 'circle-stroke-color': '#04131c' } });
      map.addLayer({ id: 'gant', type: 'circle', source: 'gant', layout: { visibility: showAntenas ? 'visible' : 'none' }, paint: { 'circle-radius': 3, 'circle-color': '#8fd3ff', 'circle-opacity': 0.85 } });
    }
  }

  function addPeakLabels() {
    peakMarks.forEach((m) => m.remove());
    peakMarks.length = 0;
    for (const p of PEAKS) {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'pklbl';
      el.textContent = peakLabel(p.name);
      el.title = p.name + (p.elev != null ? ` · ${p.elev} m` : ' · altitude por confirmar');
      el.addEventListener('click', (ev) => { ev.stopPropagation(); flyPeak(p.id); });
      peakMarks.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lon, p.lat]).addTo(map));
    }
  }

  async function refresh() {
    const box = document.getElementById('gtexts');
    if (!box) return;
    const parts = madeiraParts();
    const utc = madeiraToUtc(parts.y, parts.m, parts.d, hour, minute);
    const sun = sunPosition(utc, point.lat, point.lon);
    setSunLine(sun);
    const elev0 = await elevation(point.lat, point.lon);
    const t = hhmm(hour, minute);
    const sunLines = [];
    if (sun.aboveHorizon) {
      sunLines.push(`Às ${t}, hora da Madeira, o sol está ${sun.altitudeDeg.toFixed(0)}° acima do horizonte, azimute ${sun.azimuthDeg.toFixed(0)}° (norte = 0, sentido horário). É cálculo, não uma foto.`);
    } else {
      sunLines.push(`Às ${t}, hora da Madeira, o sol está abaixo do horizonte (${sun.altitudeDeg.toFixed(0)}°).`);
      sunLines.push('Sem sol neste ponto a esta hora. A linha mostra a direção, não uma sombra medida.');
    }
    if (elev0 == null) sunLines.push('Não há relevo neste ponto (tile Terrarium indisponível).');
    else sunLines.push(`Altitude do modelo neste ponto: cerca de ${Math.round(elev0)} m (superfície Terrarium / Terrain Tiles AWS · Copernicus).`);
    const sh = await shadowText(sun, elev0);
    const fuel = fuelText();
    const net = await networkTexts(elev0);
    const ipma = await ipmaText();
    const now = madeiraParts();
    const upd = `Atualizado às ${hhmm(now.h, now.min)}, hora da Madeira`;
    const final = 'Informação de ajuda. Não substitui o IPMA, o IFCN nem a Proteção Civil. Confirmar no local.';
    box.innerHTML = [...sunLines, sh, fuel, ...net, ipma, upd, final].map((s) => `<p>${s}</p>`).join('');
  }

  async function loadPlaces() {
    try {
      const j = await (await fetch(new URL('data/places.json', location.href).href + '?t=' + Date.now())).json();
      places = j;
      if (j.error && !j.fuels.length) places.error = j.error;
      else places.error = null;
    } catch (e) {
      places = { fuels: [], antennas: [], error: String(e.message || e), readAt: null };
    }
    addPlacesLayers();
  }

  function onStyle() {
    addPlacesLayers();
    const mp=madeiraParts();setSunLine(sunPosition(madeiraToUtc(mp.y,mp.m,mp.d,hour,minute),point.lat,point.lon));
    // rebuild peak markers (DOM markers survive setStyle, but ensure)
    if (!peakMarks.length) addPeakLabels();
  }

  // boot
  ensurePanel();
  map.on('click', (e) => {
    if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest && e.originalEvent.target.closest('.pklbl,.mk')) return;
    peakId = null;
    point = { lat: e.lngLat.lat, lon: e.lngLat.lng };
    dPk();
    refresh();
  });
  map.on('style.load', () => { onStyle(); refresh(); });
  function start() {
    agora();
    addPeakLabels();
    loadPlaces().then(refresh);
    try {
      if (window.MAP_3D) map.jumpTo({ center: [PEAKS[2].lon, PEAKS[2].lat], zoom: 12.1, pitch: 64, bearing: -24 });
    } catch (e) {}
  }
  if (map.isStyleLoaded()) start(); else map.once('load', start);
})();
