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
import { applyDynamicFillStyling, applyDynamicStrokeStyling } from './dynamicStyles';
import { getGraphicStrokeRenderer } from './graphicStrokeStyle';
import getPointStyle from './pointStyle';
import getQGISBrushFill from './qgisBrushFill';

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

/**
 * Scale mark graphic fill symbol with given scale factor to improve mark fill rendering.
 * Scale factor will be applied to stroke width depending on the original value for visual fidelity.
 * @private
 * @param {object} graphicfill GraphicFill symbolizer object.
 * @param {number} scaleFactor Scale factor.
 * @returns {object} A new GraphifFill symbolizer object with scale factor applied.
 */
function scaleMarkGraphicFill(graphicfill, scaleFactor) {
  if (!graphicfill.graphic) {
    return graphicfill;
  }

  // Create a deep clone of the original symbolizer.
  const newFill = JSON.parse(JSON.stringify(graphicfill));
  const { graphic } = newFill;
  const oriSize = Number(graphic.size) || DEFAULT_MARK_SIZE;
  graphic.size = scaleFactor * oriSize;
  const { mark } = graphic;
  if (mark && mark.stroke) {
    // Apply SLD defaults to stroke parameters.
    // Todo: do this at the SLDReader parsing stage already.
    if (!mark.stroke.styling) {
      mark.stroke.styling = {
        stroke: '#000000',
        strokeWidth: 1.0,
      };
    }

    if (!mark.stroke.styling.strokeWidth) {
      mark.stroke.styling.strokeWidth =
        Number(mark.stroke.styling.strokeWidth) || 1;
    }

    // If original stroke width is 1 or less, do not scale it.
    // This gives better visual results than using a stroke width of 2 and downsizing.
    const oriStrokeWidth = mark.stroke.styling.strokeWidth;
    if (oriStrokeWidth > 1) {
      mark.stroke.styling.strokeWidth = scaleFactor * oriStrokeWidth;
    }
  }

  return newFill;
}

function getMarkGraphicFill(symbolizer) {
  const { graphicfill } = symbolizer.fill;
  const { graphic } = graphicfill;
  const { mark } = graphic;
  const { wellknownname } = mark || {};

  // If it's a QGIS brush fill, use direct pixel manipulation to create the fill.
  if (wellknownname && wellknownname.indexOf('brush://') === 0) {
    let brushFillColor = '#000000';
    if (mark.fill && mark.fill.styling && mark.fill.styling.fill) {
      brushFillColor = mark.fill.styling.fill;
    }
    return getQGISBrushFill(wellknownname, brushFillColor);
  }

  // Create mark graphic fill by drawing a single mark on a square canvas.
  const graphicSize = Number(graphic.size) || DEFAULT_MARK_SIZE;
  const canvasSize = graphicSize * DEVICE_PIXEL_RATIO;
  let fill = null;

  // The graphic symbol will be rendered at a larger size and then scaled back to the graphic size.
  // This is done to mitigate visual artifacts that occur when drawing between pixels.
  const scaleFactor = 2.0;

  try {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = canvasSize * scaleFactor;
    scaledCanvas.height = canvasSize * scaleFactor;
    const context = scaledCanvas.getContext('2d');

    // Point symbolizer function expects an object with a .graphic property.
    // The point symbolizer is stored as graphicfill in the polygon symbolizer.
    const scaledGraphicFill = scaleMarkGraphicFill(graphicfill, scaleFactor);
    const pointStyle = getPointStyle(scaledGraphicFill);

    // Let OpenLayers draw a point with the given point style on the temp canvas.
    // Note: OL rendering context size params are always in css pixels, while the temp canvas may
    // be larger depending on the device pixel ratio.
    const olContext = toContext(context, {
      size: [graphicSize * scaleFactor, graphicSize * scaleFactor],
    });

    // Disable image smoothing to ensure crisp graphic fill pattern.
    context.imageSmoothingEnabled = false;

    // Let OpenLayers draw the symbol to the canvas directly.
    olContext.setStyle(pointStyle);

    const centerX = scaleFactor * (graphicSize / 2);
    const centerY = scaleFactor * (graphicSize / 2);
    olContext.drawGeometry(new Point([centerX, centerY]));

    // For (back)slash marks, draw extra copies to the sides to ensure complete tiling coverage when used as a pattern.
    // S = symbol, C = copy.
    //     +---+
    //     | C |
    // +---+---+---+
    // | C | S | C |
    // +---+---+---+
    //     | C |
    //     +---+
    if (wellknownname && wellknownname.indexOf('slash') > -1) {
      olContext.drawGeometry(
        new Point([centerX - scaleFactor * graphicSize, centerY])
      );
      olContext.drawGeometry(
        new Point([centerX + scaleFactor * graphicSize, centerY])
      );
      olContext.drawGeometry(
        new Point([centerX, centerY - scaleFactor * graphicSize])
      );
      olContext.drawGeometry(
        new Point([centerX, centerY + scaleFactor * graphicSize])
      );
    }

    // Downscale the drawn mark back to original graphic size.
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = canvasSize;
    patternCanvas.height = canvasSize;
    const patternContext = patternCanvas.getContext('2d');
    patternContext.drawImage(
      scaledCanvas,
      0,
      0,
      canvasSize * scaleFactor,
      canvasSize * scaleFactor,
      0,
      0,
      canvasSize,
      canvasSize
    );

    // Turn the generated image into a repeating pattern, just like a regular image fill.
    const pattern = patternContext.createPattern(patternCanvas, 'repeat');
    fill = new Fill({
      color: pattern,
    });
  } catch (e) {
    // Default black fill as backup plan.
    fill = new Fill({
      color: '#000000',
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
function getPolygonStyle(symbolizer, feature, getProperty) {
  const olStyle = cachedPolygonStyle(symbolizer);

  // Apply dynamic properties.
  applyDynamicFillStyling(olStyle, symbolizer, feature, getProperty);
  applyDynamicStrokeStyling(olStyle, symbolizer, feature, getProperty);

  return olStyle;
}

export default getPolygonStyle;
