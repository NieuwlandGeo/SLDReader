import { asString } from '../helpers';
import { registerFunction } from '../index';

// The functions below are taken from the Geoserver function list.
// https://docs.geoserver.org/latest/en/user/filter/function_reference.html#string-functions
// Note: implementation details may be different from Geoserver implementations.
// SLDReader function parameters are not strictly typed and will convert inputs in a sensible manner.

/**
 * Converts the text representation of the input value to lower case.
 * @param {any} text Input value.
 * @returns Lower case version of the text representation of the input value.
 */
function strToLowerCase(text) {
  return asString(text).toLowerCase();
}

/**
 * Converts the text representation of the input value to upper case.
 * @param {any} text Input value.
 * @returns Upper case version of the text representation of the input value.
 */
function strToUpperCase(text) {
  return asString(text).toUpperCase();
}

/**
 * Get the geometry type of an OpenLayers geometry instance.
 * Calls geom.getType() and returns the result.
 * See https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry.html#~Type
 * for possible values.
 * @param {ol/geom/x} olGeometry OpenLayers Geometry instance.
 * @returns {string} The OpenLayers geometry type.
 */
function geometryType(olGeometry) {
  if (olGeometry && typeof olGeometry.getType === 'function') {
    return olGeometry.getType();
  }

  return 'Unknown';
}

/**
 * Get the dimension of a geometry. Multipart geometries will return the dimension of their separate parts.
 * @param {ol/geom/x} olGeometry OpenLayers Geometry instance.
 * @returns {number} The dimension of the geometry. Will return 0 for GeometryCollection or unknown type.
 */
function dimension(olGeometry) {
  switch (geometryType(olGeometry)) {
    case 'Point':
    case 'MultiPoint':
      return 0;
    case 'LineString':
    case 'LinearRing':
    case 'Circle':
    case 'MultiLineString':
      return 1;
    case 'Polygon':
    case 'MultiPolygon':
      return 2;
    default:
      return 0;
  }
}

/**
 * Determine the type of an OpenLayers geometry. Does not differentiate between multipart and single part.
 * @param {ol/geom/x} olGeometry OpenLayers Geometry instance.
 * @returns {string} The geometry type: one of Point, Line, Polygon, or Unknown (geometry collection).
 */
function qgisGeometryType(olGeometry) {
  switch (geometryType(olGeometry)) {
    case 'Point':
    case 'MultiPoint':
      return 'Point';
    case 'LineString':
    case 'LinearRing':
    case 'Circle':
    case 'MultiLineString':
      return 'Line';
    case 'Polygon':
    case 'MultiPolygon':
      return 'Polygon';
    default:
      return 'Unknown';
  }
}

export default function addBuiltInFunctions() {
  // Geoserver functions
  registerFunction('strToLowerCase', strToLowerCase);
  registerFunction('strToUpperCase', strToUpperCase);
  registerFunction('dimension', dimension);

  // QGIS functions
  registerFunction('lower', strToLowerCase);
  registerFunction('upper', strToUpperCase);
  registerFunction('geometry_type', qgisGeometryType);
}
