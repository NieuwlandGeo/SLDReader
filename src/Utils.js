/* eslint-disable no-underscore-dangle */
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
 * Function to memoize style conversion functions that convert sld symbolizers to OpenLayers style instances.
 * The memoized version of the style converter returns the same OL style instance if the symbolizer is the same object.
 * Uses a WeakMap internally.
 * Note: This only works for constant symbolizers.
 * @private
 * @param {Function} styleFunction Function that accepts a single symbolizer object and returns the corresponding OpenLayers style object.
 * @returns {Function} The memoized function of the style conversion function.
 */
export function memoizeStyleFunction(styleFunction) {
  const styleCache = new WeakMap();

  return symbolizer => {
    let olStyle = styleCache.get(symbolizer);

    if (!olStyle) {
      olStyle = styleFunction(symbolizer);
      styleCache.set(symbolizer, olStyle);
    }

    return olStyle;
  };
}

/**
 * @param  {string} hex   eg #AA00FF
 * @param  {Number} alpha eg 0.5
 * @return {string}       rgba(0,0,0,0)
 */
export function hexToRGB(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}
