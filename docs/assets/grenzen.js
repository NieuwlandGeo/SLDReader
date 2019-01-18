/* global ol SLDReader CodeMirror */
// the xml editor
const editor = CodeMirror.fromTextArea(document.getElementById('sld'), {
  lineNumbers: true,
  lineWrapping: true,
  mode: 'xml',
});

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
    const rules = SLDReader.getRules(style.featuretypestyles['0'], geojson, pointresolution);
    return SLDReader.OlStyler(SLDReader.getGeometryStyles(rules), geojson.geometry.type);
  });
}

const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: 'assets/provincies.json',
  strategy: ol.loadingstrategy.bbox,
});

const vector = new ol.layer.Vector({
  source: vectorSource,
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2,
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
    center: [626172, 6845800],
    maxZoom: 19,
    zoom: 7,
  }),
});
map.addControl(new ol.control.MousePosition());

const pointresolution = ol.proj.getPointResolution(
  map.getView().getProjection(),
  map.getView().getResolution(),
  map.getView().getCenter()
);

fetch('assets/sld-provincies.xml')
  .then(response => response.text())
  .then(text => editor.setValue(text));

/**
 * update map if sld is edited
 */
editor.on('change', cm => {
  applySLD(vector, cm.getValue(), pointresolution);
});
