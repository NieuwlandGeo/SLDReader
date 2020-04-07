import { scaleSelector, filterSelector } from './Filter';

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
 * @param {string} [name] of style
 * @return {object} the style from layer.styles matching the name
 */
export function getStyle(layer, name) {
  if (name) {
    return layer.styles.find(s => s.name === name);
  }
  return layer.styles.find(s => s.default);
}

/**
 * get rules for specific feature after applying filters
 * @example
 * const style = getStyle(sldLayer, stylename);
 * getRules(style.featuretypestyles['0'], geojson, resolution);
 * @param  {FeatureTypeStyle} featureTypeStyle
 * @param  {object} feature geojson
 * @param  {number} resolution m/px
 * @param  {Function} options.getProperty An optional function with parameters (feature, propertyName)
 * that can be used to extract a property value from a feature.
 * When not given, properties are read from feature.properties directly.Error
 * @param  {Function} options.getFeatureId An optional function to extract the feature id from a feature.Error
 * When not given, feature id is read from feature.id.
 * @return {Rule[]}
 */
export function getRules(featureTypeStyle, feature, resolution, options = {}) {
  const result = [];
  for (let j = 0; j < featureTypeStyle.rules.length; j += 1) {
    const rule = featureTypeStyle.rules[j];
    if (scaleSelector(rule, resolution)) {
      if (rule.filter && filterSelector(rule.filter, feature, options)) {
        result.push(rule);
      } else if (rule.elsefilter && result.length === 0) {
        result.push(rule);
      } else if (!rule.elsefilter && !rule.filter) {
        result.push(rule);
      }
    }
  }
  return result;
}

/**
 * Get all symbolizers inside a given rule.
 * Note: this will be a mix of Point/Line/Polygon/Text symbolizers.
 * @param {object} rule SLD rule object.
 * @returns {Array<object>} Array of all symbolizers in a rule.
 */
export function getRuleSymbolizers(rule) {
  // Helper for adding a symbolizer to a list when the symbolizer can be an array of symbolizers.
  // Todo: refactor style reader, so symbolizer is always an array.
  function addSymbolizer(list, symbolizer) {
    if (!symbolizer) {
      return;
    }
    if (Array.isArray(symbolizer)) {
      Array.prototype.push.apply(list, symbolizer);
      return;
    }
    list.push(symbolizer);
  }

  const allSymbolizers = [];
  addSymbolizer(allSymbolizers, rule.pointsymbolizer);
  addSymbolizer(allSymbolizers, rule.linesymbolizer);
  addSymbolizer(allSymbolizers, rule.polygonsymbolizer);
  addSymbolizer(allSymbolizers, rule.textsymbolizer);

  return allSymbolizers;
}

/**
 * Gets a nested property from an object according to a property path.
 * Note: path fragments may not contain a ".".
 * Note: returns undefined if input obj is falsy.
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
