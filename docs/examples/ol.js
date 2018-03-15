/* global ol SLDReader */


function createStyleSelector(styler) {
  console.log(styler);
}

// Coords in gml are xy
const proj = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'neu',
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj]);

const sourceurls = ['TasmaniaLand.xml', 'TasmaniaCities.xml', 'TasmaniaRoads.xml', 'TasmaniaWaterBodies.xml'];
const vectorsources = sourceurls.map(s => new ol.source.Vector({
  format: new ol.format.GML2(),
  url: s,
}));
const layers = vectorsources.map(s => new ol.layer.Vector({
  source: s,
}));
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
fetch('sld-tasmania.xml').then(response => response.text()).then((text) => {
  const styler = new SLDReader.OlSLDStyle();
  styler.read(text);
  createStyleSelector(styler);
  layers.forEach((l) => {
    const layername = l.getSource().getUrl().replace(/\.xml|Tasmania/g, '');
    if (styler.hasLayer(layername)) {
      l.setStyle((feature, resolution) => {
        styler.setStyle(layername);
        return styler.styleFunction(feature, resolution * 111034);
      });
    }
  });
});
