/* global ol SLDReader CodeMirror */

// the xml editor
const editor = CodeMirror.fromTextArea(document.getElementById('sld'), {
  lineNumbers: true,
  lineWrapping: true,
  mode: 'xml',
});

const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url: 'assets/spoorwegen-trace.json',
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
    zoom: 8,
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
  window.sldObject = sldObject;
  const sldLayer = SLDReader.getLayer(sldObject);
  const style = SLDReader.getStyle(sldLayer);
  const featureTypeStyle = style.featuretypestyles[0];

  const viewProjection = map.getView().getProjection();
  vectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
    convertResolution: viewResolution => {
      const viewCenter = map.getView().getCenter();
      return ol.proj.getPointResolution(viewProjection, viewResolution, viewCenter);
    },
    imageLoadedCallback: () => {
      // Signal OpenLayers to redraw the layer when an image icon has loaded.
      // On redraw, the updated symbolizer with the correct image scale will be used to draw the icon.
      vectorLayer.changed();
    },
  }));
}

function loadSld(mode) {
  let sldUrl = null;

  switch (mode) {
    case 'DEMO_MARK':
      sldUrl = 'assets/sld-spoorwegen-trace.xml';
      break;
    case 'DEMO_EXTERNALGRAPHIC':
      sldUrl = 'assets/sld-external-graphic-mark.xml';
      break;
    case 'DEMO_POINTPLACEMENT':
      sldUrl = 'assets/sld-graphic-mark-placement.xml';
      break;
    case 'DEMO_ALTERNATING_GRAPHICSTROKE':
      sldUrl = 'assets/sld-alternating-graphicstroke.xml';
      break;
    default:
      console.error('Unimplemented demo --> ', mode);
      break;
  }

  if (sldUrl) {
    fetch(sldUrl)
      .then(response => response.text())
      .then(text => editor.setValue(text));
  }
}

loadSld('DEMO_MARK');

/**
 * update map if sld is edited
 */
editor.on('change', cm => {
  applySLD(vector, cm.getValue());
});

// SLD switch handlers.
const optionMark = document.querySelector('#option-mark').parentElement;
const optionExternalGraphic = document.querySelector('#option-exgraphic').parentElement;
const optionPointPlacement = document.querySelector('#option-pointplacement').parentElement;
const optionAlternatingGraphicStroke = document.querySelector('#option-alternating-graphicstroke').parentElement;

document.querySelectorAll('.option-input input').forEach(inputNode => {
  inputNode.addEventListener('change', evt => {
    if (evt.target.value === 'DEMO_MARK') {
      loadSld('DEMO_MARK');
      optionMark.classList.add('option-checked');
      optionExternalGraphic.classList.remove('option-checked');
      optionPointPlacement.classList.remove('option-checked');
      optionAlternatingGraphicStroke.classList.remove('option-checked');
    } else if (evt.target.value === 'DEMO_EXTERNALGRAPHIC') {
      loadSld('DEMO_EXTERNALGRAPHIC');
      optionMark.classList.remove('option-checked');
      optionExternalGraphic.classList.add('option-checked');
      optionPointPlacement.classList.remove('option-checked');
      optionAlternatingGraphicStroke.classList.remove('option-checked');
    } else if (evt.target.value === 'DEMO_POINTPLACEMENT') {
      loadSld('DEMO_POINTPLACEMENT');
      optionMark.classList.remove('option-checked');
      optionExternalGraphic.classList.remove('option-checked');
      optionPointPlacement.classList.add('option-checked');
      optionAlternatingGraphicStroke.classList.remove('option-checked');
    } else if (evt.target.value === 'DEMO_ALTERNATING_GRAPHICSTROKE') {
      loadSld('DEMO_ALTERNATING_GRAPHICSTROKE');
      optionMark.classList.remove('option-checked');
      optionExternalGraphic.classList.remove('option-checked');
      optionPointPlacement.classList.remove('option-checked');
      optionAlternatingGraphicStroke.classList.add('option-checked');
    }
  });
});
