"""Atualização horária (GitHub Actions): camadas uMap, estações IPMA da Madeira, sismos IPMA.
Escreve data/updated.json só quando algum dado mudou (hora da Madeira com desvio explícito)."""
import json,os,subprocess,urllib.request,datetime,zoneinfo,hashlib,glob
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..');D=os.path.join(R,'data')
TZ=zoneinfo.ZoneInfo('Atlantic/Madeira');UTC=datetime.timezone.utc
def get(u):
  q=urllib.request.Request(u,headers={'User-Agent':'gigi-meteo-madeira (github.com/ValenteAlmada/gigi)'})
  return json.load(urllib.request.urlopen(q,timeout=60))
def dig():
  h=hashlib.sha256()
  for f in sorted(glob.glob(D+'/umap/*.geojson')+[D+'/ipma-estacoes.geojson',D+'/ipma-sismos.geojson',D+'/ifcn-estado.json']):
    if not os.path.exists(f):continue
    if f.endswith('layers.json'):
      m=json.load(open(f));m.pop('read',None);m.pop('readLabel',None);h.update(json.dumps(m,sort_keys=True,ensure_ascii=False).encode())
    else:h.update(open(f,'rb').read())
  return h.hexdigest()
before=dig();errs=[]
try:subprocess.run(['python3',os.path.join(R,'tools','umap_pull.py')],check=True)
except Exception as e:errs.append('umap: '+str(e))
def mad(s):  # IPMA observações: chave em UTC sem desvio
  return datetime.datetime.fromisoformat(s).replace(tzinfo=UTC).astimezone(TZ).isoformat(timespec='minutes')
try:
  st=get('https://api.ipma.pt/open-data/observation/meteorology/stations/stations.json')
  st={str(s['properties']['idEstacao']):s for s in st if 32.3<s['geometry']['coordinates'][1]<33.2 and -17.4<s['geometry']['coordinates'][0]<-16.2}
  ob=get('https://api.ipma.pt/open-data/observation/meteorology/stations/observations.json');fs=[]
  for i,s in sorted(st.items(),key=lambda x:x[1]['properties']['localEstacao']):
    last=None
    for k in sorted(ob,reverse=True):
      v=(ob[k] or {}).get(i)
      if v and v.get('temperatura',-99)!=-99:last=(k,v);break
    if not last:continue
    k,v=last;p={'name':s['properties']['localEstacao'].replace('Madeira, ',''),'hora':mad(k)}
    for a,b in [('temperatura','temp'),('humidade','hum'),('intensidadeVentoKM','vento'),('precAcumulada','chuva'),('pressao','pressao')]:
      x=v.get(a);p[b]=None if x in (None,-99,-99.0) else x
    fs.append({'type':'Feature','geometry':{'type':'Point','coordinates':[round(c,5) for c in s['geometry']['coordinates']]},'properties':p})
  json.dump({'type':'FeatureCollection','features':fs},open(D+'/ipma-estacoes.geojson','w'),ensure_ascii=False,separators=(',',':'))
except Exception as e:errs.append('estações: '+str(e))
try:
  sm=get('https://api.ipma.pt/open-data/observation/seismic/7.json');fs=[]
  for x in sm['data']:
    la,lo=float(x['lat']),float(x['lon'])
    if 29<la<34.5 and -19<lo<-14:
      fs.append({'type':'Feature','geometry':{'type':'Point','coordinates':[lo,la]},'properties':{'name':x.get('obsRegion') or 'Sismo','mag':None if x['magnitud'] in ('-99.0',None) else float(x['magnitud']),'prof':x.get('depth'),'hora':datetime.datetime.fromisoformat(x['time']).replace(tzinfo=UTC).astimezone(TZ).isoformat(timespec='minutes')}})
  fs.sort(key=lambda f:f['properties']['hora'],reverse=True)
  json.dump({'type':'FeatureCollection','features':fs},open(D+'/ipma-sismos.geojson','w'),ensure_ascii=False,separators=(',',':'))
except Exception as e:errs.append('sismos: '+str(e))
try:
  import sys;sys.path.insert(0,os.path.join(R,'tools'));import ifcn
  e=ifcn.estados()
  if len(e)>=20:json.dump({'fonte':ifcn.URL,'percursos':e},open(D+'/ifcn-estado.json','w'),ensure_ascii=False,indent=0,sort_keys=True)
  else:errs.append('IFCN: lista curta')
except Exception as x:errs.append('IFCN: '+str(x))
now=datetime.datetime.now(TZ)
# atualiza a hora se o digesto mudou OU se passaram ≥55 min desde a última (para o site não ficar a cinzento)
prev=json.load(open(D+'/updated.json'))['updated'] if os.path.exists(D+'/updated.json') else None
age=None if not prev else (now-datetime.datetime.fromisoformat(prev)).total_seconds()
if dig()!=before or not prev or (age is not None and age>=55*60):
  json.dump({'updated':now.isoformat(timespec='seconds'),'label':now.strftime('%d/%m %H:%M'),'errors':errs},open(D+'/updated.json','w'),ensure_ascii=False)
  print('mudou',now.isoformat())
else:print('sem alterações')
if errs:print('ERROS',errs)
