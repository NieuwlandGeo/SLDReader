/**
 * Get styling from rules per geometry type
 * @param  {Rule[]} rules [description]
 * @return {CategorizedSymbolizers}
 */
function categorizeSymbolizers(rules) {
  const result = {
    polygonSymbolizers: [],
    lineSymbolizers: [],
    pointSymbolizers: [],
    textSymbolizers: [],
  };

  (rules || []).forEach(rule => {
    if (rule.polygonsymbolizer) {
      result.polygonSymbolizers = [
        ...result.polygonSymbolizers,
        ...rule.polygonsymbolizer,
      ];
    }
    if (rule.linesymbolizer) {
      result.lineSymbolizers = [
        ...result.lineSymbolizers,
        ...rule.linesymbolizer,
      ];
    }
    if (rule.pointsymbolizer) {
      result.pointSymbolizers = [
        ...result.pointSymbolizers,
        ...rule.pointsymbolizer,
      ];
    }
    if (rule.textsymbolizer) {
      result.textSymbolizers = [
        ...result.textSymbolizers,
        ...rule.textsymbolizer,
      ];
    }
  });

  return result;
}

export default categorizeSymbolizers;

/**
 * @typedef CategorizedSymbolizers
 * @name CategorizedSymbolizers
 * @description contains for each geometry type the symbolizer from an array of rules
 * @property {PolygonSymbolizer[]} polygonSymbolizers polygonsymbolizers
 * @property {LineSymbolizer[]} lineSymbolizers  linesymbolizers
 * @property {PointSymbolizer[]} pointSymbolizers  pointsymbolizers, same as graphic prop from PointSymbolizer
 * @property {TextSymbolizer[]} textSymbolizers  textsymbolizers
 */
