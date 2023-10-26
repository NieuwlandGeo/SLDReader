import { asString } from '../helpers';
import { registerFunction } from '../index';

// The functions below are taken from the Geoserver function list.
// https://docs.geoserver.org/latest/en/user/filter/function_reference.html#string-functions
// Note: implementation details may be different from Geoserver implementations.
// SLDReader function parameters are not strictly typed and will convert inputs in a sensible manner.

/**
 * Converts the text representation of the input value to lower case.
 * @private
 * @param {any} input Input value.
 * @returns Lower case version of the text representation of the input value.
 */
function strToLowerCase(input) {
  return asString(input).toLowerCase();
}

/**
 * Converts the text representation of the input value to upper case.
 * @private
 * @param {any} input Input value.
 * @returns Upper case version of the text representation of the input value.
 */
function strToUpperCase(input) {
  return asString(input).toUpperCase();
}

/**
 * Extract a substring from the input text.
 * @private
 * @param {any} input Input value.
 * @param {number} start Integer representing start position to extract beginning with 1;
 * if start is negative, the return string will begin at the end of the string minus the start value.
 * @param {number} [length] Optional integer representing length of string to extract;
 * if length is negative, the return string will omit the given length of characters from the end of the string
 * @returns {string} The extracted substring.
 * @example
 * * qgisSubstr('HELLO WORLD', 3, 5) --> 'LLO W'.
 * * qgisSubstr('HELLO WORLD', -5) --> 'WORLD'.
 */
function qgisSubstr(input, start, length) {
  const startIndex = Number(start);
  const lengthInt = Number(length);
  if (Number.isNaN(startIndex)) {
    return '';
  }

  // Note: implementation specification taken from https://docs.qgis.org/3.28/en/docs/user_manual/expressions/functions_list.html#substr
  const text = asString(input);
  if (Number.isNaN(lengthInt)) {
    if (startIndex > 0) {
      return text.slice(startIndex - 1);
    }
    return text.slice(startIndex);
  }

  if (lengthInt === 0) {
    return '';
  }

  if (startIndex > 0) {
    if (lengthInt > 0) {
      return text.slice(startIndex - 1, startIndex - 1 + lengthInt);
    }
    return text.slice(startIndex - 1, lengthInt);
  }

  if (lengthInt > 0) {
    if (startIndex + lengthInt < 0) {
      return text.slice(startIndex, startIndex + lengthInt);
    }
    return text.slice(startIndex);
  }

  return text.slice(startIndex, lengthInt);
}

/**
 * Extract a substring given a begin and end index.
 * @private
 * @param {any} input Input value.
 * @param {number} begin Begin index (0-based).
 * @param {number} end End index (0-based).
 * @returns {string} The substring starting at the begin index up to,
 * but not incuding the character at the end index.
 * @example
 * * strSubstring('HELLO', 2, 4) --> 'LL'.
 */
function strSubstring(input, begin, end) {
  const text = asString(input);
  const beginIndex = Number(begin);
  const endIndex = Number(end);
  if (Number.isNaN(beginIndex) || Number.isNaN(endIndex)) {
    return '';
  }

  return text.slice(beginIndex, endIndex);
}

/**
 * Extract a substring from a begin index until the end.
 * @private
 * @param {any} input Input value.
 * @param {number} begin Begin index (0-based).
 * Using a negative index -N starts at N characters from the end.
 * @returns {string} The substring starting at the begin index until the end.
 * @example
 * * strSubstringStart('HELLO', 1) --> 'ELLO'.
 * * strSubstringStart('HELLO', -2) --> 'LO'.
 */
function strSubstringStart(input, begin) {
  const text = asString(input);
  const beginIndex = Number(begin);
  if (Number.isNaN(beginIndex)) {
    return '';
  }

  return text.slice(beginIndex);
}

/**
 * Get the geometry type of an OpenLayers geometry instance.
 * Calls geom.getType() and returns the result.
 * See https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry.html#~Type
 * for possible values.
 * @private
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
 * @private
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
 * @private
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

/**
 * Test if the first argument is the same as any of the other arguments.
 * Equality is determined by comparing test and candidates as strings.
 * @private
 * @param  {...any} inputArgs Input arguments.
 * @returns {boolean} True if the first argument is the same as any of the other arguments
 * using string-based comparison.
 */
function stringIn(...inputArgs) {
  const [test, ...candidates] = inputArgs;
  // Compare test with candidates as string.
  const testString = asString(test);
  return candidates.some(candidate => asString(candidate) === testString);
}

/**
 * Register all builtin functions at once.
 * @private
 */
export default function addBuiltInFunctions() {
  // QGIS functions
  registerFunction('lower', strToLowerCase);
  registerFunction('upper', strToUpperCase);
  registerFunction('geometry_type', qgisGeometryType);
  registerFunction('substr', qgisSubstr);

  // Geoserver functions
  registerFunction('strToLowerCase', strToLowerCase);
  registerFunction('strToUpperCase', strToUpperCase);
  registerFunction('strSubstring', strSubstring);
  registerFunction('strSubstringStart', strSubstringStart);
  registerFunction('geometryType', geometryType);
  registerFunction('dimension', dimension);
  registerFunction('in', stringIn);
  // Also register in2/in10 as alias for the in function.
  // This is done for backwards compatibility with older geoservers, which have explicit 'in'
  // function versions for 2 to 10 parameters.
  for (let k = 2; k <= 10; k += 1) {
    registerFunction(`in${k}`, stringIn);
  }

  // Math operators as functions
  registerFunction('__fe:Add__', (a, b) => Number(a) + Number(b));
  registerFunction('__fe:Sub__', (a, b) => Number(a) - Number(b));
  registerFunction('__fe:Mul__', (a, b) => Number(a) * Number(b));
  registerFunction('__fe:Div__', (a, b) => Number(a) / Number(b));
}
