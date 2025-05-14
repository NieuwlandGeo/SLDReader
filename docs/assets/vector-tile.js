/* global ol SLDReader CodeMirror */
// the xml editor
const editor = CodeMirror.fromTextArea(document.getElementById('sld'), {
  lineNumbers: true,
  lineWrapping: true,
  mode: 'xml',
});

// test vector tile layer of zo
const vtLayer = new ol.layer.VectorTile({
  source: new ol.source.VectorTile({
    minZoom: 17,
    maxZoom: 17,
    format: new ol.format.MVT(),
    url: 'https://api.pdok.nl/lv/bgt/ogc/v1/tiles/WebMercatorQuad/{z}/{y}/{x}?f=mvt',
  }),
});

const attribution = new ol.control.Attribution({
  collapsible: false,
  attributions: 'Vector tile data from <a href="https://www.pdok.nl" target="_blank">www.pdok.nl</a>',
});

const map = new ol.Map({
  layers: [vtLayer],
  target: document.getElementById('olmap'),
  view: new ol.View({
    center: [632295, 6793980],
    zoom: 17,
    maxZoom: 17,
    minZoom: 17,
  }),
  controls: ol.control.defaults.defaults({attribution: false}).extend([attribution]),
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

  vtLayer.setStyle(
    SLDReader.createOlStyleFunction(featureTypeStyle, {
      imageLoadedCallback: () => {
        // Signal OpenLayers to redraw the layer when an image icon has loaded.
        // On redraw, the updated symbolizer with the correct image scale will be used to draw the icon.
        vectorLayer.changed();
      },
    })
  );
}

fetch('assets/sld-vector-tile.xml')
  .then(response => response.text())
  .then(text => editor.setValue(text));

/**
 * update map if sld is edited
 */
editor.on('change', cm => {
  applySLD(vtLayer, cm.getValue());
});
