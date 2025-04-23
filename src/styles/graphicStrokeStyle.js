import Style from 'ol/style/Style';
import { toContext } from 'ol/render';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';

import {
  DEFAULT_MARK_SIZE,
  DEFAULT_EXTERNALGRAPHIC_SIZE,
  PLACEMENT_DEFAULT,
  PLACEMENT_FIRSTPOINT,
  PLACEMENT_LASTPOINT,
} from '../constants';
import evaluate from '../olEvaluator';
import getPointStyle from './pointStyle';
import { calculateGraphicSpacing, getInitialGapSize } from './styleUtils';
import { splitLineString } from './geometryCalcs';

// A flag to prevent multiple renderer patches.
let rendererPatched = false;
function patchRenderer(renderer) {
  if (rendererPatched) {
    return;
  }

  // Add setImageStyle2 function that does the same as setImageStyle, except that it sets rotation
  // to a given value instead of taking it from imageStyle.getRotation().
  // This fixes a problem with re-use of the (cached) image style instance when drawing
  // many points inside a single line feature that are aligned according to line segment direction.
  const rendererProto = Object.getPrototypeOf(renderer);
  rendererProto.setImageStyle2 = function (imageStyle, rotation) {
    // First call the original setImageStyle method.
    rendererProto.setImageStyle.call(this, imageStyle);

    // Then set rotation according to the given parameter.
    // This overrides the following line in setImageStyle:
    // this.imageRotation_ = imageStyle.getRotation()
    if (this.image_) {
      this.imageRotation_ = rotation;
    }
  };

  rendererPatched = true;
}

/**
 * Directly render graphic stroke marks for a line onto canvas.
 * @private
 * @param {ol/render/canvas/Immediate} render Instance of CanvasImmediateRenderer used to paint stroke marks directly to the canvas.
 * @param {Array<Array<number>>} pixelCoords A line as array of [x,y] point coordinate arrays in pixel space.
 * @param {number} graphicSpacing The center-to-center distance in pixels for stroke marks distributed along the line.
 * @param {ol/style/Style} pointStyle OpenLayers style instance used for rendering stroke marks.
 * @param {number} pixelRatio Ratio of device pixels to css pixels.
 * @returns {void}
 */
function renderStrokeMarks(
  render,
  pixelCoords,
  graphicSpacing,
  pointStyle,
  pixelRatio,
  options
) {
  if (!pixelCoords) {
    return;
  }

  // The first element of the first pixelCoords entry should be a number (x-coordinate of first point).
  // If it's an array instead, then we're dealing with a multiline or (multi)polygon.
  // In that case, recursively call renderStrokeMarks for each child coordinate array.
  if (Array.isArray(pixelCoords[0][0])) {
    pixelCoords.forEach(pixelCoordsChildArray => {
      renderStrokeMarks(
        render,
        pixelCoordsChildArray,
        graphicSpacing,
        pointStyle,
        pixelRatio,
        options
      );
    });
    return;
  }

  // Line should be a proper line with at least two coordinates.
  if (pixelCoords.length < 2) {
    return;
  }

  // Don't render anything when the pointStyle has no image.
  const image = pointStyle.getImage();
  if (!image) {
    return;
  }

  const splitPoints = splitLineString(
    new LineString(pixelCoords),
    graphicSpacing * pixelRatio,
    {
      invertY: true, // Pixel y-coordinates increase downwards in screen space.
      extent: render.extent_,
      placement: options.placement,
      initialGap: options.initialGap,
      // Use graphic spacing of at least 0.1 px to prevent an infinite number of split points happening by accident.
      minimumGraphicSpacing: 0.1,
    }
  );

  splitPoints.forEach(point => {
    const splitPointAngle = image.getRotation() + point[2];
    render.setImageStyle2(image, splitPointAngle);
    render.drawPoint(new Point([point[0] / pixelRatio, point[1] / pixelRatio]));
  });
}

/**
 * Create a renderer function for renderining GraphicStroke marks
 * to be used inside an OpenLayers Style.renderer function.
 * @private
 * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
 * @returns {ol/style/Style~RenderFunction} A style renderer function (pixelCoords, renderState) => void.
 */
export function getGraphicStrokeRenderer(linesymbolizer) {
  if (!linesymbolizer?.stroke?.graphicstroke) {
    throw new Error(
      'getGraphicStrokeRenderer error: symbolizer.stroke.graphicstroke null or undefined.'
    );
  }

  const { graphicstroke } = linesymbolizer.stroke;

  const options = {
    placement: PLACEMENT_DEFAULT,
  };

  // QGIS vendor options to override graphicstroke symbol placement.
  if (linesymbolizer.vendoroptions) {
    if (linesymbolizer.vendoroptions.placement === 'firstPoint') {
      options.placement = PLACEMENT_FIRSTPOINT;
    } else if (linesymbolizer.vendoroptions.placement === 'lastPoint') {
      options.placement = PLACEMENT_LASTPOINT;
    }
  }

  return (pixelCoords, renderState) => {
    // Abort when feature geometry is (Multi)Point.
    const geometryType = renderState.feature.getGeometry().getType();
    if (geometryType === 'Point' || geometryType === 'MultiPoint') {
      return;
    }

    const pixelRatio = renderState.pixelRatio || 1.0;

    // TODO: Error handling, alternatives, etc.
    const render = toContext(renderState.context);
    patchRenderer(render);

    let defaultGraphicSize = DEFAULT_MARK_SIZE;
    if (graphicstroke.graphic && graphicstroke.graphic.externalgraphic) {
      defaultGraphicSize = DEFAULT_EXTERNALGRAPHIC_SIZE;
    }

    const pointStyle = getPointStyle(graphicstroke, renderState.feature, null);

    // Calculate graphic spacing.
    // Graphic spacing equals the center-to-center distance of graphics along the line.
    // If there's no gap, segment length will be equal to graphic size.
    const graphicSizeExpression =
      graphicstroke?.graphic?.size || defaultGraphicSize;
    const graphicSize = Number(
      evaluate(
        graphicSizeExpression,
        renderState.feature,
        null,
        defaultGraphicSize
      )
    );

    const graphicSpacing = calculateGraphicSpacing(linesymbolizer, graphicSize);
    options.initialGap = getInitialGapSize(linesymbolizer);

    renderStrokeMarks(
      render,
      pixelCoords,
      graphicSpacing,
      pointStyle,
      pixelRatio,
      options
    );
  };
}

/**
 * Create an OpenLayers style for rendering line symbolizers with a GraphicStroke.
 * @private
 * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
 * @returns {ol/style/Style} An OpenLayers style instance.
 */
function getGraphicStrokeStyle(linesymbolizer) {
  if (!linesymbolizer?.stroke?.graphicstroke) {
    throw new Error(
      'getGraphicStrokeStyle error: linesymbolizer.stroke.graphicstroke null or undefined.'
    );
  }

  return new Style({
    renderer: getGraphicStrokeRenderer(linesymbolizer),
  });
}

export default getGraphicStrokeStyle;
