'use strict';
// Barra lateral esquerda: secções em acordeão (estado guardado), recolher para trilho; gaveta no telemóvel.
// Pesquisa + faixa de estado/DETALHES lado a lado no topo.
(function(){const P=document.getElementById('hudpanel'),wrap=document.getElementById('mapwrap');if(!P||!wrap)return;
 const ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
 const mob=()=>matchMedia('(max-width:899px)').matches;
 document.body.classList.add('sb');
 // botão de recolher/abrir
 const t=document.createElement('button');t.id='sbtog';t.type='button';t.setAttribute('aria-controls','hudpanel');document.body.appendChild(t);
 const setOpen=o=>{document.body.classList.toggle('sb-off',!o);t.setAttribute('aria-expanded',String(o));t.textContent=o?(mob()?'✕ Fechar menu':'◂ Recolher'):'☰ Menu';t.setAttribute('aria-label',o?'Fechar menu lateral':'Abrir menu lateral');if(!mob())ls.set('sb',o?'1':'0');setTimeout(()=>window.map&&map.resize(),0)};
 setOpen(mob()?false:ls.get('sb')!=='0');
 t.addEventListener('click',()=>setOpen(document.body.classList.contains('sb-off')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mob()&&!document.body.classList.contains('sb-off'))setOpen(false)});
 matchMedia('(max-width:899px)').addEventListener('change',()=>setOpen(!mob()&&ls.get('sb')!=='0'));
 // barra de topo: pesquisa + estado
 const top=document.createElement('div');top.id='topbar';const chips=document.getElementById('chips');wrap.appendChild(top);
 const sbox=document.createElement('div');sbox.id='tsearch';top.appendChild(sbox);if(chips)top.appendChild(chips);
 if(chips)chips.addEventListener('click',()=>{if(document.body.classList.contains('sb-off'))setOpen(true)});
 // acordeão: ordem alfabética e estado lembrado
 const st=JSON.parse(ls.get('sbsec')||'{}');
 function arrange(){const ds=[...P.querySelectorAll(':scope>details')];ds.sort((a,b)=>a.querySelector('summary').textContent.trim().localeCompare(b.querySelector('summary').textContent.trim(),'pt'));
  const rules=P.querySelector('.rules');ds.forEach(d=>P.insertBefore(d,rules||null));
  ds.forEach(d=>{if(d.dataset.acc)return;d.dataset.acc=1;if(d.id in st)d.open=!!st[d.id];d.addEventListener('toggle',()=>{st[d.id]=d.open;ls.set('sbsec',JSON.stringify(st))})})}
 function moveSearch(){const s=document.querySelector('#umapbox .usearch'),r=document.getElementById('ures');if(!s||sbox.contains(s))return false;sbox.appendChild(s);if(r)sbox.appendChild(r);return true}
 arrange();let n=0;const iv=setInterval(()=>{arrange();if(moveSearch()||++n>60){arrange();clearInterval(iv)}},500);
})();
