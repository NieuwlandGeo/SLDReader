/**
 * get all layer names in sld
 * @param {StyledLayerDescriptor} sld
 * @return {string[]} registered layernames
 */
export function getLayerNames(sld) {
  return sld.layers.map(l => l.name);
}

/**
 * Get layer definition from sld
 * @param  {StyledLayerDescriptor} sld       [description]
 * @param  {string} [layername] optional layername
 * @return {Layer}           [description]
 */
export function getLayer(sld, layername) {
  if (!layername) {
    return sld.layers['0'];
  }
  return sld.layers.find(l => l.name === layername);
}

/**
 * getStyleNames, notice name is not required for userstyle, you might get undefined
 * @param  {Layer} layer [description]
 * @return {string[]}       [description]
 */
export function getStyleNames(layer) {
  return layer.styles.map(s => s.name);
}

/**
 * get style from array layer.styles, if name is undefined it returns default style.
 * null is no style found
 * @param  {Layer} layer [description]
 * @param {string} [name] of style. If not given, the style marked as default will be returned.
 * If there is no default style, the first one will be returned.
 * @return {object} the style from layer.styles matching the name
 */
export function getStyle(layer, name) {
  if (name) {
    return layer.styles.find(s => s.name === name);
  }

  const defaultStyle = layer.styles.find(s => s.default);
  if (defaultStyle) {
    return defaultStyle;
  }

  return layer.styles[0];
}

export function isGeometryTypeSupported(geometryType) {
  return (
    geometryType === 'Point' ||
    geometryType === 'MultiPoint' ||
    geometryType === 'LineString' ||
    geometryType === 'MultiLineString' ||
    geometryType === 'Polygon' ||
    geometryType === 'MultiPolygon'
  );
}

/**
 * Gets a nested property from an object according to a property path.
 * Note: path fragments may not contain a ".".
 * Note: returns undefined if input obj is falsy.
 * @private
 * @example
 * getByPath({ a: { b: { c: 42 } } }, "a.b.c") // returns 42.
 * getByPath({ a: { b: { c: 42 } } }, "a.d.c") // returns undefined, because obj.a has no property .d.
 * @param {object} obj Object.
 * @param {string} path Property path.
 * @returns {any} Value of property at given path inside object, or undefined if any property
 * in the path does not exist on the object.
 */
export function getByPath(obj, path) {
  if (!obj) {
    return undefined;
  }

  // Start from the given object.
  let value = obj;

  // Walk the object property path.
  const fragments = (path || '').split('.');
  for (let k = 0; k < fragments.length; k += 1) {
    const fragment = fragments[k];
    // Return undefined if any partial path does not exist in the object.
    if (!(fragment in value)) {
      return undefined;
    }
    value = value[fragment];
  }

  return value;
}

const warnings = new Set();
/**
 * Display an error message as console.warn, but only once per error message.
 * @param {string} errMsg Error message.
 */
export function warnOnce(errMsg) {
  if (!warnings.has(errMsg)) {
    console.warn(errMsg);
    warnings.add(errMsg);
  }
}
