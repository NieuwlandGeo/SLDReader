/* global ol SLDReader CodeMirror */
// the xml editor
const editor = CodeMirror.fromTextArea(document.getElementById('sld'), {
  lineNumbers: true,
  lineWrapping: true,
  mode: 'xml',
});

const fmtGeoJSON = new ol.format.GeoJSON();

const vectorSource = new ol.source.Vector({});

const vector = new ol.layer.Vector({
  source: vectorSource,
});

const map = new ol.Map({
  layers: [vector],
  target: document.getElementById('olmap'),
  view: new ol.View({
    center: [0, 0],
    maxZoom: 100,
  }),
});
map.addControl(new ol.control.MousePosition());

const geojsonInput = document.getElementById('custom-geojson');

function showGeoJSON() {
  const geoJSON = geojsonInput.value;
  try {
    const features = fmtGeoJSON.readFeatures(geoJSON, {
      dataProjection: 'EPSG:4326',
    });
    vector.getSource().clear();
    vector.getSource().addFeatures(features);
    const extent = vector.getSource().getExtent();
    map.getView().fit(extent);
  } catch (e) {
    console.error('GeoJSON parse error: ', e);
  }
}

geojsonInput.addEventListener('input', () => {
  showGeoJSON();
});

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

  vectorLayer.setStyle(
    SLDReader.createOlStyleFunction(featureTypeStyle, {
      imageLoadedCallback: () => {
        // Signal OpenLayers to redraw the layer when an image icon has loaded.
        // On redraw, the updated symbolizer with the correct image scale will be used to draw the icon.
        vectorLayer.changed();
      },
    })
  );
}

fetch('assets/sld-custom-geojson.xml')
  .then(response => response.text())
  .then(text => editor.setValue(text));

/**
 * update map if sld is edited
 */
editor.on('change', cm => {
  applySLD(vector, cm.getValue());
});
