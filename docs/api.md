---
layout: default
title: API
---

# Basic usage

```javascript
/**
 * @param {object} vector layer
 * @param {string} text the xml text
 * @param {number} pointresolution the projected resolution
 * apply sld
 */
function applySLD(vector, text, pointresolution) {
  const sldObject = SLDReader.Reader(text);
  const sldLayer = SLDReader.getLayer(sldObject);
  const style = SLDReader.getStyle(sldLayer, 'bestuurlijkegrenzen:provincies');
  const format = new ol.format.GeoJSON();
  vector.setStyle(feature => {
    const geojson = JSON.parse(format.writeFeature(feature));
    const rules = SLDReader.getRules(
      style.featuretypestyles['0'],
      geojson,
      pointresolution
    );
    return SLDReader.OlStyler(SLDReader.getGeometryStyles(rules), geojson);
  });
}

const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: 'assets/provincies.json',
  strategy: ol.loadingstrategy.bbox,
});

const vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2,
    }),
  }),
});

const pointresolution = ol.proj.getPointResolution(map.getView().getProjection(), map.getView().getResolution(), map.getView().getCenter());

applySLD(vectorLayer, mySLDString, pointresolution);

```

{% include_relative apigen.md %}
