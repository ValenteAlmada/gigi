// Camadas do mapa uMap «Meteo Madeira» (cópia estática em data/umap/, ODbL 1.0)
(()=>{const GR=['Segurança','Tempo','Atividades','Natureza/Água','Outros'];let UL=[];window.UMAP_LAYERS=UL;
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const okUrl=u=>/^(https?:|geo:|tel:|mailto:)/i.test(u);
// sanitiza: escapa tudo e só depois recria ligações [[url|texto]] / [[url]], **negrito** e quebras de linha
function md(s){let h=e(s);h=h.replace(/\[\[([^|\]]+)(?:\|([^\]]*))?\]\]/g,(m,u,t)=>{const r=u.replace(/&amp;/g,'&');return okUrl(r)?`<a href="${e(r)}" target="_blank" rel="noopener noreferrer">${t||u}</a>`:(t||u)});
 return h.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}
window.umapMD=md;
function ids(o){return[o.id+'-fill',o.id+'-line',o.id+'-cl',o.id+'-cn',o.id+'-pt']}
const DATA={};
async function ensure(o){if(!DATA[o.id])DATA[o.id]=fetch('data/umap/'+o.slug+'.geojson').then(r=>r.json());const d=await DATA[o.id];if(map.getSource(o.id))return;
 const P=d.features.filter(f=>f.geometry.type==='Point'),O=d.features.filter(f=>f.geometry.type!=='Point'),cl=P.length>50,v=document.querySelector(`[data-u=${o.id}]`).checked?'visible':'none',c=o.color,A='Camadas: mapa uMap Meteo Madeira (OSM/ODbL 1.0)';
 // pontos e linhas/polígonos em fontes separadas (o agrupamento só aceita pontos)
 map.addSource(o.id,{type:'geojson',attribution:A,data:{type:'FeatureCollection',features:P},...(cl?{cluster:true,clusterRadius:45,clusterMaxZoom:14}:{})});
 map.addSource(o.id+'g',{type:'geojson',attribution:A,data:{type:'FeatureCollection',features:O}});
 const G=t=>['in',['geometry-type'],['literal',t]];
 map.addLayer({id:o.id+'-fill',type:'fill',source:o.id+'g',filter:G(['Polygon','MultiPolygon']),layout:{visibility:v},paint:{'fill-color':c,'fill-opacity':.3}});
 map.addLayer({id:o.id+'-line',type:'line',source:o.id+'g',layout:{visibility:v},paint:{'line-color':c,'line-width':3}});
 map.addLayer({id:o.id+'-cl',type:'circle',source:o.id,filter:['has','point_count'],layout:{visibility:v},paint:{'circle-color':c,'circle-opacity':.85,'circle-stroke-color':'#fff','circle-stroke-width':2,'circle-radius':['step',['get','point_count'],14,10,18,50,24]}});
 map.addLayer({id:o.id+'-cn',type:'symbol',source:o.id,filter:['has','point_count'],layout:{visibility:v,'text-field':['get','point_count_abbreviated'],'text-size':14,'text-font':['Noto Sans Bold']},paint:{'text-color':'#fff'}});
 map.addLayer({id:o.id+'-pt',type:'circle',source:o.id,filter:['!',['has','point_count']],layout:{visibility:v},paint:{'circle-color':c,'circle-radius':7,'circle-stroke-color':'#fff','circle-stroke-width':2}})}
function add(){for(const o of UL)if(document.querySelector(`[data-u=${o.id}]`).checked&&!map.getSource(o.id))ensure(o)}
function bind(){for(const o of UL){
  map.on('click',o.id+'-cl',async ev=>{const f=ev.features[0];const z=await map.getSource(o.id).getClusterExpansionZoom(f.properties.cluster_id);map.jumpTo({center:f.geometry.coordinates,zoom:z})});
  for(const l of [o.id+'-pt',o.id+'-line',o.id+'-fill']){
   map.on('click',l,ev=>{if(l.endsWith('-fill')&&map.queryRenderedFeatures(ev.point,{layers:[o.id+'-pt',o.id+'-line']}).length)return;const p=ev.features[0].properties;
    new maplibregl.Popup({maxWidth:'340px',className:'upop'}).setLngLat(ev.lngLat).setHTML(`<b>${e(p.name||'(sem nome)')}</b><div class="udesc">${md(p.description||'')}</div><small>Camada «${e(o.name)}» · mapa uMap Meteo Madeira (ODbL 1.0)</small>`).addTo(map)});
   map.on('mouseenter',l,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',l,()=>map.getCanvas().style.cursor='')}}}
async function init(){UL.push(...await (await fetch('data/umap/layers.json')).json());
 const box=document.createElement('div');box.id='umapbox';box.innerHTML='<h3 class="uh">Camadas do mapa uMap Meteo Madeira</h3>'+GR.map(g=>{const ls=UL.filter(o=>o.group===g);return ls.length?`<fieldset><legend>${g}</legend>${ls.map(o=>`<label><input type="checkbox" data-u="${o.id}"><span class="sw" style="background:${o.color}"></span> ${e(o.label)} <small>(${o.count})</small></label>`).join('')}</fieldset>`:''}).join('')+'<p class="note">Camadas: mapa uMap Meteo Madeira (OSM/ODbL) — licença ODbL 1.0. Cópia estática de 14-10-2026; as camadas marcadas «viva» no uMap podem estar desatualizadas aqui.</p>';
 const lt=document.getElementById('ltimes');lt.parentNode.insertBefore(box,lt);
 box.addEventListener('change',async ev=>{const o=UL.find(x=>x.id===ev.target.dataset.u);if(!o)return;await ensure(o);ids(o).forEach(l=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',ev.target.checked?'visible':'none'))});
 map.on('style.load',add);bind();window.UMAP_READY=1}
init().catch(err=>console.error('uMap',err))})();
