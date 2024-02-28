---
layout: default
title: API
nav_order: 999
---

# Basic usage

### Applying an SLD to a layer as a style function
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
      // If you use point icons with an ExternalGraphic, you have to use imageLoadCallback
      // to update the vector layer when an image finishes loading.
      // If you do not do this, the image will only be visible after next layer pan/zoom.
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

### Extracting static OpenLayers styles for a specific geometry type from an SLD rule
```javascript
const sldObject = SLDReader.Reader(sldXml);
const sldLayer = SLDReader.getLayer(sldObject);
const style = SLDReader.getStyle(sldLayer);
const featureTypeStyle = style.featuretypestyles[0];

// There can be more than one symbolizer of a given type inside a style rule,
// therefore getOlStyle always returns an array of OpenLayers style instances.
// Valid geometry types are 'Point', 'LineString', and 'Polygon'.
const lineStyles = SLDReader.createOlStyle(featureTypeStyle.rules[0], 'LineString');

vectorLayer.setStyle(lineStyles);
```

{% include_relative apigen.md %}
