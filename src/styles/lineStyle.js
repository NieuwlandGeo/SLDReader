import { Style, Stroke } from 'ol/style';

import { hexToRGB, memoizeStyleFunction } from './styleUtils';
import getGraphicStrokeStyle from './graphicStrokeStyle';

/**
 * @private
 * @param  {LineSymbolizer} linesymbolizer [description]
 * @return {object} openlayers style
 */
function lineStyle(linesymbolizer) {
  if (linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke) {
    return getGraphicStrokeStyle(linesymbolizer);
  }

  const style = linesymbolizer.stroke && linesymbolizer.stroke.styling;
  return new Style({
    stroke:
      style &&
      new Stroke({
        color:
          style.strokeOpacity &&
          style.stroke &&
          style.stroke.slice(0, 1) === '#'
            ? hexToRGB(style.stroke, style.strokeOpacity)
            : style.stroke || '#3399CC',
        width: style.strokeWidth || 1.25,
        lineCap: style.strokeLinecap && style.strokeLinecap,
        lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
        lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
        lineJoin: style.strokeLinejoin && style.strokeLinejoin,
      }),
  });
}

const cachedLineStyle = memoizeStyleFunction(lineStyle);

/**
 * @private
 * Get an OL line style instance for a feature according to a symbolizer.
 * @param {object} symbolizer SLD symbolizer object.
 * @returns {ol/Style} OpenLayers style instance.
 */
function getLineStyle(symbolizer) {
  return cachedLineStyle(symbolizer);
}

export default getLineStyle;
