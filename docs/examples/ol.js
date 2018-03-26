/* global ol SLDReader */

function styleSelector(sldObject) {
  const layer = SLDReader.getLayer(sldObject, 'WaterBodies');
  const styleNames = SLDReader.getStyleNames(layer);
  const chooser = document.getElementById('style_chooser');
  for (let i = 0; i < styleNames.length; i += 1) {
    const newOption = document.createElement('option');
    newOption.value = styleNames[i];
    newOption.text = styleNames[i];
    chooser.add(newOption);
  }
}
// Coords in gml are xy
const proj = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'neu',
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj]);

const sourceurls = [
  'TasmaniaLand.xml',
  'TasmaniaCities.xml',
  'TasmaniaRoads.xml',
  'TasmaniaWaterBodies.xml',
];
const vectorsources = sourceurls.map(
  s =>
    new ol.source.Vector({
      format: new ol.format.GML2(),
      url: s,
    }),
);
const layers = vectorsources.map(
  s =>
    new ol.layer.Vector({
      source: s,
    }),
);

const map = new ol.Map({
  target: 'olmap',
  view: new ol.View({
    center: [145, -44],
    zoom: 12,
    projection: 'EPSG:4326',
  }),
  layers,
});
// var ext = map.getView().calculateExtent();
map.getView().fit([143.8, -44.048828125, 148.5, -40]);
map.addControl(new ol.control.MousePosition());
fetch('sld-tasmania.xml')
  .then(response => response.text())
  .then((text) => {
    const sldObject = SLDReader.Reader(text);
    styleSelector(sldObject);
    layers.forEach((l) => {
      const layername = l
        .getSource()
        .getUrl()
        .replace(/\.xml|Tasmania/g, '');
      const sldLayer = SLDReader.getLayer(sldObject, layername);
      if (sldLayer) {
        const style = SLDReader.getStyle(sldLayer);
        const format = new ol.format.GeoJSON();
        // 111034 = from EPSG:4326 to meters for the location of tasmania
        l.setStyle((feature, resolution) => {
          const geojson = JSON.parse(format.writeFeature(feature));
          const rules = SLDReader.getRules(
            style.featuretypestyles['0'],
            geojson,
            resolution * 111034,
          );
          return SLDReader.OlStyler(SLDReader.getStyleDescription(rules), geojson.geometry.type);
        });
      }
    });
  });
