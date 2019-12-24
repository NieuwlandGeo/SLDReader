/* eslint-disable no-underscore-dangle */
import { Style, Fill, Stroke, Circle } from 'ol/style';

import { IMAGE_LOADING, IMAGE_LOADED, IMAGE_ERROR } from '../constants';
import { memoizeStyleFunction } from '../Utils';
import { imageLoadingPointStyle, imageErrorPointStyle } from './static';
import { createCachedImageStyle } from '../imageCache';
import getWellKnownSymbol from './wellknown';

/**
 * @private
 * @param  {PointSymbolizer} pointsymbolizer [description]
 * @return {object} openlayers style
 */
function pointStyle(pointsymbolizer) {
  const { graphic: style } = pointsymbolizer;
  if (style.externalgraphic && style.externalgraphic.onlineresource) {
    // Check symbolizer metadata to see if the image has already been loaded.
    switch (pointsymbolizer.__loadingState) {
      case IMAGE_LOADED:
        return createCachedImageStyle(
          style.externalgraphic.onlineresource,
          style.size
        );
      case IMAGE_LOADING:
        return imageLoadingPointStyle;
      case IMAGE_ERROR:
        return imageErrorPointStyle;
      default:
        // A symbolizer should have loading state metadata, but return IMAGE_LOADING just in case.
        return imageLoadingPointStyle;
    }
  }
  if (style.mark) {
    let { fill, stroke } = style.mark;
    const fillColor = (fill && fill.styling && fill.styling.fill) || 'blue';
    fill = new Fill({
      color: fillColor,
    });
    if (
      stroke &&
      stroke.styling &&
      !(Number(stroke.styling.strokeWidth) === 0)
    ) {
      const { stroke: cssStroke, strokeWidth: cssStrokeWidth } = stroke.styling;
      stroke = new Stroke({
        color: cssStroke || 'black',
        width: cssStrokeWidth || 2,
      });
    } else {
      stroke = undefined;
    }
    const radius = 0.5 * Number(style.size) || 10;
    return getWellKnownSymbol(style.mark.wellknownname, radius, stroke, fill);
  }

  return new Style({
    image: new Circle({
      radius: 4,
      fill: new Fill({
        color: 'blue',
      }),
    }),
  });
}

const cachedPointStyle = memoizeStyleFunction(pointStyle);

function getPointStyle(symbolizer /* , feature, options = {} */) {
  // Todo: apply dynamic style values in-place to the cached ol style instance.
  return cachedPointStyle(symbolizer);
}

export default getPointStyle;
