/* global ol SLDReader CodeMirror */
// the xml editor
const editor = CodeMirror.fromTextArea(document.getElementById('sld'), {
  lineNumbers: true,
  lineWrapping: true,
  mode: 'xml',
});

const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: 'assets/benelux.json',
  strategy: ol.loadingstrategy.all,
});

const vector = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    image: new ol.style.Circle({
      radius: 8,
      fill: new ol.style.Fill({
        color: 'gray',
        fillOpacity: 0.7,
      }),
    }),
  }),
});

const map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    vector,
  ],
  target: document.getElementById('olmap'),
  view: new ol.View({
    center: [584891.9698102517, 6734386.479226833],
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
  const style = SLDReader.getStyle(sldLayer, 'flags_benelux');
  const featureTypeStyle = style.featuretypestyles[0];

  vectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
    imageLoadedCallback: () => {
      // Signal OpenLayers to redraw the layer when an image icon has loaded.
      // On redraw, the updated symbolizer with the correct image scale will be used to draw the icon.
      vectorLayer.changed();
    },
  }));
}

fetch('assets/sld-benelux.xml')
  .then(response => response.text())
  .then(text => editor.setValue(text));

/**
 * update map if sld is edited
 */
editor.on('change', cm => {
  applySLD(vector, cm.getValue());
});
