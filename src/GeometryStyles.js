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
      result.polygon.push(rules[i].polygonsymbolizer);
    }
    if (rules[i].linesymbolizer && rules[i].linesymbolizer) {
      result.line.push(rules[i].linesymbolizer);
    }
    if (rules[i].pointsymbolizer) {
      const { pointsymbolizer } = rules[i];
      result.point.push(pointsymbolizer);
    }
    if (rules[i].textsymbolizer) {
      const { textsymbolizer } = rules[i];
      result.text.push(textsymbolizer);
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
