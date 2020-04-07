import { Style } from 'ol/style';

import { memoizeStyleFunction } from './styleUtils';
import { getSimpleStroke } from './simpleStyles';
import getGraphicStrokeStyle from './graphicStrokeStyle';

/**
 * @private
 * @param  {object} symbolizer SLD symbolizer object.
 * @return {object} OpenLayers style instance corresponding to the stroke of the given symbolizer.
 */
function lineStyle(symbolizer) {
  if (symbolizer.stroke && symbolizer.stroke.graphicstroke) {
    return getGraphicStrokeStyle(symbolizer);
  }

  return new Style({
    stroke: getSimpleStroke(symbolizer.stroke),
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
