/* eslint-disable function-call-argument-newline */
import { toContext } from 'ol/render';
import { Style, Fill } from 'ol/style';
import { Point, Polygon, MultiPolygon } from 'ol/geom';
import { DEVICE_PIXEL_RATIO } from 'ol/has';

import {
  IMAGE_LOADING,
  IMAGE_LOADED,
  IMAGE_ERROR,
  DEFAULT_MARK_SIZE,
} from '../constants';
import { memoizeStyleFunction } from './styleUtils';
import { getCachedImage, getImageLoadingState } from '../imageCache';
import { imageLoadingPolygonStyle, imageErrorPolygonStyle } from './static';
import { getSimpleStroke, getSimpleFill } from './simpleStyles';
import { getGraphicStrokeRenderer } from './graphicStrokeStyle';
import getPointStyle from './pointStyle';

function createPattern(graphic) {
  const { image, width, height } = getCachedImage(
    graphic.externalgraphic.onlineresource
  );
  const cnv = document.createElement('canvas');
  const ctx = cnv.getContext('2d');

  // Calculate image scale factor.
  let imageRatio = DEVICE_PIXEL_RATIO;
  if (graphic.size && height !== graphic.size) {
    imageRatio *= graphic.size / height;
  }

  // Draw image to canvas directly if no scaling necessary.
  if (imageRatio === 1) {
    return ctx.createPattern(image, 'repeat');
  }

  // Scale the image by drawing onto a temp canvas.
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

function getExternalGraphicFill(symbolizer) {
  const { graphic } = symbolizer.fill.graphicfill;
  const fillImageUrl = graphic.externalgraphic.onlineresource;

  // Use fallback style when graphicfill image hasn't been loaded yet.
  switch (getImageLoadingState(fillImageUrl)) {
    case IMAGE_LOADED:
      return new Fill({
        color: createPattern(symbolizer.fill.graphicfill.graphic),
      });
    case IMAGE_LOADING:
      return imageLoadingPolygonStyle.getFill();
    case IMAGE_ERROR:
      return imageErrorPolygonStyle.getFill();
    default:
      // Load state of an image should be known at this time, but return 'loading' style as fallback.
      return imageLoadingPolygonStyle.getFill();
  }
}

function getMarkGraphicFill(symbolizer) {
  const { graphicfill } = symbolizer.fill;
  const { graphic } = graphicfill;
  const graphicSize = graphic.size || DEFAULT_MARK_SIZE;
  const canvasSize = graphicSize * DEVICE_PIXEL_RATIO;
  let fill = null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const context = canvas.getContext('2d');

    // Point symbolizer function expects an object with a .graphic property.
    // The point symbolizer is stored as graphicfill in the polygon symbolizer.
    const pointStyle = getPointStyle(graphicfill);

    // Let OpenLayers draw a point with the given point style on the temp canvas.
    // Note: OL rendering context size params are always in css pixels, while the temp canvas may
    // be larger depending on the device pixel ratio.
    const olContext = toContext(context, { size: [graphicSize, graphicSize] });

    // Disable image smoothing to ensure crisp graphic fill pattern.
    context.imageSmoothingEnabled = false;

    // Let OpenLayers draw the symbol to the canvas directly.
    // Draw extra copies to the sides to ensure complete tiling coverage when used as a pattern.
    // S = symbol, C = copy.
    //     +---+
    //     | C |
    // +---+---+---+
    // | C | S | C |
    // +---+---+---+
    //     | C |
    //     +---+
    olContext.setStyle(pointStyle);
    olContext.drawGeometry(new Point([graphicSize / 2, graphicSize / 2]));
    olContext.drawGeometry(new Point([-(graphicSize / 2), graphicSize / 2]));
    olContext.drawGeometry(new Point([3 * (graphicSize / 2), graphicSize / 2]));
    olContext.drawGeometry(new Point([graphicSize / 2, -(graphicSize / 2)]));
    olContext.drawGeometry(new Point([graphicSize / 2, 3 * (graphicSize / 2)]));

    // Turn the generated image into a repeating pattern, just like a regular image fill.
    const pattern = context.createPattern(canvas, 'repeat');
    fill = new Fill({
      color: pattern,
    });
  } catch (e) {
    // Default black fill as backup plan.
    fill = new Fill({
      color: 'black',
    });
  }

  return fill;
}

function polygonStyle(symbolizer) {
  const fillImageUrl =
    symbolizer.fill &&
    symbolizer.fill.graphicfill &&
    symbolizer.fill.graphicfill.graphic &&
    symbolizer.fill.graphicfill.graphic.externalgraphic &&
    symbolizer.fill.graphicfill.graphic.externalgraphic.onlineresource;

  const fillMark =
    symbolizer.fill &&
    symbolizer.fill.graphicfill &&
    symbolizer.fill.graphicfill.graphic &&
    symbolizer.fill.graphicfill.graphic.mark;

  let polygonFill = null;
  if (fillImageUrl) {
    polygonFill = getExternalGraphicFill(symbolizer);
  } else if (fillMark) {
    polygonFill = getMarkGraphicFill(symbolizer);
  } else {
    polygonFill = getSimpleFill(symbolizer.fill);
  }

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
