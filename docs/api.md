---
layout: default
title: API
nav_order: 999
---

# Basic usage

### Applying an SLD to a layer as a style function
```javascript
import {
  Reader,
  createOlStyleFunction,
} from '@nieuwlandgeo/sldreader';

// Code below assumes that you already have an sld xml and an OpenLayers vector layer.

// First, parse the SLD XML into an SLD object.
const sldObject = Reader(sldXml);

// This example uses the first FeatureTypeStyle element in the SLD.
const featureTypeStyle = sldObject.layers[0].styles[0].featuretypestyles[0];

// Create a (feature -> [ol styles]) style function from the FeatureTypeStyle.
const styleFunction = createOlStyleFunction(featureTypeStyle);

// Apply the style function to your vector layer.
vectorLayer.setStyle(styleFunction);
```

### Example with options
```javascript
import {
  Reader,
  createOlStyleFunction,
} from '@nieuwlandgeo/sldreader';

import { getPointResolution } from 'ol/proj';

const sldObject = Reader(sldXml, {
  // Default compatibility mode is 'OGC' according to the SLD specification.
  // QGIS mode fixes a few non-standard behaviors to create a style function
  // that will match the style displayed in QGIS.
  compatibilityMode: 'QGIS',
  // Set to 'TextSymbolizer' to convert font symbols to text symbolizers.
  // Font symbolizers are converted to ExternalGraphic by default.
  fontSymbolConversion: 'TextSymbolizer',
});

const styleFunction = createOlStyleFunction(featureTypeStyle, {
  // Use the convertResolution to calculate a resolution in meters per pixel.
  // Use this if you use min- or max scale denominators or non-pixel uom.
  convertResolution: viewResolution => {
    // The map variable is the OpenLayers map containing the vector layer.
    const viewProjection = map.getView().getProjection();
    const viewCenter = map.getView().getCenter();
    return getPointResolution(viewProjection, viewResolution, viewCenter);
  },

  // If you use point icons with an ExternalGraphic, supply a callback
  // to update the vector layer when an image finishes loading.
  // Without this callback, the image icons will stay grey 
  // until you refresh the vector layer by panning or zooming.
  imageLoadedCallback: () => {
    vectorLayer.changed();
  },
});
```

### Extracting static OpenLayers styles for a specific geometry type from an SLD rule
```javascript
// There can be more than one symbolizer of a given type inside a style rule,
// therefore getOlStyle always returns an array of OpenLayers style instances.
// Valid geometry types are 'Point', 'LineString', and 'Polygon'.
const lineStyles = SLDReader.createOlStyle(featureTypeStyle.rules[0], 'LineString');

vectorLayer.setStyle(lineStyles);
```

{% include_relative apigen.md %}
