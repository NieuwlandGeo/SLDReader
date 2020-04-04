/* eslint-disable no-underscore-dangle */
import { Style, Fill } from 'ol/style';

import { IMAGE_LOADING, IMAGE_LOADED, IMAGE_ERROR } from '../constants';
import { memoizeStyleFunction } from './styleUtils';
import { getCachedImage } from '../imageCache';
import { imageLoadingPolygonStyle, imageErrorPolygonStyle } from './static';
import { getSimpleStroke, getSimpleFill } from './simpleStyles';

function createPattern(graphic) {
  const { image, width, height } = getCachedImage(
    graphic.externalgraphic.onlineresource
  );

  let imageRatio = 1;
  if (graphic.size && height !== graphic.size) {
    imageRatio = graphic.size / height;
  }
  const cnv = document.createElement('canvas');
  const ctx = cnv.getContext('2d');
  if (imageRatio === 1) {
    return ctx.createPattern(image, 'repeat');
  }
  const tempCanvas = document.createElement('canvas');
  const tCtx = tempCanvas.getContext('2d');

  tempCanvas.width = width * imageRatio;
  tempCanvas.height = height * imageRatio;
  // prettier-ignore
  tCtx.drawImage(
    image,
    0, 0, width, height,
    0, 0, width * imageRatio, height * imageRatio
  );
  return ctx.createPattern(tempCanvas, 'repeat');
}

function polygonStyle(symbolizer) {
  if (
    symbolizer.fill &&
    symbolizer.fill.graphicfill &&
    symbolizer.fill.graphicfill.graphic &&
    symbolizer.fill.graphicfill.graphic.externalgraphic &&
    symbolizer.fill.graphicfill.graphic.externalgraphic.onlineresource
  ) {
    // Check symbolizer metadata to see if the image has already been loaded.
    switch (symbolizer.__loadingState) {
      case IMAGE_LOADED:
        return new Style({
          fill: new Fill({
            color: createPattern(symbolizer.fill.graphicfill.graphic),
          }),
        });
      case IMAGE_LOADING:
        return imageLoadingPolygonStyle;
      case IMAGE_ERROR:
        return imageErrorPolygonStyle;
      default:
        // A symbolizer should have loading state metadata, but return IMAGE_LOADING just in case.
        return imageLoadingPolygonStyle;
    }
  }

  return new Style({
    fill: getSimpleFill(symbolizer.fill),
    stroke: getSimpleStroke(symbolizer.stroke),
  });
}

const cachedPolygonStyle = memoizeStyleFunction(polygonStyle);

/**
 * @private
 * Get an OL line style instance for a feature according to a symbolizer.
 * @param {object} symbolizer SLD symbolizer object.
 * @returns {ol/Style} OpenLayers style instance.
 */
function getPolygonStyle(symbolizer) {
  return cachedPolygonStyle(symbolizer);
}

export default getPolygonStyle;
