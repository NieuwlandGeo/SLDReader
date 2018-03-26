/**
 * Merges style props of rules, last defined rule props win
 * @param  {Rule[]} rules [description]
 * @return {StyleDescription}
 */
function getStyleDescription(rules) {
  const result = {
    polygon: {},
    line: {},
    point: {},
  };
  for (let i = 0; i < rules.length; i += 1) {
    if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer.fill) {
      setCssParams(result.polygon, rules[i].polygonsymbolizer.fill.css);
    }
    if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer.stroke) {
      setCssParams(result.polygon, rules[i].polygonsymbolizer.stroke.css);
    }
    if (rules[i].linesymbolizer && rules[i].linesymbolizer.stroke) {
      setCssParams(result.line, rules[i].linesymbolizer.stroke.css);
    }
  }
  return result;
}

/**
 * @param {object} result    [description]
 * @param {object[]} cssparams [description]
 */
function setCssParams(result, cssparams) {
  for (let j = 0; j < cssparams.length; j += 1) {
    const key = cssparams[j].name
      .toLowerCase()
      .replace(/-(.)/g, (match, group1) => group1.toUpperCase());
    result[key] = cssparams[j].value;
  }
}

export default getStyleDescription;

/**
 * @typedef StyleDescription
 * @name StyleDescription
 * @description a flat object per symbolizer type, with values assigned to camelcased props.
 * @property {object} polygon merged polygonsymbolizers
 * @property {object} line merged linesymbolizers
 * @property {object} point merged pointsymbolizers, props are camelcased.
 */
