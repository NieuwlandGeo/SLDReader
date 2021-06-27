import { MultiPoint, Point } from 'ol/geom';

import getPointStyle from './pointStyle';

/**
 * Get the point located at the centroid of a polygon.
 * @param {ol/geom/Polygon} geometry An OpenLayers Polygon geometry.
 * @returns {Array<number>} An [x, y] coordinate array.
 */
function getInteriorPoint(geometry) {
  // Use OpenLayers getInteriorPoint method to get a 'good' interior point.
  const [x, y] = geometry.getInteriorPoint().getCoordinates();
  return [x, y];
}

/**
 * @private
 * Get an OL point style instance for a line feature according to a symbolizer.
 * The style will render a point on the middle of the line.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature} feature OpenLayers Feature.
 * @returns {ol/Style} OpenLayers style instance.
 */
function getPolygonPointStyle(symbolizer, feature) {
  const geom = feature.getGeometry();
  if (!geom) {
    return null;
  }

  let pointStyle = null;
  const geomType = geom.getType();
  if (geomType === 'Polygon') {
    pointStyle = getPointStyle(symbolizer, feature);
    pointStyle.setGeometry(new Point(getInteriorPoint(geom)));
  } else if (geomType === 'MultiPolygon') {
    const polygons = geom.getPolygons();
    const multiPointCoords = polygons.map(getInteriorPoint);
    pointStyle = getPointStyle(symbolizer, feature);
    pointStyle.setGeometry(new MultiPoint(multiPointCoords));
  }

  return pointStyle;
}

export default getPolygonPointStyle;
