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
 * getlayer with name
 * @param  {StyledLayerDescriptor} sld       [description]
 * @param  {string} layername [description]
 * @return {Layer}           [description]
 */
export function getLayer(sld, layername) {
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
 * get style, if name is undefined it returns default style.
 * null is no style found
 * @param  {Layer} layer [description]
 * @param {string} name of style
 * @return {object} the style with matching name
 */
export function getStyle(layer, name) {
  if (name) {
    return layer.styles.find(s => s.name === name);
  }
  return layer.styles.find(s => s.default);
}

/**
 * get rules for specific feature after applying filters
 * @param  {FeatureTypeStyle} featureTypeStyle [description]
 * @param  {object} feature          a geojson feature
 * @return {Rule[]}
 */
export function getRules(featureTypeStyle, feature, resolution) {
  const { properties } = feature;
  const result = [];
  for (let j = 0; j < featureTypeStyle.rules.length; j += 1) {
    const rule = featureTypeStyle.rules[j];
    if (rule.filter && scaleSelector(rule, resolution) && filterSelector(rule.filter, properties)) {
      result.push(rule);
    } else if (rule.elsefilter && result.length === 0) {
      result.push(rule);
    } else if (!rule.elsefilter && !rule.filter) {
      result.push(rule);
    }
  }
  return result;
}
