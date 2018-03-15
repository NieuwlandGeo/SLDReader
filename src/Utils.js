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
 * @return {FeatureTypeStyle[]}       [description]
 */
export function getStyle(layer, name) {
  return layer.styles.find(s => s.name === name);
}

/**
 * get rule for feature, it uses last FeatureTypeStyle matching
 * @param  {FeatureTypeStyle[]} styles [description]
 * @param  {object} feature          a geojson feature
 * @return {Rule}
 */
export function getFeatureTypeStyle(styles, feature) {
  const { properties } = feature;
}
