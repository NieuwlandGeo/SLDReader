/**
 * Get styling from rules per geometry type
 * @param  {Rule[]} rules [description]
 * @return {GeometryStyles}
 */
function getGeometryStyles(rules) {
  const result = {
    polygon: [],
    line: [],
    point: [],
    text: [],
  };
  for (let i = 0; i < rules.length; i += 1) {
    if (rules[i].polygonsymbolizer) {
      result.polygon = [...result.polygon, ...rules[i].polygonsymbolizer];
    }
    if (rules[i].linesymbolizer) {
      result.line = [...result.line, ...rules[i].linesymbolizer];
    }
    if (rules[i].pointsymbolizer) {
      result.point = [...result.point, ...rules[i].pointsymbolizer];
    }
    if (rules[i].textsymbolizer) {
      result.text = [...result.text, ...rules[i].textsymbolizer];
    }
  }
  return result;
}

export default getGeometryStyles;

/**
 * @typedef GeometryStyles
 * @name GeometryStyles
 * @description contains for each geometry type the symbolizer from an array of rules
 * @property {PolygonSymbolizer[]} polygon polygonsymbolizers
 * @property {LineSymbolizer[]} line linesymbolizers
 * @property {PointSymbolizer[]} point pointsymbolizers, same as graphic prop from PointSymbolizer
 */
