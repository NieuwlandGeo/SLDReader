import { toGeometry } from 'ol/render/Feature';
import RenderFeature from 'ol/render/Feature';
import Point from 'ol/geom/Point';
import MultiPoint from 'ol/geom/MultiPoint';

import getPointStyle from './pointStyle';

/**
 * @private
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
 * @param {EvaluationContext} context Evaluation context.
 * @returns {ol/Style} OpenLayers style instance.
 */
function getPolygonPointStyle(symbolizer, feature, context) {
  if (typeof feature.getGeometry !== 'function') {
    return null;
  }

  let geom = feature.getGeometry();
  if (!geom) {
    return null;
  }

  if (geom instanceof RenderFeature) {
    geom = toGeometry(geom);
  }

  let pointStyle = null;
  const geomType = geom.getType();
  if (geomType === 'Polygon') {
    pointStyle = getPointStyle(symbolizer, feature, context);
    pointStyle.setGeometry(new Point(getInteriorPoint(geom)));
  } else if (geomType === 'MultiPolygon') {
    const polygons = geom.getPolygons();
    const multiPointCoords = polygons.map(getInteriorPoint);
    pointStyle = getPointStyle(symbolizer, feature, context);
    pointStyle.setGeometry(new MultiPoint(multiPointCoords));
  }

  return pointStyle;
}

export default getPolygonPointStyle;
