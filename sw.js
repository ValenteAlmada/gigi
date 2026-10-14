// Shell em pré-cache; camadas e mosaicos guardados só quando usados
const V='v9',SHELL_C='shell-'+V,DATA_C='data-'+V,TILE_C='tiles-'+V,TILE_MAX=400;
const SHELL=['./','index.html','app.js','basemap.js','umap.js','sidebar.js','style.css','3d/theme.css','3d/hud.js','manifest.json','favicon.ico','favicon-32.png','apple-touch-icon.png','icon-192.png','icon-512.png','vendor/maplibre-gl.js','vendor/maplibre-gl.css','data/umap/layers.json','data/ipma-areas.geojson'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL_C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![SHELL_C,DATA_C,TILE_C].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function trim(){const c=await caches.open(TILE_C);const ks=await c.keys();for(let i=0;i<ks.length-TILE_MAX;i++)await c.delete(ks[i])}
const isTile=u=>/\.(pbf|png|jpg|jpeg|webp|mvt)(\?|$)/.test(u.pathname)&&u.origin!==location.origin;
// rede primeiro, cache como reserva
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);const name=isTile(u)?TILE_C:SHELL.some(s=>new URL(s,self.registration.scope).href===u.href.split('?')[0])?SHELL_C:DATA_C;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok||r.type==='opaque'){const k=r.clone();caches.open(name).then(c=>c.put(e.request,k)).then(()=>name===TILE_C&&trim())}return r}).catch(()=>caches.match(e.request,{ignoreVary:true})))});
