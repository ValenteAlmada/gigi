# Madeira – Tempo & Segurança (protótipo)

Mapa web livre e sem fins comerciais com tempo, avisos e pontos úteis para a Madeira e o Porto Santo.

> ⚠️ **Protótipo. Informação indicativa. Em emergência ligue 112.**
> As regras «Hoje dá ou não dá?» são exemplos e ainda têm de ser validadas por guias locais.

## Como usar
Site estático (HTML/CSS/JS). Basta servir a pasta, por exemplo `python3 -m http.server`, e abrir `http://localhost:8000/`.

## Dados e licenças
- Código: licença MIT (ver `LICENSE`).
- Miradouros, monumentos, hospitais e farmácias: © colaboradores do OpenStreetMap, licença ODbL. Extraídos via Overpass API em 14-10-2026 (`data/*.geojson`).
- Zonas de aviso: polígonos publicados pelo IPMA (`https://www.ipma.pt/bin/file.data/md-ww.geojson`), descarregados a 14-10-2026.
- Avisos meteorológicos: API aberta do IPMA (lidos em direto).
- Previsão e ondulação: Open-Meteo (CC BY 4.0).
- Resumos: Wikipédia em português (CC BY-SA).
- Mapa base: OpenFreeMap / OpenMapTiles, © OpenStreetMap. Biblioteca: MapLibre GL JS (BSD-3).
