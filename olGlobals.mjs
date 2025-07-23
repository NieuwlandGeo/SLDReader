// Mappings for standalone SLDReader build.
// Make sure to map every ol/something/else used in the source code to the corresponding ol.something.Else standalone version.
const olGlobals = {
  'ol/render': 'ol.render',
  'ol/render/Feature': 'ol.render.Feature',
  'ol/extent': 'ol.extent',
  'ol/has': 'ol.has',
  'ol/color': 'ol.color',
  'ol/colorlike': 'ol.colorlike',
  'ol/style/Style': 'ol.style.Style',
  'ol/style/Circle': 'ol.style.Circle',
  'ol/style/Fill': 'ol.style.Fill',
  'ol/style/Icon': 'ol.style.Icon',
  'ol/style/Image': 'ol.style.Image',
  'ol/style/IconImageCache': 'ol.style.IconImageCache',
  'ol/style/RegularShape': 'ol.style.RegularShape',
  'ol/style/Stroke': 'ol.style.Stroke',
  'ol/style/Text': 'ol.style.Text',
  'ol/geom/Point': 'ol.geom.Point',
  'ol/geom/MultiPoint': 'ol.geom.MultiPoint',
  'ol/geom/LineString': 'ol.geom.LineString',
  'ol/geom/Polygon': 'ol.geom.Polygon',
  'ol/geom/MultiPolygon': 'ol.geom.MultiPolygon',
  // Warning: imports below are not official part of API.
  'ol/dom': 'ol.dom',
  'ol/style/IconImage': 'ol.style.IconImage',
};

export default olGlobals;
