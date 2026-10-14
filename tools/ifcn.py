"""Estado oficial dos percursos pedestres recomendados (página pública do IFCN)."""
import re,html,urllib.request
URL='https://ifcn.madeira.gov.pt/pt/atividades-de-natureza/percursos-pedestres-recomendados/percursos-pedestres-recomendados.html'
def estados():
  t=urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'gigi-meteo-madeira'}),timeout=60).read().decode('utf-8','ignore')
  x=re.sub(r'<script.*?</script>|<style.*?</style>','',t,flags=re.S);x=html.unescape(re.sub(r'<[^>]+>','\n',x))
  L=[l.strip() for l in x.split('\n') if l.strip()]
  i=L.index('ESTADO') if 'ESTADO' in L else 0;out={};cur=None
  for l in L[i:]:
    if re.fullmatch(r'\d+(\.\d+)?',l):
      k='PR '+l
      if k in out:k='PS '+k  # Porto Santo repete a numeração
      cur={'pr':k,'nome':None,'estado':None,'nota':[]};out[k]=cur;continue
    if not cur:continue
    if cur['nome'] is None:cur['nome']=l;continue
    if cur['estado'] is None and re.fullmatch(r'[A-ZÇÃÁÉÍÓÚÂÊÔ /\-]{5,}',l) and re.search(r'ABERT|ENCERR|FECHAD|PARCIAL|CONDICION',l):cur['estado']=l.capitalize();continue
    if cur['estado'] and len(cur['nota'])<4:cur['nota'].append(l)
  return {k:{'estado':v['estado'],'nome':v['nome'],'nota':(re.findall(r'\([^)]{5,200}\)',' '.join(v['nota']))or[''])[0]} for k,v in out.items() if v['estado']}
if __name__=='__main__':
  import json;e=estados();print(len(e));import collections;print(collections.Counter(v['estado'] for v in e.values()));print(list(e.items())[:2])
