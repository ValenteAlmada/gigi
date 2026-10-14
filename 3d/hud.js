'use strict';
// HUD e controlos de câmara da versão 3D (só movimentos pedidos pelo utilizador)
(function(){const up=document.getElementById('upd'),hu=document.getElementById('hudupd');
 const sync=()=>{if(up&&hu)hu.textContent=(up.textContent||'—').replace(/^Atualizado às /,'')};
 if(up)new MutationObserver(sync).observe(up,{childList:true,characterData:true,subtree:true});sync();
 const ctl=document.getElementById('hudctl');if(!window.MAP_3D){const t=document.getElementById('tog3d');if(t){t.setAttribute('aria-pressed','false');t.textContent='Vista 2D';t.disabled=true}}
 ctl&&ctl.addEventListener('click',e=>{const b=e.target.closest('[data-cam]');if(!b)return;const c=b.dataset.cam,o={};
  if(c==='rl')o.bearing=map.getBearing()-45;else if(c==='rr')o.bearing=map.getBearing()+45;else if(c==='tu')o.pitch=Math.min(80,map.getPitch()+15);else if(c==='td')o.pitch=Math.max(0,map.getPitch()-15);else if(c==='n')o.bearing=0;
  map.jumpTo(o)})})();
