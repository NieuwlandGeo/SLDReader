/**
 * @private
 * @param {any} input Input value.
 * @returns The string representation of the input value.
 * It will always return a valid string and return an empty string for null and undefined values.
 * Other types of input will be returned as their type name.
 */
export function asString(input) {
  if (input === null) {
    return '';
  }
  const inputType = typeof input;
  switch (inputType) {
    case 'string':
      return input;
    case 'number':
    case 'bigint':
    case 'boolean':
      return input.toString();
    case 'undefined':
      return '';
    default:
      // object, function, symbol, bigint, boolean, other?
      return inputType;
  }
}

/**
 * Maps geometry type string to the dimension of a geometry.
 * Multipart geometries will return the dimension of their separate parts.
 * @private
 * @param {string} geometryType OpenLayers Geometry type name.
 * @returns {number} The dimension of the geometry. Will return -1 for GeometryCollection or unknown type.
 */
export function dimensionFromGeometryType(geometryType) {
  switch (geometryType) {
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
      return -1;
  }
}
