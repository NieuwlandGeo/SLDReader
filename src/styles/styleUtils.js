/**
 * @private
 * Function to memoize style conversion functions that convert sld symbolizers to OpenLayers style instances.
 * The memoized version of the style converter returns the same OL style instance if the symbolizer is the same object.
 * Uses a WeakMap internally.
 * Note: This only works for constant symbolizers.
 * @param {Function} styleFunction Function that accepts a single symbolizer object and returns the corresponding OpenLayers style object.
 * @returns {Function} The memoized function of the style conversion function.
 */
export function memoizeStyleFunction(styleFunction) {
  const styleCache = new WeakMap();

  return symbolizer => {
    let olStyle = styleCache.get(symbolizer);

    // Create a new style if no style has been created yet, or when symbolizer has been invalidated.
    if (!olStyle || symbolizer.__invalidated) {
      olStyle = styleFunction(symbolizer);
      // Clear invalidated flag after creating a new style instance.
      symbolizer.__invalidated = false;
      styleCache.set(symbolizer, olStyle);
    }

    return olStyle;
  };
}

/**
 * @private
 * Convert a hex color (like #AABBCC) to an rgba-string.
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

/**
 * Calculate the center-to-center distance for graphics placed along a line within a GraphicSymbolizer.
 * @param {object} lineSymbolizer SLD line symbolizer object.
 * @param {number} graphicWidth Width of the symbolizer graphic in pixels. This size may be dependent on feature properties,
 * so it has to be supplied separately from the line symbolizer object.
 * @returns {number} Center-to-center distance for graphics along a line.
 */
export function calculateGraphicSpacing(lineSymbolizer, graphicWidth) {
  const { graphicstroke, styling } = lineSymbolizer.stroke;
  if ('gap' in graphicstroke) {
    // Note: gap should be a numeric property after parsing (check reader.test).
    return graphicstroke.gap + graphicWidth;
  }

  // If gap is not given, use strokeDasharray to space graphics.
  // First digit represents size of graphic, second the relative space, e.g.
  // size = 20, dash = [2 6] -> 2 ~ 20 then 6 ~ 60, total segment length should be 20 + 60 = 80
  let multiplier = 1; // default, i.e. a segment is the size of the graphic (without stroke/outline).
  if (styling && styling.strokeDasharray) {
    const dash = styling.strokeDasharray.split(' ');
    if (dash.length >= 2 && dash[0] !== 0) {
      multiplier = dash[1] / dash[0] + 1;
    }
  }
  return multiplier * graphicWidth;
}
