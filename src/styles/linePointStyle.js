import Point from 'ol/geom/Point';
import MultiPoint from 'ol/geom/MultiPoint';

import getPointStyle from './pointStyle';
import { getLineMidpoint } from './geometryCalcs';

/**
 * @private
 * Get an OL point style instance for a line feature according to a symbolizer.
 * The style will render a point on the middle of the line.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature} feature OpenLayers Feature.
 * @param {EvaluationContext} context Evaluation context.
 * @returns {ol/Style} OpenLayers style instance.
 */
function getLinePointStyle(symbolizer, feature, context) {
  if (typeof feature.getGeometry !== 'function') {
    return null;
  }

  const geom = feature.getGeometry();
  if (!geom) {
    return null;
  }

  let pointStyle = null;
  const geomType = geom.getType();
  if (geomType === 'LineString') {
    pointStyle = getPointStyle(symbolizer, feature, context);
    pointStyle.setGeometry(new Point(getLineMidpoint(geom)));
  } else if (geomType === 'MultiLineString') {
    const lineStrings = geom.getLineStrings();
    const multiPointCoords = lineStrings.map(getLineMidpoint);
    pointStyle = getPointStyle(symbolizer, feature, context);
    pointStyle.setGeometry(new MultiPoint(multiPointCoords));
  }

  return pointStyle;
}

export default getLinePointStyle;
