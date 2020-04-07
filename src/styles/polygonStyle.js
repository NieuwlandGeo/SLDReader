import { toContext } from 'ol/render';
import { Style, Fill } from 'ol/style';
import { Polygon, MultiPolygon } from 'ol/geom';

import { IMAGE_LOADING, IMAGE_LOADED, IMAGE_ERROR } from '../constants';
import { memoizeStyleFunction } from './styleUtils';
import { getCachedImage, getImageLoadingState } from '../imageCache';
import { imageLoadingPolygonStyle, imageErrorPolygonStyle } from './static';
import { getSimpleStroke, getSimpleFill } from './simpleStyles';
import { getGraphicStrokeRenderer } from './graphicStrokeStyle';

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
  const fillImageUrl =
    symbolizer.fill &&
    symbolizer.fill.graphicfill &&
    symbolizer.fill.graphicfill.graphic &&
    symbolizer.fill.graphicfill.graphic.externalgraphic &&
    symbolizer.fill.graphicfill.graphic.externalgraphic.onlineresource;

  if (fillImageUrl) {
    // Use fallback style when graphicfill image hasn't been loaded yet.
    switch (getImageLoadingState(fillImageUrl)) {
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
        // Load state of an image should be known at this time, but return 'loading' style as fallback.
        return imageLoadingPolygonStyle;
    }
  }

  const polygonFill = getSimpleFill(symbolizer.fill);

  // When a polygon has a GraphicStroke, use a custom renderer to combine
  // GraphicStroke with fill. This is needed because a custom renderer
  // ignores any stroke, fill and image present in the style.
  if (symbolizer.stroke && symbolizer.stroke.graphicstroke) {
    const renderGraphicStroke = getGraphicStrokeRenderer(symbolizer);
    return new Style({
      renderer: (pixelCoords, renderState) => {
        // First render the fill (if any).
        if (polygonFill) {
          const { feature, context } = renderState;
          const render = toContext(context);
          render.setFillStrokeStyle(polygonFill, undefined);
          const geometryType = feature.getGeometry().getType();
          if (geometryType === 'Polygon') {
            render.drawPolygon(new Polygon(pixelCoords));
          } else if (geometryType === 'MultiPolygon') {
            render.drawMultiPolygon(new MultiPolygon(pixelCoords));
          }
        }

        // Then, render the graphic stroke.
        renderGraphicStroke(pixelCoords, renderState);
      },
    });
  }

  const polygonStroke = getSimpleStroke(symbolizer.stroke);

  return new Style({
    fill: polygonFill,
    stroke: polygonStroke,
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
