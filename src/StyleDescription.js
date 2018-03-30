/**
 * Merges style props of rules, last defined rule props win
 * @param  {Rule[]} rules [description]
 * @return {StyleDescription}
 */
function getStyleDescription(rules) {
  const result = {
    polygon: [],
    line: [],
    point: [],
  };
  for (let i = 0; i < rules.length; i += 1) {
    if (rules[i].polygonsymbolizer) {
      let style = {};
      if (rules[i].polygonsymbolizer.fill) {
        style = Object.assign(style, getCssParams(rules[i].polygonsymbolizer.fill.css));
      }
      if (rules[i].polygonsymbolizer.stroke) {
        style = Object.assign(style, getCssParams(rules[i].polygonsymbolizer.stroke.css));
      }
      result.polygon.push(style);
    }
    if (rules[i].linesymbolizer && rules[i].linesymbolizer.stroke) {
      result.line.push(getCssParams(rules[i].linesymbolizer.stroke.css));
    }
    if (rules[i].pointsymbolizer) {
      const { pointsymbolizer } = rules[i];
      if (
        pointsymbolizer.graphic.externalgraphic &&
        pointsymbolizer.graphic.externalgraphic.onlineresource
      ) {
        result.point.push({
          externalgraphic: pointsymbolizer.graphic.externalgraphic.onlineresource,
        });
      }
    }
  }
  return result;
}

/**
 * @private
 * @param {object} result    [description]
 * @param {object[]} cssparams [description]
 * @return {object} with camelCase key and css valye
 */
function getCssParams(cssparams) {
  const result = {};
  for (let j = 0; j < cssparams.length; j += 1) {
    const key = cssparams[j].name
      .toLowerCase()
      .replace(/-(.)/g, (match, group1) => group1.toUpperCase());
    result[key] = cssparams[j].value;
  }
  return result;
}

export default getStyleDescription;

/**
 * @typedef StyleDescription
 * @name StyleDescription
 * @description a flat object per symbolizer type, with values assigned to camelcased props.
 * @property {object[]} polygon polygonsymbolizers, see
 * {@link http://docs.geoserver.org/stable/en/user/styling/sld/reference/polygonsymbolizer.html#cssparameter|polygon css parameters}
 * and {@link http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#cssparameter|stroke css parameters}
 * @property {object[]} line linesymbolizers {@link http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#cssparameter|strok css parameters}
 * @property {object[]} point pointsymbolizers, props are camelcased.
 * @property {string} point.externalgraphic url from ExternalGraphic
 */
