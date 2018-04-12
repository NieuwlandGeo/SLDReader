/* global ol SLDReader */
const vectorSource = new ol.source.Vector({
  format: new ol.format.GeoJSON(),
  url(extent) {
    return `${'https://geodata.nationaalgeoregister.nl/bestuurlijkegrenzen/wfs?service=WFS&' +
      'version=1.1.0&request=GetFeature&typename=bestuurlijkegrenzen:provincies&' +
      'outputFormat=application/json&srsname=EPSG:3857&' +
      'bbox='}${extent.join(',')},EPSG:3857`;
  },
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

fetch('assets/sld-provincies.xml')
  .then(response => response.text())
  .then(text => {
    const sldObject = SLDReader.Reader(text);
    const sldLayer = SLDReader.getLayer(sldObject, 'bestuurlijkegrenzen:provincies');
    const style = SLDReader.getStyle(sldLayer, 'bestuurlijkegrenzen:provincies');
    const format = new ol.format.GeoJSON();
    vector.setStyle((feature, resolution) => {
      const geojson = JSON.parse(format.writeFeature(feature));
      const rules = SLDReader.getRules(style.featuretypestyles['0'], geojson, resolution * 111034);
      return SLDReader.OlStyler(SLDReader.getGeometryStyles(rules), geojson.geometry.type);
    });
  });
