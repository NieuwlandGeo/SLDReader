import { MultiPoint, Point } from 'ol/geom';

import getPointStyle from './pointStyle';
import { splitLineString } from './geometryCalcs';

/**
 * Get the point located at the middle along a line string.
 * @param {ol/geom/LineString} geometry An OpenLayers LineString geometry.
 * @returns {Array<number>} An [x, y] coordinate array.
 */
function getLineMidpoint(geometry) {
  // Use the splitpoints routine to distribute points over the line with
  // a point-to-point distance along the line equal to half line length.
  // This results in three points. Take the middle point.
  const splitPoints = splitLineString(geometry, geometry.getLength() / 2, {
    alwaysUp: true,
    midPoints: false,
  });
  const [x, y] = splitPoints[1];
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
function getLinePointStyle(symbolizer, feature) {
  const geom = feature.getGeometry();
  if (!geom) {
    return null;
  }

  let pointStyle = null;
  const geomType = geom.getType();
  if (geomType === 'LineString') {
    pointStyle = getPointStyle(symbolizer, feature);
    pointStyle.setGeometry(new Point(getLineMidpoint(geom)));
  } else if (geomType === 'MultiLineString') {
    const lineStrings = geom.getLineStrings();
    const multiPointCoords = lineStrings.map(getLineMidpoint);
    pointStyle = getPointStyle(symbolizer, feature);
    pointStyle.setGeometry(new MultiPoint(multiPointCoords));
  }

  return pointStyle;
}

export default getLinePointStyle;
