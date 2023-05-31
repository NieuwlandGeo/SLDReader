/* global ol SLDReader CodeMirror */
// the xml editor
const editor = CodeMirror.fromTextArea(document.getElementById('sld'), {
  lineNumbers: true,
  lineWrapping: true,
  mode: 'xml',
});

const fmtGeoJSON = new ol.format.GeoJSON();

const randomGeoJSON = {
  type: 'FeatureCollection',
  features: [],
};

const weightedRandomColor = (r, g, b) => {
  const rr = Math.floor((256 * Math.random() + r) / 2);
  const rg = Math.floor((256 * Math.random() + g) / 2);
  const rb = Math.floor((256 * Math.random() + b) / 2);
  // eslint-disable-next-line no-bitwise
  const colorInt = rb + (rg << 8) + (rr << 16);
  return `#${colorInt.toString(16)}`;
};

const numFeatures = 10;
for (let k = 0; k < numFeatures; k += 1) {
  const randomPointFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [1.4e6 * (Math.random() - 0.5), 7e5 * (Math.random() - 0.5)],
    },
    properties: {
      geometryType: 'Point',
      myFillColor: weightedRandomColor(255, 0, 0),
      myFillOpacity: 0.5 + 0.5 * Math.random(),
      myStrokeColor: weightedRandomColor(128, 0, 0),
      myStrokeWidth: 2 + 2 * Math.random(),
      myStrokeOpacity: 0.8 + 0.2 * Math.random(),
    },
  };
  randomGeoJSON.features.push(randomPointFeature);
}

const randomFeatures = fmtGeoJSON.readFeatures(randomGeoJSON);

const vectorSource = new ol.source.Vector({
  features: randomFeatures,
});

window._feat = randomFeatures[0];

const vector = new ol.layer.Vector({
  source: vectorSource,
});

const map = new ol.Map({
  layers: [vector],
  target: document.getElementById('olmap'),
  view: new ol.View({
    center: [0, 0],
    maxZoom: 19,
    zoom: 6,
  }),
});
map.addControl(new ol.control.MousePosition());

/**
 * @param {object} vector layer
 * @param {string} text the xml text
 * apply sld
 */
function applySLD(vectorLayer, text) {
  const sldObject = SLDReader.Reader(text);
  // for debugging
  window.sldObject = sldObject;
  const sldLayer = SLDReader.getLayer(sldObject);
  const style = SLDReader.getStyle(sldLayer);
  const featureTypeStyle = style.featuretypestyles[0];

  vectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
    imageLoadedCallback: () => {
      // Signal OpenLayers to redraw the layer when an image icon has loaded.
      // On redraw, the updated symbolizer with the correct image scale will be used to draw the icon.
      vectorLayer.changed();
    },
  }));
}

fetch('assets/sld-dynamic-styling.xml')
  .then(response => response.text())
  .then(text => editor.setValue(text));

/**
 * update map if sld is edited
 */
editor.on('change', cm => {
  applySLD(vector, cm.getValue());
});
