# Madeira – Tempo & Segurança (protótipo)

Mapa web livre e sem fins comerciais com tempo, avisos e pontos úteis para a Madeira e o Porto Santo.

> ⚠️ **Protótipo. Informação indicativa. Em emergência ligue 112.**
> As regras «Hoje dá ou não dá?» são exemplos e ainda têm de ser validadas por guias locais.

## Como usar
Site estático (HTML/CSS/JS). Basta servir a pasta, por exemplo `python3 -m http.server`, e abrir `http://localhost:8000/`.

## Dados e licenças
- Código: licença MIT (ver `LICENSE`).
- Miradouros, monumentos, hospitais e farmácias: © colaboradores do OpenStreetMap, licença ODbL. Extraídos via Overpass API em 14-10-2026 (`data/*.geojson`).
- Zonas de aviso: polígonos publicados pelo IPMA (`https://www.ipma.pt/bin/file.data/md-ww.geojson`), descarregados a 14-10-2026 — zonas aproximadas, licença por confirmar.
- Estações meteorológicas da Madeira e sismos (área Madeira): dados abertos do IPMA (`api.ipma.pt`), atualizados de hora a hora (`data/ipma-estacoes.geojson`, `data/ipma-sismos.geojson`).
- Avisos meteorológicos: API aberta do IPMA (lidos em direto).
- Previsão e ondulação: Open-Meteo (CC BY 4.0).
- Resumos: Wikipédia em português (CC BY-SA).
- Camadas temáticas (46 camadas, 7 579 elementos, agrupadas por categoria e subcategoria em ordem alfabética): cópia estática de 14-10-2026 12:59 (hora da Madeira) do mapa uMap «Meteo Madeira» (https://umap.openstreetmap.fr/pt-pt/map/meteo-madeira-estacoes-e-webcams-teste-1310_1472181), licença ODbL 1.0, dados de base © colaboradores do OpenStreetMap (`data/umap/*.geojson`, índice `data/umap/layers.json`, pesquisa `data/umap/search.json`). As fotos do Wikimedia Commons mantêm o autor e a licença. As camadas ⟳ (vivas no uMap) aparecem a cinzento quando a cópia tem mais de 2 h. Atualização automática de hora a hora (GitHub Actions, `.github/workflows/update.yml` → `tools/update.py`); a hora fica em `data/updated.json` e o site mostra «Atualizado às HH:MM», a cinzento se tiver mais de 90 min.
- Em cada ficha: avisos IPMA lidos em direto e tempo atual Open-Meteo (CC BY 4.0) no ponto, com a hora da leitura.
- Ícone: ilustração própria do projeto.
- Mapa base: OpenFreeMap / OpenMapTiles, © OpenStreetMap. Biblioteca: MapLibre GL JS 4.7.1 (BSD-3), alojada em `vendor/`.

- Estado oficial dos percursos pedestres recomendados: página pública do IFCN, lida de hora a hora (`data/ifcn-estado.json`, `tools/ifcn.py`).

## Fonte de verdade
Este repositório é a fonte de verdade do site.

## Variantes de aspeto
- `/` — aspeto principal
- `/tech/` — tema ardósia/ciano
- `/cypherpunk/` — tema terminal
- `/3d/` — mapa em 3D (terreno Terrain Tiles / AWS Open Data, hillshade, edifícios extrudidos, câmara inclinada). Em dispositivos com WebGL fraco cai para 2D; `?3d=forcar` força o 3D. Atribuição do relevo: Copernicus EU-DEM, USGS SRTM/GMTED2010, NOAA ETOPO1.

## Observatório Oceânico da Madeira (OOM)
O site ponta para https://oom.arditi.pt/ (previsões do mar, THREDDS em https://oomdata.arditi.pt/thredds/). Os dados **não** são copiados para este repositório: nas páginas oficiais não foi encontrada uma licença de reutilização dos dados (só EULAs das apps MadeiraOcean/MadeiraWeather). Ligação em Fontes e nas fichas de praias, mar e canyons.
