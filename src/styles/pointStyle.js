/* eslint-disable no-underscore-dangle */
import { Style, Fill, Stroke, Circle } from 'ol/style';

import {
  IMAGE_LOADING,
  IMAGE_LOADED,
  IMAGE_ERROR,
  DEFAULT_POINT_SIZE,
} from '../constants';
import { memoizeStyleFunction } from './styleUtils';
import { imageLoadingPointStyle, imageErrorPointStyle } from './static';
import { createCachedImageStyle } from '../imageCache';
import getWellKnownSymbol from './wellknown';
import evaluate from '../olEvaluator';

/**
 * Get OL Fill instance for SLD mark object.
 * @param {object} mark SLD mark object.
 */
function getMarkFill(mark) {
  const { fill } = mark;
  const fillColor = (fill && fill.styling && fill.styling.fill) || 'blue';
  return new Fill({
    color: fillColor,
  });
}

/**
 * Get OL Stroke instance for SLD mark object.
 * @param {object} mark SLD mark object.
 */
function getMarkStroke(mark) {
  const { stroke } = mark;

  let olStroke;
  if (stroke && stroke.styling && !(Number(stroke.styling.strokeWidth) === 0)) {
    const { stroke: cssStroke, strokeWidth: cssStrokeWidth } = stroke.styling;
    olStroke = new Stroke({
      color: cssStroke || 'black',
      width: cssStrokeWidth || 2,
    });
  }

  return olStroke;
}

/**
 * @private
 * @param  {PointSymbolizer} pointsymbolizer [description]
 * @return {object} openlayers style
 */
function pointStyle(pointsymbolizer) {
  const { graphic: style } = pointsymbolizer;

  // If the point size is a dynamic expression, use the default point size and update in-place later.
  let pointSizeValue;
  if (style.size && style.size.type === 'expression') {
    pointSizeValue = DEFAULT_POINT_SIZE;
  } else {
    pointSizeValue = style.size || DEFAULT_POINT_SIZE;
  }

  // If the point rotation is a dynamic expression, use 0 as default rotation and update in-place later.
  let rotationDegrees;
  if (style.rotation && style.rotation.type === 'expression') {
    rotationDegrees = 0.0;
  } else {
    rotationDegrees = style.rotation || 0.0;
  }

  if (style.externalgraphic && style.externalgraphic.onlineresource) {
    // Check symbolizer metadata to see if the image has already been loaded.
    switch (pointsymbolizer.__loadingState) {
      case IMAGE_LOADED:
        return createCachedImageStyle(
          style.externalgraphic.onlineresource,
          pointSizeValue,
          rotationDegrees
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
    const { wellknownname } = style.mark;
    const olFill = getMarkFill(style.mark);
    const olStroke = getMarkStroke(style.mark);

    return new Style({
      // Note: size will be set dynamically later.
      image: getWellKnownSymbol(
        wellknownname,
        pointSizeValue,
        olStroke,
        olFill,
        rotationDegrees
      ),
    });
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

function getPointStyle(symbolizer, feature) {
  const olStyle = cachedPointStyle(symbolizer);
  const olImage = olStyle.getImage();

  // Apply dynamic values to the cached OL style instance before returning it.

  // --- Update dynamic size ---
  const { graphic } = symbolizer;
  const { size } = graphic;
  if (size && size.type === 'expression') {
    const sizeValue = Number(evaluate(size, feature)) || DEFAULT_POINT_SIZE;

    if (graphic.externalgraphic && graphic.externalgraphic.onlineresource) {
      const height = olImage.getSize()[1];
      const scale = sizeValue / height || 1;
      olImage.setScale(scale);
    }

    if (graphic.mark) {
      // Note: only ol/style/Circle has a setter for radius. RegularShape does not.
      if (graphic.mark.wellknownname === 'circle') {
        olImage.setRadius(sizeValue * 0.5);
      } else {
        // So, in the case of any other RegularShape, create a new shape instance.
        olStyle.setImage(
          getWellKnownSymbol(
            graphic.mark.wellknownname,
            sizeValue,
            // Note: re-use stroke and fill instances for a (small?) performance gain.
            olImage.getStroke(),
            olImage.getFill()
          )
        );
      }
    }
  }

  // --- Update dynamic rotation ---
  const { rotation } = graphic;
  if (rotation && rotation.type === 'expression') {
    const rotationDegrees = Number(evaluate(rotation, feature)) || 0.0;
    // Note: OL angles are in radians.
    const rotationRadians = (Math.PI * rotationDegrees) / 180.0;
    olImage.setRotation(rotationRadians);
  }

  return olStyle;
}

export default getPointStyle;
