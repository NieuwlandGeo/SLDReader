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
  if (window.location.hash) {
    chooser.value = window.location.hash.substr(1);
  }
}
// Coords in gml are xy
const proj = new ol.proj.Projection({
  code: 'http://www.opengis.net/gml/srs/epsg.xml#4326',
  axis: 'neu',
});
ol.proj.addEquivalentProjections([ol.proj.get('EPSG:4326'), proj]);

function convertResolutionFromDegreesToMeters(resolution) {
  // 111034 = from EPSG:4326 to meters for the location of tasmania
  return resolution * 111034;
}

const sourceurls = ['assets/TasmaniaLand.xml', 'assets/TasmaniaRoads.xml', 'assets/TasmaniaCities.xml', 'assets/TasmaniaWaterBodies.xml'];
const vectorsources = sourceurls.map(
  s => new ol.source.Vector({
    format: new ol.format.GML2(),
    url: s,
  })
);
const layers = vectorsources.map(
  s => new ol.layer.Vector({
    source: s,
  })
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
fetch('assets/sld-tasmania.xml')
  .then(response => response.text())
  .then(text => {
    const sldObject = SLDReader.Reader(text);
    styleSelector(sldObject);

    const setLayerStyle = (layer, stylename) => {
      const layername = layer
        .getSource()
        .getUrl()
        .replace(/\.xml|assets\/Tasmania/g, '');
      const sldLayer = SLDReader.getLayer(sldObject, layername);
      if (sldLayer) {
        const style = SLDReader.getStyle(sldLayer, stylename);
        const featureTypeStyle = style.featuretypestyles[0];
        layer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
          convertResolution: convertResolutionFromDegreesToMeters,
          imageLoadedCallback: () => {
            // Signal OpenLayers to redraw the layer when an image icon has loaded.
            // On redraw, the updated symbolizer with the correct image scale will be used to draw the icon.
            layer.changed();
          },
        }));
      }
    };
    layers.forEach((l, i) => {
      // waterbodies layer
      if (i === 3) {
        setLayerStyle(l, document.getElementById('style_chooser').value);
      } else {
        setLayerStyle(l);
      }
    });
    document.getElementById('style_chooser').addEventListener('change', e => {
      const styleName = e.target.value;
      setLayerStyle(layers['3'], styleName);
      window.location.hash = styleName;
    });
  });
