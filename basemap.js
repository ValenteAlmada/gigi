'use strict';
// Mapa de fundo: estilos OSM gratuitos sem chave; overlays/relevo repostos em style.load
(function(){
 const GL='https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
 const OSMC='© <a href="https://www.openstreetmap.org/copyright">colaboradores OpenStreetMap</a>';
 const ras=(t,a,mz)=>({version:8,glyphs:GL,sources:{fundo:{type:'raster',tiles:Array.isArray(t)?t:[t],tileSize:256,maxzoom:mz||19,attribution:a}},layers:[{id:'fundo',type:'raster',source:'fundo'}]});
 const OF='https://tiles.openfreemap.org/styles/';
 const abc=(s)=>['a','b','c'].map(h=>s.replace('{s}',h));
 // rótulos em português, ordem alfabética
 window.BASEMAPS=[
  ['cyclosm','Bicicleta (CyclOSM)',()=>ras(abc('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'),'<a href="https://www.cyclosm.org/">CyclOSM</a> · <a href="https://www.openstreetmap.fr/usage/">OSM France</a> · '+OSMC,20)],
  ['bright','Brilhante (OpenFreeMap Bright)',OF+'bright'],
  ['positron','Claro (OpenFreeMap Positron)',OF+'positron'],
  ['dark','Escuro (OpenFreeMap Dark)',OF+'dark'],
  ['fiord','Fiorde azul (OpenFreeMap Fiord)',OF+'fiord'],
  ['hot','Humanitário (HOT)',()=>ras(abc('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'),'Estilo <a href="https://www.hotosm.org/">Humanitarian OSM Team</a> · <a href="https://www.openstreetmap.fr/usage/">OSM France</a> · '+OSMC,20)],
  ['liberty','Liberty (OpenFreeMap)',OF+'liberty'],
  ['osm','OpenStreetMap padrão',()=>ras(['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],OSMC+' · <a href="https://operations.osmfoundation.org/policies/tiles/">política de mosaicos OSMF</a> · <a href="https://www.openstreetmap.org/fixthemap">Reportar erro</a>',19)],
  ['topo','Topográfico (OpenTopoMap)',()=>ras(abc('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'),'Dados: '+OSMC+', SRTM | Estilo: © <a href="https://opentopomap.org/about">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',17)],
  ['opnv','Transportes (ÖPNVKarte)',()=>ras(['https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png'],'<a href="https://www.öpnvkarte.de/">ÖPNVKarte</a> / MeMoMaps · '+OSMC+' · <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>',18)]
 ];
 const byUrl=BASEMAPS.find(b=>typeof b[2]==='string'&&b[2]===(window.MAP_STYLE||''));
 let cur=(byUrl&&byUrl[0])||'dark';
 try{const s=localStorage.getItem('fundo');if(s&&BASEMAPS.some(b=>b[0]===s))cur=s}catch(e){}
 const styleOf=id=>{const b=BASEMAPS.find(x=>x[0]===id);return typeof b[2]==='function'?b[2]():b[2]};
 window.MAP_STYLE=styleOf(cur);window.FUNDO=cur;
 // evita registar o mesmo handler de camada duas vezes após setStyle
 const _on=maplibregl.Map.prototype.on;
 maplibregl.Map.prototype.on=function(t,l,f){if(typeof l==='string'&&typeof f==='function'){const s=this._dl||(this._dl=new Set),k=t+'|'+l;if(s.has(k))return this;s.add(k)}return _on.apply(this,arguments)};
 function panel(){const ref=document.getElementById('layers');if(!ref||document.getElementById('fundo'))return;
  const d=document.createElement('details');d.id='fundo';
  d.innerHTML='<summary><h2>Mapa de fundo</h2></summary><fieldset><legend>Escolha um mapa (dados OpenStreetMap)</legend>'+
   BASEMAPS.map(b=>`<label><input type="radio" name="fundo" value="${b[0]}"${b[0]===cur?' checked':''}> ${b[1]}</label>`).join('')+
   '</fieldset><p class="note">Gratuitos e sem chave API. A atribuição de cada mapa aparece no canto (botão ⓘ). «OpenStreetMap padrão» só para tráfego baixo, com atribuição e Referer (política OSMF). CyclOSM/HOT: uso público sem fins lucrativos e tráfego moderado (<a href="https://www.openstreetmap.fr/usage/">OSM France</a>).</p>';
  ref.after(d);
  d.addEventListener('change',e=>{const inp=e.target;if(!inp||inp.name!=='fundo'||inp.value===window.FUNDO)return;
   window.FUNDO=inp.value;try{localStorage.setItem('fundo',inp.value)}catch(x){}
   const t=document.getElementById('tog3d');window.M3D_OFF=!(t&&t.getAttribute('aria-pressed')==='true');
   if(window.map)window.map.setStyle(styleOf(inp.value))})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',panel);else panel();
})();
