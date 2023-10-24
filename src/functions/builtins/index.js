import { asString } from '../helpers';
import { registerFunction } from '../index';

// The functions below are taken from the Geoserver function list.
// https://docs.geoserver.org/latest/en/user/filter/function_reference.html#string-functions
// Note: implementation details may be different from Geoserver implementations.
// SLDReader function parameters are not strictly typed and will convert inputs in a sensible manner.
function strToLowerCase(text) {
  return asString(text).toLowerCase();
}

function strToUpperCase(text) {
  return asString(text).toUpperCase();
}

export default function addBuiltInFunctions() {
  // Geoserver functions
  registerFunction('strToLowerCase', strToLowerCase);
  registerFunction('strToUpperCase', strToUpperCase);

  // QGIS functions
  registerFunction('lower', strToLowerCase);
  registerFunction('upper', strToUpperCase);
}
