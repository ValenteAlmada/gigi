#!/usr/bin/env node
/** Overpass → data/places.json (GitHub Action horário). Em falha: listas vazias + error. */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const Q = `[out:json][timeout:60];(
node["amenity"="fuel"](32.62,-17.30,32.90,-16.62);
node["amenity"="fuel"](33.02,-16.42,33.12,-16.27);
node["man_made"~"^(mast|tower|communications_tower)$"](32.62,-17.30,32.90,-16.62);
node["man_made"~"^(mast|tower|communications_tower)$"](33.02,-16.42,33.12,-16.27);
);out body;`;
const ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
function splitOps(raw) {
  if (!raw) return [];
  const out = new Set();
  for (const s of raw.split(/[;,/|]/).map((x) => x.trim().toLowerCase())) {
    if (!s) continue;
    if (s.includes('vodafone')) out.add('Vodafone');
    else if (s.includes('digi')) out.add('DIGI');
    else if (s === 'nos' || s.includes('optimus') || s.startsWith('nos ')) out.add('NOS');
    else if (s.includes('meo') || s.includes('altice') || s.includes('tmn')) out.add('MEO');
  }
  return [...out];
}
async function fetchOnce(url) {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'relevo-madeira/1.0 (+https://valentealmada.github.io/gigi/)',
    },
    body: 'data=' + encodeURIComponent(Q),
  });
  if (!r.ok) throw new Error('overpass ' + r.status);
  return r.json();
}
let fuels = [], antennas = [], error = null;
try {
  let json = null, last = null;
  for (const url of ENDPOINTS) {
    try { json = await fetchOnce(url); break; } catch (e) { last = e; }
  }
  if (!json) throw last || new Error('falha');
  for (const el of json.elements || []) {
    if (el.lat == null || el.lon == null) continue;
    const tags = el.tags || {};
    if (tags.amenity === 'fuel') {
      fuels.push({ name: tags.name || tags.brand || 'Posto sem nome', brand: tags.brand ?? null, lat: el.lat, lon: el.lon });
    } else {
      const operators = splitOps(tags.operator || tags.communication || tags.network);
      if (operators.length) antennas.push({ operators, lat: el.lat, lon: el.lon });
    }
  }
} catch (e) {
  error = e instanceof Error ? e.message : 'falha';
  fuels = []; antennas = [];
}
const out = {
  readAt: new Date().toISOString(),
  fuels, antennas, error,
  note: 'OpenStreetMap, via Overpass. Leitura reutilizada durante uma hora. Não é cobertura oficial.',
};
mkdirSync(join(ROOT, 'data'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'places.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ fuels: fuels.length, antennas: antennas.length, error }));
