
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
