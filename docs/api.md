---
layout: default
title: API
nav_order: 4
---

# Basic usage

```javascript
  /**
   * @param {object} vector layer
   * @param {string} text the xml text
   * apply sld
   */
  function applySLD(vectorLayer, text) {
    const sldObject = SLDReader.Reader(text);    
    const sldLayer = SLDReader.getLayer(sldObject);
    const style = SLDReader.getStyle(sldLayer, 'bestuurlijkegrenzen:provincies');
    const featureTypeStyle = style.featuretypestyles[0];

    const viewProjection = map.getView().getProjection();
    vectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
      // Use the convertResolution option to calculate a more accurate resolution.
      convertResolution: viewResolution => {
        const viewCenter = map.getView().getCenter();
        return ol.proj.getPointResolution(viewProjection, viewResolution, viewCenter);
      },
      // If you use point icons with an ExternalGraphic, you have to use imageLoadCallback to
      // to update the vector layer when an image finishes loading.
      // If you do not do this, the image will only become visible after the next pan/zoom of the layer.
      imageLoadedCallback: () => {
        vectorLayer.changed();
      },
    }));
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

  applySLD(vectorLayer, mySLDString);
```

{% include_relative apigen.md %}
