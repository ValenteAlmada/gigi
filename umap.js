// Camadas do mapa uMap «Meteo Madeira» (cópia estática em data/umap/, ODbL 1.0) — painel por categorias, pesquisa, fichas
(()=>{const CMP=(a,b)=>String(a).localeCompare(String(b),'pt',{sensitivity:'base'});
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const okUrl=u=>/^(https?:|geo:|tel:|mailto:)/i.test(u),okImg=u=>/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(u);
const OOMURL='https://oom.arditi.pt/';const CLOSE='Informação não vinculativa. Confirmar junto das autoridades competentes (IPMA, Proteção Civil, IFCN) e de operadores locais.';
// sanitiza: escapa tudo e só depois recria ligações [[url|texto]], fotos {{url}} do Wikimedia, **negrito** e quebras de linha
function md(s){let h=e(String(s||'').replace(/\s*\[EST\]/g,' (estimativa)'));const un=u=>u.replace(/&amp;/g,'&');
 h=h.replace(/\{\{\{([^}|]+)(?:\|[^}]*)?\}\}\}/g,(m,u)=>okUrl(un(u))?`<a href="${e(un(u))}" target="_blank" rel="noopener noreferrer">abrir</a>`:'');
 h=h.replace(/\{\{([^}|]+)(?:\|([^}]*))?\}\}/g,(m,u)=>okImg(un(u))?`<img class="uimg" loading="lazy" alt="" src="${e(un(u))}">`:okUrl(un(u))?`<a href="${e(un(u))}" target="_blank" rel="noopener noreferrer">imagem</a>`:'');
 h=h.replace(/\[\[([^|\]]+)(?:\|([^\]]*))?\]\]/g,(m,u,t)=>okUrl(un(u))?`<a href="${e(un(u))}" target="_blank" rel="noopener noreferrer">${t||u}</a>`:(t||u));
 return h.replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').split('\n').map(l=>/^🚨 Avisos/.test(l)?`<span class="stale">${l} (na cópia)</span>`:l).join('<br>')}
window.umapMD=md;
const NORISK=/^(mobilidade-|servicos-agua|servicos-farmacias|natureza-miradouros|energia|servicos-servicos)/;
let FRESH=false; // dados lidos há menos de 1 h
function clean(o,d){let L=String(d||'').split('\n');
 if(NORISK.test(o.slug))L=L.filter(l=>!/^[🟢🟡🟠🔴⚪]\s/u.test(l.trim()));
 if(o.slug.startsWith('mobilidade-autocarros')&&!FRESH)L=L.filter(l=>!/^(Hoje:|Próxim)/i.test(l.trim()));
 L=L.map(l=>l.replace(/\s*\(termina no mar: por confirmar\)/,'')
  .replace(/^\*\*📜 Licença e regras\*\*/,'**📜 Precisa de autorização e regras**')
  .replace(/^Licença\/autorização de uso das imagens:/,'Precisa de autorização (uso das imagens):')
  .replace(/^Licença\/autorização:/,'Precisa de autorização:').replace(/^📝 Licença:/,'📝 Autorização:')
  .replace(/^💧 Potável: sim \([^)]*\)/,'💧 Água: marcado no OSM (não verificado oficialmente)').replace(/^💧 Potável: não.*/,'💧 Marcado no OSM como não potável').replace(/^💧 Marcado como potável no OSM/,'💧 Água: marcado no OSM').replace(/^💧 Marcado como não potável no OSM/,'💧 Marcado no OSM como não potável').replace(/\bPotável:/,'Marcado no OSM:')
  .replace(/\[\[https:\/\/www\.horariosdofunchal\.pt\/?\|[^\]]*\]\]/g,'[[https://www.horariosdofunchal.pt/|Horários do Funchal]]'));
 if(o.slug.startsWith('mobilidade-autocarros')&&!L.some(l=>/horariosdofunchal/.test(l)))L.push('🚌 Horários: [[https://www.horariosdofunchal.pt/|Horários do Funchal]]');
 return L.join('\n')}
let IFCN=null;const IFCNURL='https://ifcn.madeira.gov.pt/pt/atividades-de-natureza/percursos-pedestres-recomendados/percursos-pedestres-recomendados.html',SIMPL='https://simplifica.madeira.gov.pt/';
async function ifcnState(name,lat){try{IFCN=IFCN||(await (await fetch('data/ifcn-estado.json',{cache:'no-store'})).json()).percursos}catch(x){return null}
 const m=String(name).match(/PR\s*(\d+(?:\.\d+)?)/);if(!m)return null;const k=(lat>32.95?'PS ':'')+'PR '+m[1];return IFCN[k]||null}
// categorias e subcategorias (tudo ordenado alfabeticamente ao desenhar)
const SUB={'montanha-base-jump':'Atividades/Ar','montanha-parapente':'Atividades/Ar','lazer-campismo-e-caravanismo':'Atividades/Lazer','lazer-golfe':'Atividades/Lazer','montanha-caminho-real':'Atividades/Montanha','montanha-canyons':'Atividades/Montanha','montanha-escalada':'Atividades/Montanha','montanha-provas-de-trail-e-skyrunning':'Atividades/Montanha','montanha-trilhos-e-levadas':'Atividades/Montanha','lazer-bicicleta':'Atividades/Rodas','lazer-offroad':'Atividades/Rodas',
 'servicos-agua-potavel':'Natureza e Água/Água','natureza-areas-naturais':'Natureza e Água/Natureza','natureza-birdwatching':'Natureza e Água/Natureza','natureza-caca':'Natureza e Água/Natureza','natureza-astronomia':'Natureza e Água/Paisagem','natureza-geossitios':'Natureza e Água/Paisagem','natureza-miradouros':'Natureza e Água/Paisagem',
 'energia':'Outros/Energia','servicos-servicos-publicos':'Outros/Serviços','servicos-farmacias':'Outros/Serviços','sociedade-concelhos-ine':'Outros/Sociedade',
 'seguranca-area-ardida-2024-emsr748':'Segurança/Riscos','seguranca-derrocadas':'Segurança/Riscos','natureza-sismos':'Segurança/Riscos','tempo-incendios-ativos':'Segurança/Riscos','seguranca-socorro':'Segurança/Socorro e rede','seguranca-rede-movel':'Segurança/Socorro e rede','seguranca-notas-osm':'Segurança/Socorro e rede',
 'tempo-avisos-ipma':'Tempo/Avisos','tempo-estacoes':'Tempo/Observação e previsão','tempo-pontos-de-previsao':'Tempo/Observação e previsão','tempo-chuva-24-h-mapa-de-calor':'Tempo/Observação e previsão','tempo-satelite-nasa-hoje':'Tempo/Observação e previsão','tempo-webcams-outras':'Tempo/Webcams','tempo-webcams-netmadeira':'Tempo/Webcams','../ipma-estacoes':'Tempo/Observação e previsão','../ipma-sismos':'Segurança/Riscos'};
const subOf=o=>SUB[o.slug]||(o.slug.startsWith('mar-')?'Atividades/Mar':o.slug.startsWith('mobilidade')?'Outros/Transportes':o.slug.startsWith('tempo-')?'Tempo/Observação e previsão':o.slug.startsWith('seguranca-')?'Segurança/Riscos':o.slug.startsWith('natureza-')?'Natureza e Água/Natureza':o.slug.startsWith('montanha-')?'Atividades/Montanha':'Outros/Outros');
// camadas já existentes no site (checkboxes de app.js)
const BUILTIN=[['wx','Pontos de tempo agora','Tempo/Observação e previsão'],['ipma','Zonas de aviso','Tempo/Avisos'],['mon','Monumentos','Natureza e Água/Paisagem'],['hosp','Hospitais e clínicas','Segurança/Socorro e rede']];
let UL=[],META={},DATA={};window.UMAP_LAYERS=UL;
const cbU=id=>document.querySelector(`[data-u=${id}]`);
const LAYIDS=o=>[o.id+'-fill',o.id+'-line',o.id+'-cl',o.id+'-cn',o.id+'-pt'];
function load(o){return DATA[o.id]||(DATA[o.id]=fetch('data/umap/'+o.slug+'.geojson').then(r=>r.json()))}
async function ensure(o){const d=await load(o);if(map.getSource(o.id))return;
 const P=d.features.filter(f=>f.geometry.type==='Point'),O=d.features.filter(f=>f.geometry.type!=='Point'),cl=P.length>50,v=cbU(o.id).checked?'visible':'none',c=o.color,A='Camadas: mapa uMap Meteo Madeira (OSM/ODbL 1.0)';
 // pontos e linhas/polígonos em fontes separadas (o agrupamento só aceita pontos)
 map.addSource(o.id,{type:'geojson',attribution:A,data:{type:'FeatureCollection',features:P},...(cl?{cluster:true,clusterRadius:45,clusterMaxZoom:14}:{})});
 map.addSource(o.id+'g',{type:'geojson',attribution:A,data:{type:'FeatureCollection',features:O}});
 const G=t=>['in',['geometry-type'],['literal',t]];
 map.addLayer({id:o.id+'-fill',type:'fill',source:o.id+'g',filter:G(['Polygon','MultiPolygon']),layout:{visibility:v},paint:{'fill-color':c,'fill-opacity':.3}});
 map.addLayer({id:o.id+'-line',type:'line',source:o.id+'g',layout:{visibility:v},paint:{'line-color':c,'line-width':3}});
 map.addLayer({id:o.id+'-cl',type:'circle',source:o.id,filter:['has','point_count'],layout:{visibility:v},paint:{'circle-color':c,'circle-opacity':.85,'circle-stroke-color':'#fff','circle-stroke-width':2,'circle-radius':['step',['get','point_count'],14,10,18,50,24]}});
 map.addLayer({id:o.id+'-cn',type:'symbol',source:o.id,filter:['has','point_count'],layout:{visibility:v,'text-field':['get','point_count_abbreviated'],'text-size':14,'text-font':['Noto Sans Bold']},paint:{'text-color':'#fff'}});
 map.addLayer({id:o.id+'-pt',type:'circle',source:o.id,filter:['!',['has','point_count']],layout:{visibility:v},paint:{'circle-color':c,'circle-radius':7,'circle-stroke-color':'#fff','circle-stroke-width':2}})}
let UPD=null;const STALE=90*6e4;
function readAge(){return Date.now()-new Date(UPD?UPD.updated:META.read).getTime()}
const fmtIso=s=>new Date(s).toLocaleString('pt-PT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Atlantic/Madeira'}).replace(',','');
// descrição das camadas próprias (IPMA), com a hora de cada observação
function extDesc(o,p){const v=(x,u,d=1)=>x==null?'—':nf(x,d)+u;if(o.ext==='est')return `🌡️ Temperatura: ${v(p.temp,' °C')}\n💧 Humidade: ${v(p.hum,' %',0)}\n💨 Vento médio: ${v(p.vento,' km/h',0)}\n🌧️ Chuva na última hora: ${v(p.chuva,' mm')}\n🧭 Pressão: ${v(p.pressao,' hPa',0)}\n🚨 Avisos: ver linha de avisos acima`;return `📈 Magnitude: ${p.mag==null?'—':nf(p.mag,1)}\n⬇️ Profundidade: ${p.prof==null?'—':p.prof+' km'}\n🚨 Avisos: ver linha de avisos acima`}
const fmt=t=>new Date(t).toLocaleString('pt-PT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Atlantic/Madeira'}).replace(',','');
const dist=(a,b,c,d)=>{const R=6371,x=(c-a)*Math.PI/180*Math.cos((b+d)/2*Math.PI/180),y=(d-b)*Math.PI/180;return R*Math.hypot(x,y)};
async function nearSafety(lon,lat){const so=UL.find(o=>o.slug==='seguranca-socorro');if(!so)return '';const d=await load(so);const best=re=>{let b=null;for(const f of d.features){if(f.geometry.type!=='Point'||!re.test(f.properties.name))continue;const k=dist(lon,lat,...f.geometry.coordinates);if(!b||k<b[0])b=[k,f.properties.name]}return b};
 const h=best(/Centro de Saúde|Hospital/i),b=best(/Bombeiros/i);return (h?`<br>🏥 Saúde mais próxima: ${e(h[1].replace(/^\W+\s*/,''))} (${h[0].toFixed(1)} km)`:'')+(b?`<br>🚒 Bombeiros mais próximos: ${e(b[1].replace(/^\W+\s*/,''))} (${b[0].toFixed(1)} km)`:'')}
async function popup(o,f,ll){const p=f.properties,[lon,lat]=f.geometry.type==='Point'?f.geometry.coordinates:[ll.lng,ll.lat];
 const fage=p.hora?Date.now()-new Date(p.hora).getTime():readAge(),old=o.live&&fage>STALE,desc=clean(o,o.ext?extDesc(o,p):(p.description||'')),lido=p.hora?fmtIso(p.hora):(UPD?UPD.label:META.readLabel);
 const sh=document.getElementById('sheet'),c=document.getElementById('sheetc');sh.hidden=false;sh.scrollTop=0;
 const trail=/^montanha-(trilhos|caminho-real)/.test(o.slug);
 c.innerHTML=`<div class="upop"><h3 class="uname">${e(p.name||'(sem nome)')}</h3><p class="layer">${e(o.label)}</p><div class="uifcn"></div><div class="ulive">A ler avisos e tempo agora…</div><div class="${old?'stale':''}"><small class="ulido">${o.live?'⟳ ':''}lido às ${e(lido)}${old?' · dado antigo':''}</small><div class="udesc">${md(desc)}</div></div><div class="usafe"></div>${desc.includes('Informação não vinculativa')?'':`<p class="uclose">ℹ️ ${CLOSE}</p>`}${/Non-binding/.test(desc)?'':'<p class="en" lang="en">EN: Non-binding information. Check with the competent authorities (IPMA, Civil Protection, IFCN) and local operators.</p>'}</div>`;
 const el=c.querySelector('.upop');
 if(/^mar-|^montanha-canyons/.test(o.slug))el.querySelector('.usafe').insertAdjacentHTML('beforebegin',`<p class="oom">🌊 Estado do mar previsto (ondas, temperatura da água, correntes): <a href="${OOMURL}" target="_blank" rel="noopener">Observatório Oceânico da Madeira (OOM)</a></p>`);
 if(trail){const st=await ifcnState(p.name,lat);const ic=!st?'ℹ️':/Encerr|Fechad/i.test(st.estado)?'⛔':/Parcial|Condic/i.test(st.estado)?'⚠️':'🟢';
  el.querySelector('.uifcn').innerHTML=`<div class="box"><b>${ic} Estado oficial IFCN: ${st?e(st.estado):'sem informação para este percurso'}</b>${st&&st.nota?'<br>'+e(st.nota):''}<br><a href="${IFCNURL}" target="_blank" rel="noopener">Confirmar no IFCN</a> · <a href="${SIMPL}" target="_blank" rel="noopener">SIMplifica (taxas e reservas)</a><br><span class="en" lang="en">EN: official trail status (IFCN)</span></div>`}
 if(!/Segurança/.test(desc))nearSafety(lon,lat).then(s=>{el.querySelector('.usafe').innerHTML=`<b>🆘 Segurança</b><br>Emergência: <a href="tel:112">112</a>${s}`});
 let L='';try{const a=typeof regionOf==='function'?regionOf(lon,lat):null;if(a){const lv=maxLv(areaWarn(a));L+=`<div>${lv>=3?'☠️':lv>=1?'⚠️':'🟢'} ${lv>=1?warnHTML(a):'Sem avisos'}</div>`}}catch(x){}
 try{const {j,t,old:o2}=await getJSON('u_'+lat.toFixed(2)+lon.toFixed(2),`${OM}?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_gusts_10m,precipitation,visibility&timezone=Atlantic%2FMadeira`);const w=j.current;
  L+=`<div class="${o2?'stale':''}">🌡️ Agora: ${nf(w.temperature_2m)} °C · rajadas ${nf(w.wind_gusts_10m)} km/h · chuva ${nf(w.precipitation,1)} mm${w.visibility!=null?` · visibilidade ${w.visibility>=1000?nf(w.visibility/1000,1)+' km':nf(w.visibility)+' m'}`:''} <small>· lido às ${fmt(t)}</small></div>`}catch(x){}
 el.querySelector('.ulive').innerHTML=L||'<span class="stale">Avisos e tempo agora indisponíveis</span>'}
function bind(){for(const o of UL){
  map.on('click',o.id+'-cl',async ev=>{const f=ev.features[0];const z=await map.getSource(o.id).getClusterExpansionZoom(f.properties.cluster_id);map.jumpTo({center:f.geometry.coordinates,zoom:z})});
  for(const l of [o.id+'-pt',o.id+'-line',o.id+'-fill']){
   map.on('click',l,ev=>{if(l.endsWith('-fill')&&map.queryRenderedFeatures(ev.point,{layers:[o.id+'-pt',o.id+'-line']}).length)return;popup(o,ev.features[0],ev.lngLat)});
   map.on('mouseenter',l,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',l,()=>map.getCanvas().style.cursor='')}}}
async function setU(o,on){const cb=cbU(o.id);cb.checked=on;if(on)await ensure(o);LAYIDS(o).forEach(l=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',on?'visible':'none'));draw()}
window.umapPopup=(...a)=>popup(...a);window.umapSet=(slug,on)=>setU(UL.find(o=>o.slug===slug),on);
let CUR=null,CURS=null;
function items(){return[...UL.map(o=>({key:'u:'+o.id,label:o.label,count:o.count,sub:subOf(o),on:cbU(o.id).checked,o})),...BUILTIN.map(([g,l,s])=>({key:'l:'+g,label:l,sub:s,on:document.querySelector(`[data-l=${g}]`).checked,g}))]}
function draw(){const it=items(),cats=[...new Set(it.map(x=>x.sub.split('/')[0]))].sort(CMP),n=c=>it.filter(x=>x.on&&x.sub.startsWith(c+'/')).length;
 const box=document.getElementById('ucats');box.innerHTML=cats.map(c=>`<button type="button" class="ucat" data-c="${e(c)}" aria-pressed="${c===CUR}">${e(c)}${n(c)?` <span class="ucnt">${n(c)}</span>`:''}</button>`).join('')+`<button type="button" id="uoff" class="ucat off">Desligar tudo${it.some(x=>x.on)?` (${it.filter(x=>x.on).length})`:''}</button>`;
 const sb=document.getElementById('usubs'),ch=document.getElementById('uchips');sb.innerHTML='';ch.innerHTML='';if(!CUR)return;
 const subs=[...new Set(it.filter(x=>x.sub.startsWith(CUR+'/')).map(x=>x.sub.split('/')[1]))].sort(CMP);if(!subs.includes(CURS))CURS=subs[0];
 sb.innerHTML=subs.map(s=>{const k=it.filter(x=>x.on&&x.sub===CUR+'/'+s).length;return `<button type="button" class="usub" data-s="${e(s)}" aria-pressed="${s===CURS}">${e(s)}${k?` <span class="ucnt">${k}</span>`:''}</button>`}).join('');
 ch.innerHTML=it.filter(x=>x.sub===CUR+'/'+CURS).sort((a,b)=>CMP(a.label,b.label)).map(x=>`<button type="button" class="uchip" data-k="${x.key}" aria-pressed="${x.on}">${x.o?`<span class="sw" style="background:${x.o.color}"></span>`:''}${e(x.label)}${x.count!=null?` <small>(${x.count})</small>`:''}</button>`).join('')}
function panel(){const L=document.getElementById('layers');[...L.querySelectorAll('fieldset')].forEach(f=>f.hidden=true);
 const w=document.createElement('div');w.id='umapbox';w.innerHTML=`<label class="usearch">🔎 Procurar por nome <input id="uq" type="search" autocomplete="off" placeholder="ex.: Pico do Arieiro"></label><ul id="ures"></ul><div id="ucats"></div><div id="usubs"></div><div id="uchips"></div>
 <div class="uhide">${UL.map(o=>`<input type="checkbox" data-u="${o.id}" tabindex="-1" aria-hidden="true">`).join('')}</div>`;
 L.insertBefore(w,document.getElementById('ltimes'));
 w.addEventListener('click',async ev=>{const b=ev.target.closest('button');if(!b)return;
  if(b.id==='uoff'){for(const o of UL)if(cbU(o.id).checked)await setU(o,false);for(const [g] of BUILTIN){const c=document.querySelector(`[data-l=${g}]`);if(c.checked)c.click()}draw();return}
  if(b.dataset.c){CUR=CUR===b.dataset.c?null:b.dataset.c;CURS=null;draw();return}
  if(b.dataset.s){CURS=b.dataset.s;draw();return}
  if(b.dataset.k){const [t,id]=b.dataset.k.split(':');if(t==='u'){const o=UL.find(x=>x.id===id);await setU(o,!cbU(id).checked)}else{document.querySelector(`[data-l=${id}]`).click();draw()}return}
  if(b.dataset.r!=null)go(+b.dataset.r)});
 let IDX=null,hits=[];const q=document.getElementById('uq'),res=document.getElementById('ures');const N=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 let IDXP=null;const idx=()=>IDXP||(IDXP=(async()=>{const I=await (await fetch('data/umap/search.json')).json();
  for(const [f,lab,flt] of [['monumentos','Monumentos',null],['miradouros','Miradouros (OSM)',null],['servicos','Hospitais e clínicas',p=>/hospital|clinic/.test(p.amenity)]]){try{const d=await (await fetch('data/'+f+'.geojson')).json();for(const x of d.features){const p=x.properties;if(!p.name||(flt&&!flt(p)))continue;const [lo,la]=x.geometry.coordinates;I.push([p.name,-1,lo,la,lab,p])}}catch(x){}}
  for(const x of I)x[0]=String(x[0]).replace(/Arieiro/g,'Areeiro');return I})());
 q.addEventListener('input',async()=>{const raw=q.value,v=N(raw.trim().replace(/Arieiro/gi,'Areeiro'));if(v.length<2){res.innerHTML='';return}IDX=await idx();if(q.value!==raw)return;
  hits=IDX.filter(x=>N(x[0]).includes(v)).sort((a,b)=>CMP(a[0],b[0])).slice(0,20);res.innerHTML=hits.length?hits.map((x,i)=>`<li><button type="button" class="ures" data-r="${i}">${e(x[0])} <small>· ${e(x[1]<0?x[4]:UL[x[1]].label)}</small></button></li>`).join(''):'<li>Sem resultados</li>'});
 async function go(i){const [n,li,lon,lat,lab,props]=hits[i];if(li<0){map.jumpTo({center:[lon,lat],zoom:16});res.innerHTML='';q.value='';ficha({name:n,lat,lon,tags:props,osm:props.osm,featured:n===NSP.name});return}const o=UL[li];await setU(o,true);map.jumpTo({center:[lon,lat],zoom:16});const d=await load(o);
  const f=d.features.find(f=>f.properties.name===n)||{properties:{name:n},geometry:{type:'Point',coordinates:[lon,lat]}};popup(o,f.geometry.type==='Point'?f:{...f,geometry:f.geometry},{lng:lon,lat});res.innerHTML='';q.value=''}
 // Fontes e legendas (ordem alfabética)
 const F=document.createElement('details');F.id='fontes';const src=['Câmaras Municipais e Juntas de Freguesia (contactos oficiais)','Copernicus EMS (área ardida 2024, EMSR748)','GDACS e tsunami.gov (tsunamis)','IFCN (trilhos, áreas naturais e estado oficial dos percursos pedestres recomendados)','INE (concelhos)','IPMA (avisos, estações, sismos; dados abertos atualizados de hora a hora)','mapa uMap Meteo Madeira — ODbL 1.0','NASA GIBS / Worldview (satélite)','Observatório Oceânico da Madeira – OOM/ARDITI (previsões do mar; só ligação, licença dos dados por confirmar)','Open-Meteo (previsão e tempo agora, CC BY 4.0)','OpenFreeMap / OpenMapTiles (mapa base)','OpenStreetMap (© colaboradores, ODbL)','SESARAM (contactos de saúde)','USGS (sismos)','Wikidata (CC0)','Wikimedia Commons (fotos; autor e licença em cada foto)','Wikipédia (CC BY-SA)'];if(window.MAP_3D)src.push('Terrain Tiles / AWS Open Data (relevo 3D: Copernicus EU-DEM, USGS SRTM e GMTED2010, NOAA ETOPO1)');src.sort(CMP);
 const leg=['⚠️ aviso','⛔ fechado','☠️ caso extremo (aviso vermelho ou acima dos limites vermelhos)','⟳ camada viva (cópia com hora de leitura)','🟢 sem avisos','Cinzento: dado antigo (mais de 90 min)'].sort(CMP);
 F.innerHTML=`<summary><h2>Fontes e legendas</h2></summary><h3 class="uh">Fontes</h3><ul>${src.map(s=>`<li>${e(s)}</li>`).join('')}</ul><h3 class="uh">Legendas</h3><ul>${leg.map(s=>`<li>${e(s)}</li>`).join('')}</ul><p class="note">Camadas: mapa <a href="https://umap.openstreetmap.fr/pt-pt/map/meteo-madeira-estacoes-e-webcams-teste-1310_1472181" target="_blank" rel="noopener">uMap Meteo Madeira</a> (OSM/ODbL, licença <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank" rel="noopener">ODbL 1.0</a>), lido às ${e(META.readLabel)}.</p><p class="note">Estado do mar (ondas, temperatura e correntes previstas): <a href="${OOMURL}" target="_blank" rel="noopener">Observatório Oceânico da Madeira (OOM/ARDITI)</a>. Só ligação; os dados não são copiados para este site porque a licença de utilização não está confirmada.</p>${window.MAP_3D?'<p class="note">Relevo 3D: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles (AWS Open Data)</a> · <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noopener">atribuição</a>: Copernicus EU-DEM (UE), USGS SRTM/GMTED2010, NOAA ETOPO1.</p>':''}`;
 L.after(F);
 document.querySelectorAll('[data-l]').forEach(c=>c.addEventListener('change',draw));draw()}
function resumo(){const d=String(META.mapDescription||'').split(/\n\s*\*\*Legenda/)[0];if(!d.trim())return;const dd=document.getElementById('dd');const b=document.createElement('details');b.id='resumo';b.className='box';b.innerHTML=`<summary><b>📰 Resumo do dia</b></summary><div class="udesc">${md(d)}</div><small class="${readAge()>STALE?'stale':''}">lido às ${e(UPD?UPD.label:META.readLabel)}</small><p class="en" lang="en">EN: daily summary from the source map (validity, cyclones, satellite).</p>`;dd.querySelector('#acts').before(b)}
async function init(){META=await (await fetch('data/umap/layers.json')).json();UL.push(...META.layers);
 try{UPD=await (await fetch('data/updated.json',{cache:'no-store'})).json()}catch(x){}
 FRESH=readAge()<36e5;
 const up=document.getElementById('upd');if(up){const t=UPD?UPD.label:META.readLabel,old=readAge()>STALE;up.textContent=`Atualizado às ${t.split(' ')[1]} (${t.split(' ')[0]})${old?' · dados antigos':''}`;up.classList.toggle('stale',old)}
 for(const [slug,label,color,ext] of [['../ipma-estacoes','Estações IPMA (observação) ⟳','#0277bd','est'],['../ipma-sismos','Sismos IPMA ⟳','#6a1b9a','sis']]){try{const d=await (await fetch('data/umap/'+slug+'.geojson')).json();UL.push({id:'x'+ext,slug,name:label,label,color,live:true,ext,count:d.features.length,types:{Point:d.features.length}})}catch(x){}}panel();resumo();
 map.on('style.load',()=>{for(const o of UL)if(cbU(o.id).checked)ensure(o)});bind();window.UMAP_READY=1}
init().catch(err=>console.error('uMap',err))})();
