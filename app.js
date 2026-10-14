'use strict';
const OM='https://api.open-meteo.com/v1/forecast',MAR='https://marine-api.open-meteo.com/v1/marine',IPMA='https://api.ipma.pt/open-data/forecast/warnings/warnings_www.json';
const BBOX='32.38,-17.30,33.15,-16.25';
const AREAS={MCN:'Madeira – Costa Norte',MCS:'Madeira – Costa Sul',MRM:'Madeira – Regiões Montanhosas',MPS:'Porto Santo'};
// Pontos representativos (aproximados) para colorir cada região — não são os polígonos oficiais do IPMA
const LV={green:0,yellow:1,orange:2,red:3},LVC=['#2e7d32','#fbc02d','#ef6c00','#d32f2f'],LVN=['verde','amarelo','laranja','vermelho'];
const GRID=[['Funchal',32.65,-16.91],['Câmara de Lobos',32.65,-16.98],['Ribeira Brava',32.67,-17.06],['Calheta',32.72,-17.18],['Porto Moniz',32.86,-17.17],['São Vicente',32.80,-17.04],['Santana',32.80,-16.88],['Machico',32.72,-16.77],['Pico do Arieiro',32.735,-16.93],['Paul da Serra',32.74,-17.06],['Caniçal',32.74,-16.74],['Porto Santo',33.06,-16.34]];
const NSP={id:'nsp',name:'Monumento a Nossa Senhora da Paz',lat:32.68458,lon:-16.89917,featured:true};
const hhmm=d=>new Date(d).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit',timeZone:'Atlantic/Madeira'});
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let offlineAt=null;const S={};
function region(lat,lon,elev){if(lon>-16.6)return'MPS';if(elev!=null&&elev>=700)return'MRM';return lat>32.76||(lon<-17.1&&lat>32.80)?'MCN':'MCS'}
// fetch com registo da hora de leitura; se falhar, usa cache do SW e mostra aviso
async function getJSON(key,url,opt){try{const r=await fetch(url,opt);if(!r.ok)throw new Error(r.status);const j=await r.json();const t=Date.now();localStorage.setItem('t_'+key,t);if(opt&&opt.method==='POST')localStorage.setItem('d_'+key,JSON.stringify(j));console.log('[API]',key,'OK',hhmm(t));return{j,t}}
 catch(e){const t=+localStorage.getItem('t_'+key);let j=null;const d=localStorage.getItem('d_'+key);if(d)j=JSON.parse(d);else{const c=await caches.match(url,{ignoreVary:true});if(c)j=await c.json()}
  if(!j)throw e;offlineAt=offlineAt?Math.min(offlineAt,t):t;const b=document.getElementById('offline');b.hidden=false;b.textContent='Sem rede – dados de '+(t?hhmm(t):'?');return{j,t,old:true}}}
function ageCls(t){const a=Date.now()-t;return a>3*36e5?'old3':a>36e5?'old1':''}
function stamp(name,t,old){if(t)S[name]={t,old};document.getElementById('ltimes').innerHTML=Object.entries(S).map(([k,v])=>typeof v==='string'?`<li>${esc(k)}: ${esc(v)}</li>`:`<li class="${ageCls(v.t)}">${esc(k)}: ${v.old?'⚠ ':''}lido às ${hhmm(v.t)}${ageCls(v.t)==='old3'?' (há mais de 3 h)':ageCls(v.t)?' (há mais de 1 h)':''}</li>`).join('')}
setInterval(()=>stamp('',0),6e4);
let warnings=[];
function inRing(x,y,r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if((yi>y)!=(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c}return c}
function regionOf(x,y){if(!ipmaData)return null;for(const f of ipmaData.features){const g=f.geometry,P=g.type==='Polygon'?[g.coordinates]:g.coordinates;if(P.some(p=>inRing(x,y,p[0])&&!p.slice(1).some(h=>inRing(x,y,h))))return f.properties.a}return null}
function areaWarn(a){const now=Date.now();return warnings.filter(w=>w.idAreaAviso===a&&new Date(w.endTime)>now&&new Date(w.startTime)<=now+864e5)}
function maxLv(list,types){return list.filter(w=>!types||types.some(t=>w.awarenessTypeName.includes(t))).reduce((m,w)=>Math.max(m,LV[w.awarenessLevelID]??0),0)}
function warnHTML(a){const l=areaWarn(a).filter(w=>w.awarenessLevelID!=='green');return `<b>${AREAS[a]}</b>: `+(l.length?l.map(w=>`${esc(w.awarenessTypeName)} – <span style="color:${LVC[LV[w.awarenessLevelID]]}">■</span> ${LVN[LV[w.awarenessLevelID]]} (${hhmm(w.startTime)}→${new Date(w.endTime).toLocaleString('pt-PT',{timeZone:'Atlantic/Madeira'})})${w.text?': '+esc(w.text):''}`).join('<br>'):'sem avisos (verde)')}
const map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',bounds:[[-17.28,32.62],[-16.64,32.88]],fitBoundsOptions:{padding:{top:90,bottom:20,left:10,right:10}}});
map.on('error',e=>{if(!map._fb&&e.error&&/style/i.test(String(e.error.message||''))){map._fb=1;map.setStyle({version:8,glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap'}},layers:[{id:'osm',type:'raster',source:'osm'}]})}});
map.addControl(new maplibregl.NavigationControl());const geo=new maplibregl.GeolocateControl({positionOptions:{enableHighAccuracy:true}});map.addControl(geo);geo.on('geolocate',e=>{me=[e.coords.longitude,e.coords.latitude];near()});
if(navigator.permissions)navigator.permissions.query({name:'geolocation'}).then(p=>{if(p.state==='granted')navigator.geolocation.getCurrentPosition(e=>{me=[e.coords.longitude,e.coords.latitude];near()})}).catch(()=>{});
const groups={wx:[],ipma:[],view:[],mon:[],hosp:[],pharm:[]};let nspM=null;
function mk(g,lng,lat,html,cls,onclick){const el=document.createElement('div');el.innerHTML=html;el.className='mk';el.style.cssText=cls;const m=new maplibregl.Marker({element:el}).setLngLat([lng,lat]);if(onclick)el.addEventListener('click',ev=>{ev.stopPropagation();onclick()});groups[g].push(m);if(document.querySelector(`[data-l=${g}]`).checked)m.addTo(map);return m}
document.querySelectorAll('[data-l]').forEach(cb=>cb.addEventListener('change',()=>{const g=cb.dataset.l;groups[g].forEach(m=>cb.checked?m.addTo(map):m.remove());(LAYERS[g]||[]).forEach(l=>map.getLayer(l)&&map.setLayoutProperty(l,'visibility',vis(g)));if(g==='mon')nspM&&(cb.checked?nspM.addTo(map):nspM.remove())}));
map.on('style.load',addOSM);
async function loadIPMA(){const {j,t,old}=await getJSON('ipma',IPMA);warnings=j.filter(w=>AREAS[w.idAreaAviso]);console.log('[IPMA] avisos Madeira:',warnings.map(w=>w.idAreaAviso+':'+w.awarenessTypeName+':'+w.awarenessLevelID).join(' | '));stamp('Avisos IPMA',t,old);
 ipmaData=await (await fetch('data/ipma-areas.geojson')).json();if(map.getSource('view'))addIPMA();
 map.on('click','ipma-fill',e=>{const hit=map.queryRenderedFeatures(e.point,{layers:['view-cl','view-pt','mon-cl','mon-pt','hosp-pt','pharm-pt'].filter(l=>map.getLayer(l))});if(hit.length)return;const f=e.features[0];new maplibregl.Popup().setLngLat(e.lngLat).setHTML(warnHTML(f.properties.a)+'<br><small>Zonas aproximadas (traçado indicativo)</small>').addTo(map)})}
let grid=[];
async function loadGrid(){const u=`${OM}?latitude=${GRID.map(g=>g[1])}&longitude=${GRID.map(g=>g[2])}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,precipitation&hourly=precipitation_probability,precipitation&forecast_hours=6&timezone=Atlantic%2FMadeira`;
 const {j,t,old}=await getJSON('grid',u);grid=(Array.isArray(j)?j:[j]);stamp('Tempo Open-Meteo',t,old);
 grid.forEach((p,i)=>{const c=p.current;console.log('[Open-Meteo]',GRID[i][0],c.time,c.temperature_2m+'°C',c.wind_speed_10m+' km/h rajada '+c.wind_gusts_10m,c.precipitation+'mm');
  mk('wx',GRID[i][2],GRID[i][1],`${Math.round(c.temperature_2m)}°<br><small>${Math.round(c.wind_speed_10m)} km/h</small>`,'background:#0b2e4fee;color:#fff;border:2px solid #8fd3ff;border-radius:10px;padding:2px 6px;text-align:center;font-weight:700;font-size:15px;line-height:1.1',()=>new maplibregl.Popup().setLngLat([GRID[i][2],GRID[i][1]]).setHTML(`<b>${GRID[i][0]}</b><br>${c.temperature_2m} °C · vento ${c.wind_speed_10m} km/h (rajadas ${c.wind_gusts_10m})<br>chuva ${c.precipitation} mm<br><small>Open-Meteo, ${c.time}</small>`).addTo(map))})}
let wave=null,waveZ='',me=null;
async function loadMarine(){const pts=[[32.63,-16.92,'a sul'],[32.86,-16.95,'a norte'],[32.70,-17.15,'a oeste'],[33.04,-16.36,'no Porto Santo']];const {j,t,old}=await getJSON('marine',`${MAR}?latitude=${pts.map(p=>p[0])}&longitude=${pts.map(p=>p[1])}&current=wave_height&timezone=Atlantic%2FMadeira`);
 const arr=(Array.isArray(j)?j:[j]).map((x,i)=>({v:x.current&&x.current.wave_height,z:pts[i][2]})).filter(o=>o.v!=null);const a=arr.map(o=>o.v);wave=a.length?Math.max(...a):null;waveZ=wave==null?'':arr.find(o=>o.v===wave).z;console.log('[Marine] ondulação (m):',a.join(', '));stamp('Ondulação Open-Meteo Marine',t,old)}
// REGRAS DE EXEMPLO — a validar com guias
const nf=(v,d=0)=>Number(v).toLocaleString('pt-PT',{maximumFractionDigits:d});
function decide(){const pts=grid.map((p,i)=>({z:GRID[i][0],gust:p.current.wind_gusts_10m,rain:p.current.precipitation,rain6:(p.hourly.precipitation||[]).reduce((s,v)=>s+(v||0),0),pop:Math.max(0,...(p.hourly.precipitation_probability||[0]).map(v=>v||0))}));
 const W=k=>pts.reduce((a,b)=>b[k]>a[k]?b:a);const G=W('gust'),R1=W('rain'),R6=W('rain6'),P=W('pop');const gust=G.gust,rain=R1.rain,rain6=R6.rain6,pop=P.pop;
 const all=['MCN','MCS','MRM'].flatMap(areaWarn),rainW=maxLv(all,['Precipita','Trovoada']),windW=maxLv(all,['Vento']),seaW=maxLv(all,['Agitação']);
 const wz=t=>{const w=all.filter(x=>t.some(k=>x.awarenessTypeName.includes(k))&&x.awarenessLevelID!=='green')[0];return w?AREAS[w.idAreaAviso]:''};
 const txt={gust:`rajadas até ${nf(gust)} km/h (${G.z})`,rain6:rain6<0.1?'sem chuva prevista nas próximas 6 h':`${nf(rain6,1)} mm de chuva previstos em 6 h em ${R6.z}`,pop:`${nf(pop)} % de probabilidade de chuva em ${P.z}`,rain:`a chover agora em ${R1.z}`,wave:wave==null?'sem dados de ondulação':`ondas de ${nf(wave,1)} m ${waveZ}`,rainW:`aviso IPMA ${LVN[rainW]} de chuva (${wz(['Precipita','Trovoada'])})`,windW:`aviso IPMA ${LVN[windW]} de vento (${wz(['Vento'])})`,seaW:`aviso IPMA ${LVN[seaW]} de agitação marítima (${wz(['Agitação'])})`};
 // cada atividade: [nome, regras vermelhas, regras amarelas, valor mostrado se seguro, explicação]
 const A=[
  ['Canyoning',[[rainW>=1,'rainW'],[rain6>=10,'rain6']],[[rain6>=2,'rain6'],[pop>=50,'pop']],'rain6','Vermelho: aviso IPMA de chuva/trovoada ≥ amarelo ou chuva 6 h ≥ 10 mm. Amarelo: chuva 6 h ≥ 2 mm ou probabilidade ≥ 50 %.'],
  ['Trilhos/Levadas',[[rainW>=2,'rainW'],[windW>=2,'windW'],[gust>=70,'gust']],[[rainW>=1,'rainW'],[windW>=1,'windW'],[gust>=45,'gust'],[rain6>=5,'rain6']],'gust','Vermelho: aviso de chuva ou vento ≥ laranja ou rajadas ≥ 70 km/h. Amarelo: aviso amarelo, rajadas ≥ 45 km/h ou chuva 6 h ≥ 5 mm.'],
  ['Mar/Coasteering',[[seaW>=1,'seaW'],[(wave??0)>=2,'wave']],[[(wave??0)>=1.2,'wave'],[windW>=1,'windW'],[wave==null,'wave']],'wave','Vermelho: aviso de agitação marítima ≥ amarelo ou ondas ≥ 2 m. Amarelo: ondas ≥ 1,2 m ou aviso de vento.'],
  ['Escalada',[[gust>=60,'gust'],[rain>=1,'rain'],[rainW>=1,'rainW']],[[gust>=35,'gust'],[rain>0,'rain'],[pop>=40,'pop']],'gust','Vermelho: rajadas ≥ 60 km/h, chuva ≥ 1 mm ou aviso de chuva. Amarelo: rajadas ≥ 35 km/h, alguma chuva ou probabilidade ≥ 40 %.']];
 const T={g:'Dá',y:'Atenção',r:'Não dá'};
 const res=A.map(([n,r,y,ok,why])=>{const hr=r.find(x=>x[0]),hy=y.find(x=>x[0]);const l=hr?'r':hy?'y':'g';const k=(hr||hy||[0,ok])[1];return{n,l,line:`${T[l]}: ${txt[k]}`,why}});
 res.forEach(o=>console.log('[Regra]',o.n,o.line));
 document.getElementById('acts').innerHTML=res.map(o=>`<li><div class="line"><span class="dot ${o.l}" aria-hidden="true"></span><b>${o.n}</b></div><p class="why">${esc(o.line)}</p><details><summary>Como é calculado?</summary>${o.why}</details></li>`).join('')+'<li id="near"></li>';
 document.getElementById('chips').innerHTML=res.map(o=>`<span class="chip"><i class="${o.l}"></i>${o.n.split('/')[0]}: ${T[o.l]}</span>`).join('');
 document.getElementById('chips').setAttribute('aria-label',res.map(o=>o.n+': '+o.line).join('. '));
 document.getElementById('ddtime').textContent='Calculado às '+hhmm(Date.now())+' com dados IPMA + Open-Meteo (pior valor da ilha).';near()}
function near(){const el=document.getElementById('near');if(!el||!me||!grid.length)return;let b=0,bd=1e9;GRID.forEach((g,i)=>{const d=(g[1]-me[1])**2+((g[2]-me[0])*Math.cos(g[1]*Math.PI/180))**2;if(d<bd){bd=d;b=i}});const c=grid[b].current,r6=(grid[b].hourly.precipitation||[]).reduce((s,v)=>s+(v||0),0);
 el.innerHTML=`<p class="why">📍 Perto de si (${esc(GRID[b][0])}): ${nf(c.temperature_2m)} °C, rajadas ${nf(c.wind_gusts_10m)} km/h, chuva 6 h ${nf(r6,1)} mm</p>`}
const OSM_DATE='14-10-2026';
const LBL='dados OSM de '+OSM_DATE;
const LAYERS={view:['view-cl','view-cn','view-pt'],mon:['mon-cl','mon-cn','mon-pt'],hosp:['hosp-pt'],pharm:['pharm-pt'],ipma:['ipma-fill','ipma-line']};
let ipmaData=null;
function vis(g){const cb=document.querySelector(`[data-l=${g}]`);return cb&&cb.checked?'visible':'none'}
function addOSM(){if(map.getSource('view'))return;
 for(const [id,file,col] of [['view','data/miradouros.geojson','#1e88e5'],['mon','data/monumentos.geojson','#8e24aa']]){
  map.addSource(id,{type:'geojson',data:new URL(file,location.href).href,cluster:true,clusterRadius:45,clusterMaxZoom:14});
  map.addLayer({id:id+'-cl',type:'circle',source:id,filter:['has','point_count'],layout:{visibility:vis(id)},paint:{'circle-color':col,'circle-opacity':.85,'circle-stroke-color':'#fff','circle-stroke-width':2,'circle-radius':['step',['get','point_count'],14,10,18,50,24]}});
  map.addLayer({id:id+'-cn',type:'symbol',source:id,filter:['has','point_count'],layout:{visibility:vis(id),'text-field':['get','point_count_abbreviated'],'text-size':13,'text-font':['Noto Sans Bold']},paint:{'text-color':'#fff'}});
  map.addLayer({id:id+'-pt',type:'circle',source:id,filter:['!',['has','point_count']],layout:{visibility:vis(id)},paint:{'circle-color':col,'circle-radius':8,'circle-stroke-color':'#fff','circle-stroke-width':2}});
  map.on('click',id+'-cl',async e=>{const f=e.features[0];const z=await map.getSource(id).getClusterExpansionZoom(f.properties.cluster_id);map.easeTo({center:f.geometry.coordinates,zoom:z})});
  map.on('click',id+'-pt',e=>{const f=e.features[0],p=f.properties,[lon,lat]=f.geometry.coordinates;ficha({name:p.name||(id==='view'?'Miradouro (sem nome)':'Monumento'),lat,lon,tags:p,osm:p.osm})});
  for(const l of [id+'-cl',id+'-pt']){map.on('mouseenter',l,()=>map.getCanvas().style.cursor='pointer');map.on('mouseleave',l,()=>map.getCanvas().style.cursor='')}}
 map.addSource('svc',{type:'geojson',data:new URL('data/servicos.geojson',location.href).href});
 for(const [g,am,col] of [['hosp','hospital','#d32f2f'],['pharm','pharmacy','#2e7d32']]){
  map.addLayer({id:g+'-pt',type:'circle',source:'svc',filter:['==',['get','amenity'],am],layout:{visibility:vis(g)},paint:{'circle-color':col,'circle-radius':8,'circle-stroke-color':'#fff','circle-stroke-width':2}});
  map.on('click',g+'-pt',e=>{const p=e.features[0].properties;new maplibregl.Popup().setLngLat(e.features[0].geometry.coordinates).setHTML(`<b>${esc(p.name||'(sem nome)')}</b>${p.phone?'<br>☎ <a href="tel:'+esc(p.phone)+'">'+esc(p.phone)+'</a>':''}${p.opening_hours?'<br>'+esc(p.opening_hours):''}<br><small>OpenStreetMap · ${LBL}</small>`).addTo(map)})}
 addIPMA();S['Miradouros/monumentos/serviços']=LBL;stamp('Miradouros/monumentos/serviços',0);document.getElementById('osmdate').textContent='Pontos de interesse: '+LBL+' (ficheiros estáticos). Zonas de aviso IPMA: zonas aproximadas.'}
function addIPMA(){if(!ipmaData||!map.getSource||map.getSource('ipma'))return;
 ipmaData.features.forEach(f=>f.properties.lv=maxLv(areaWarn(f.properties.a)));
 const before=map.getLayer('view-cl')?'view-cl':undefined;
 map.addSource('ipma',{type:'geojson',data:ipmaData});
 map.addLayer({id:'ipma-fill',type:'fill',source:'ipma',layout:{visibility:vis('ipma')},paint:{'fill-color':['match',['get','lv'],1,LVC[1],2,LVC[2],3,LVC[3],LVC[0]],'fill-opacity':['match',['get','lv'],0,.18,.38]}},before);
 map.addLayer({id:'ipma-line',type:'line',source:'ipma',layout:{visibility:vis('ipma')},paint:{'line-color':'#0b2e4f','line-width':2,'line-dasharray':[3,2]}},before)}
async function wiki(tags){let t=null;if(tags.wikipedia){const [l,...r]=tags.wikipedia.split(':');if(l==='pt')t=r.join(':')}
 if(!t&&tags.wikidata){try{const d=await (await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${tags.wikidata}&props=sitelinks&sitefilter=ptwiki&format=json&origin=*`)).json();t=d.entities[tags.wikidata].sitelinks?.ptwiki?.title}catch(e){}}
 if(!t)return null;const s=await (await fetch('https://pt.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent(t.replace(/ /g,'_')))).json();return s.extract?s:null}
const NSP_HIST=`<div class="box"><b>📜 História</b><p>O monumento fica no Terreiro da Luta, freguesia do Monte, no Funchal. Nasceu de uma promessa feita após os bombardeamentos do Funchal por submarinos alemães em 1917, durante a I Guerra Mundial. A obra deve-se à iniciativa do padre José Marques Jardim, pároco do Monte, que chegou a ir ao estrangeiro angariar donativos. A primeira pedra foi lançada em 1923 e o monumento foi inaugurado a 14 de agosto de 1927, Dia de Nossa Senhora do Monte. Na base, um rosário feito com correntes de navios afundados nos ataques ao porto do Funchal lembra a sua origem.</p>
<small>Fontes (consultadas a 14-10-2026): Wikipédia PT <a href="https://pt.wikipedia.org/wiki/Santu%C3%A1rio_da_Nossa_Senhora_da_Paz">LINK</a> · Elucidário Madeirense, «Terreiro da Luta» <a href="https://elucidariomadeirense.pt/pt/a/terreiro-da-luta/">LINK</a> · Visit Funchal (CM Funchal) <a href="https://visit.funchal.pt/item/monumento-a-nossa-senhora-da-paz/">LINK</a> · Paróquia do Monte <a href="https://pnsmonte.pt/2024/01/09/santuario-de-nossa-senhora-da-paz/">LINK</a></small></div>`;
async function ficha(p){const sh=document.getElementById('sheet'),c=document.getElementById('sheetc');sh.hidden=false;sh.scrollTop=0;
 c.innerHTML=`<h3>${p.featured?'⭐ ':''}${esc(p.name)}</h3><div id="fs" class="status y"><span class="dot y"></span>A ler o tempo…</div><div id="fw"></div><div id="fa" class="box"></div><div id="fwk"></div>${p.featured?NSP_HIST.replace('<div class="box"><b>📜 História</b>','<details><summary>📜 História</summary>').replace(/<\/div>$/,'</details>'):''}
 <p>🔗 Elucidário Madeirense (pesquisa): <a target="_blank" rel="noopener" href="https://elucidariomadeirense.pt/?s=${encodeURIComponent(p.name)}">LINK</a></p>
 <p>📍 ${p.lat.toFixed(5)}, ${p.lon.toFixed(5)} · <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=17/${p.lat}/${p.lon}">OSM</a>${p.osm?` <small>(${esc(p.osm)}, ${LBL})</small>`:''}</p>`;
 try{const {j,t,old}=await getJSON('pt_'+p.lat+p.lon,`${OM}?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,cloud_cover&timezone=Atlantic%2FMadeira`);const w=j.current;
  console.log('[Ficha]',p.name,w.time,w.temperature_2m,w.wind_speed_10m,w.precipitation);
  const a=regionOf(p.lon,p.lat)||region(p.lat,p.lon,j.elevation),wl=maxLv(areaWarn(a));
  const l=wl>=2||w.wind_gusts_10m>=70?'r':wl>=1||w.wind_gusts_10m>=45||w.precipitation>=0.5?'y':'g';
  const why=wl>=1?`aviso IPMA ${LVN[wl]} nesta zona`:w.wind_gusts_10m>=45?`rajadas de ${nf(w.wind_gusts_10m)} km/h`:w.precipitation>=0.5?`a chover (${nf(w.precipitation,1)} mm)`:'sem avisos e vento fraco a moderado';
  document.getElementById('fs').className='status '+l;document.getElementById('fs').innerHTML=`<span class="dot ${l}"></span>${{g:'Seguro agora',y:'Atenção',r:'Não recomendado agora'}[l]}: ${why}`;
  document.getElementById('fw').innerHTML=`<div class="nums"><div>🌡️<b>${nf(w.temperature_2m)} °C</b>temperatura</div><div>💨<b>${nf(w.wind_gusts_10m)}</b>rajadas km/h</div><div>🌧️<b>${nf(w.precipitation,1)} mm</b>chuva agora</div><div>☁️<b>${nf(w.cloud_cover)} %</b>nuvens</div></div><small class="${ageCls(t)}">${old?'⚠ ':''}Lido às ${hhmm(t)} · Open-Meteo (vento médio ${nf(w.wind_speed_10m)} km/h, altitude do modelo ${j.elevation} m)</small>`;
  document.getElementById('fa').innerHTML='⚠️ Aviso IPMA — '+warnHTML(a)+' <button class="info" aria-label="Sobre a zona" title="Zona de aviso atribuída de forma aproximada (zonas aproximadas).">i</button><small class="infot" hidden><br>Zona de aviso atribuída de forma aproximada (zonas aproximadas).</small>';
  const ib=c.querySelector('.info');ib.onclick=()=>{const s=c.querySelector('.infot');s.hidden=!s.hidden}}catch(e){document.getElementById('fs').innerHTML='<span class="dot y"></span>Tempo indisponível'}
 if(p.tags&&!p.featured){try{const s=await wiki(p.tags);if(s){console.log('[Wiki]',s.title);document.getElementById('fwk').innerHTML=`<details><summary>📖 Wikipédia: ${esc(s.title)}</summary><p>${esc(s.extract)}</p><small>Wikipédia PT (CC BY-SA) <a target="_blank" rel="noopener" href="${esc(s.content_urls.desktop.page)}">LINK</a></small></details>`}}catch(e){}}}
document.getElementById('close').onclick=()=>document.getElementById('sheet').hidden=true;
nspM=mk('mon',NSP.lon,NSP.lat,'⭐','font-size:30px;cursor:pointer;text-shadow:0 0 4px #000',()=>ficha(NSP));
window.ficha=ficha;window.NSP=NSP;
(async()=>{await Promise.allSettled([loadIPMA(),loadGrid(),loadMarine()]);try{decide()}catch(e){console.log('decide falhou',e)}window.READY=1})();
addEventListener('offline',()=>{const b=document.getElementById('offline');b.hidden=false;b.textContent='Sem rede – dados de '+hhmm(+localStorage.getItem('t_grid')||Date.now())});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
if(!navigator.onLine)dispatchEvent(new Event('offline'));


document.getElementById('chips').addEventListener('click',()=>{const d=document.getElementById('dd');d.open=true;document.getElementById('chips').setAttribute('aria-expanded','true');d.scrollIntoView({block:'start'})});
document.getElementById('dd').addEventListener('toggle',e=>document.getElementById('chips').setAttribute('aria-expanded',String(e.target.open)));
if(matchMedia('(min-width:900px)').matches)document.getElementById('dd').open=true;
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,8000)}
document.getElementById('share').onclick=()=>{if(!navigator.geolocation)return toast('Localização não disponível neste dispositivo.');toast('A obter a sua localização…');
 navigator.geolocation.getCurrentPosition(async pos=>{const la=pos.coords.latitude.toFixed(5),lo=pos.coords.longitude.toFixed(5),u=`https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=17/${la}/${lo}`,txt=`A minha localização: ${la}, ${lo} (±${Math.round(pos.coords.accuracy)} m)`;
  me=[+lo,+la];near();
  if(navigator.share){try{await navigator.share({title:'A minha localização',text:txt,url:u});return toast('Localização partilhada.')}catch(e){if(e.name==='AbortError')return toast('Partilha cancelada.')}}
  try{await navigator.clipboard.writeText(txt+' '+u);toast('Copiado: '+txt+' '+u)}catch(e){toast(txt+' '+u)}},
  e=>toast('Não foi possível obter a localização ('+e.message+'). Em emergência ligue 112.'),{enableHighAccuracy:true,timeout:15000})};
