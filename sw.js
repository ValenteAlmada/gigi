const C='meteo-v3',SHELL=['./','index.html','app.js','style.css','manifest.json','icon.svg','icon-192.png','icon-512.png','data/miradouros.geojson','data/monumentos.geojson','data/servicos.geojson','data/ipma-areas.geojson','https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js','https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
// rede primeiro, cache como reserva (app shell, APIs e mosaicos já vistos)
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k))}return r}).catch(()=>caches.match(e.request,{ignoreVary:true})))});
