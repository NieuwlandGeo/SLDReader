/* eslint-disable no-underscore-dangle */
import { Style, Fill, Stroke } from 'ol/style';

import { IMAGE_LOADING, IMAGE_LOADED, IMAGE_ERROR } from '../constants';
import { hexToRGB, memoizeStyleFunction } from './styleUtils';
import { getCachedImage } from '../imageCache';
import { imageLoadingPolygonStyle, imageErrorPolygonStyle } from './static';

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

function polygonStyle(style) {
  if (
    style.fill &&
    style.fill.graphicfill &&
    style.fill.graphicfill.graphic &&
    style.fill.graphicfill.graphic.externalgraphic &&
    style.fill.graphicfill.graphic.externalgraphic.onlineresource
  ) {
    // Check symbolizer metadata to see if the image has already been loaded.
    switch (style.__loadingState) {
      case IMAGE_LOADED:
        return new Style({
          fill: new Fill({
            color: createPattern(style.fill.graphicfill.graphic),
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

  const stroke = style.stroke && style.stroke.styling;
  const fill = style.fill && style.fill.styling;
  return new Style({
    fill:
      fill &&
      new Fill({
        color:
          fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
            ? hexToRGB(fill.fill, fill.fillOpacity)
            : fill.fill,
      }),
    stroke:
      stroke &&
      new Stroke({
        color:
          stroke.strokeOpacity &&
          stroke.stroke &&
          stroke.stroke.slice(0, 1) === '#'
            ? hexToRGB(stroke.stroke, stroke.strokeOpacity)
            : stroke.stroke || '#3399CC',
        width: stroke.strokeWidth || 1.25,
        lineCap: stroke.strokeLinecap && stroke.strokeLinecap,
        lineDash: stroke.strokeDasharray && stroke.strokeDasharray.split(' '),
        lineDashOffset: stroke.strokeDashoffset && stroke.strokeDashoffset,
        lineJoin: stroke.strokeLinejoin && stroke.strokeLinejoin,
      }),
  });
}

const cachedPolygonStyle = memoizeStyleFunction(polygonStyle);
function getPolygonStyle(symbolizer /* , feature, options = {} */) {
  return cachedPolygonStyle(symbolizer);
}

export default getPolygonStyle;
