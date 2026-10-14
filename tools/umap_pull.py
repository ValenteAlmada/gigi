# Descarrega todas as camadas do mapa uMap 1472181 para prototipo/data/umap
import json,urllib.request,re,unicodedata,collections,colorsys,datetime,zoneinfo
D='/workspace/bettybot/meteo/prototipo/data/umap/'
m=json.load(urllib.request.urlopen('https://umap.openstreetmap.fr/en/map/1472181/geojson/'))
P=m['properties'];now=datetime.datetime.now(zoneinfo.ZoneInfo('Atlantic/Madeira'))
def r(c): return [r(x) for x in c] if isinstance(c,list) and c and isinstance(c[0],list) else [round(v,5) for v in c]
def grp(s):
  if s.startswith('seguranca'):return 'Segurança'
  if s.startswith('tempo'):return 'Tempo'
  if s.startswith(('montanha','lazer','mar-')):return 'Atividades'
  if s.startswith('natureza') or s=='servicos-agua-potavel':return 'Natureza/Água'
  return 'Outros'
out=[];idx=[];fontes=collections.defaultdict(set);FR=re.compile(r'^\s*(?:📚\s*)?Fontes?\s*:\s*(.+)$',re.M)
for i,l in enumerate(P.get('datalayers') or m['datalayers']):
  g=json.load(urllib.request.urlopen(f'https://umap.openstreetmap.fr/en/datalayer/1472181/{l["id"]}/'))
  o=g.get('_umap_options',{});n=o.get('name','?')
  s=re.sub(r'[^a-z0-9]+','-',unicodedata.normalize('NFKD',n).encode('ascii','ignore').decode().lower()).strip('-')
  fs=[]
  for f in g.get('features',[]):
    if not f.get('geometry') or not f['geometry'].get('coordinates'):continue
    p=f.get('properties',{});d=p.get('description') or ''
    for x in FR.findall(d):fontes[n].add(x.strip())
    f={'type':'Feature','geometry':{'type':f['geometry']['type'],'coordinates':r(f['geometry']['coordinates'])},'properties':{'name':p.get('name') or '','description':d}}
    fs.append(f);c=f['geometry']['coordinates']
    while isinstance(c[0],list):c=c[0]
    if f['properties']['name']:idx.append([f['properties']['name'],i,c[0],c[1]])
  json.dump({'type':'FeatureCollection','features':fs},open(D+s+'.geojson','w'),ensure_ascii=False,separators=(',',':'))
  h=(i*0.618)%1;R,G,B=colorsys.hls_to_rgb(h,.45,.75);live='⟳' in n;base=n.replace('⟳','').strip()
  out.append(dict(id='u'+str(i),slug=s,name=n,label=(base.split(' · ',1)[1] if ' · ' in base else base)+(' ⟳' if live else ''),group=grp(s),count=len(fs),types=dict(collections.Counter(x['geometry']['type'] for x in fs)),color='#%02x%02x%02x'%(int(R*255),int(G*255),int(B*255)),live=live,umapColor=o.get('color'),umapIcon=o.get('iconClass') or o.get('iconUrl'),note=(o.get('description') or '').strip(),datalayer=l['id']))
meta={'read':now.strftime('%Y-%m-%dT%H:%M:%S%z'),'readLabel':now.strftime('%d/%m %H:%M'),'mapName':P.get('name'),'licence':P.get('licence'),'mapDescription':P.get('description'),'layers':out,'fontes':{k:sorted(v) for k,v in fontes.items()}}
json.dump(meta,open(D+'layers.json','w'),ensure_ascii=False,indent=1)
json.dump(idx,open(D+'search.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(out),sum(x['count'] for x in out),meta['readLabel'],P.get('licence'));print(json.dumps(meta['fontes'],ensure_ascii=False)[:3000]);print((P.get('description') or '')[:1500])
