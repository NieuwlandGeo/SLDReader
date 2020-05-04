import { Style } from 'ol/style';
import { toContext } from 'ol/render';
import { Point, LineString } from 'ol/geom';
import { containsCoordinate } from 'ol/extent';

import { DEFAULT_MARK_SIZE, DEFAULT_EXTERNALGRAPHIC_SIZE } from '../constants';
import evaluate from '../olEvaluator';
import getPointStyle from './pointStyle';

function splitLineString(geometry, minSegmentLength, options) {
  function calculatePointsDistance(coord1, coord2) {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function calculateSplitPointCoords(
    startNode,
    nextNode,
    distanceBetweenNodes,
    distanceToSplitPoint
  ) {
    const d = distanceToSplitPoint / distanceBetweenNodes;
    const x = nextNode[0] + (startNode[0] - nextNode[0]) * d;
    const y = nextNode[1] + (startNode[1] - nextNode[1]) * d;
    return [x, y];
  }

  function calculateAngle(startNode, nextNode, alwaysUp) {
    const x = startNode[0] - nextNode[0];
    const y = startNode[1] - nextNode[1];
    let angle = Math.atan(x / y);
    if (!alwaysUp) {
      if (y > 0) {
        angle += Math.PI;
      } else if (x < 0) {
        angle += Math.PI * 2;
      }
      // angle = y > 0 ? angle + Math.PI : x < 0 ? angle + Math.PI * 2 : angle;
    }
    return angle;
  }

  const splitPoints = [];
  const coords = geometry.getCoordinates();

  let coordIndex = 0;
  let startPoint = coords[coordIndex];
  let nextPoint = coords[coordIndex + 1];
  let angle = calculateAngle(startPoint, nextPoint, options.alwaysUp);

  const n = Math.ceil(geometry.getLength() / minSegmentLength);
  const segmentLength = geometry.getLength() / n;
  let currentSegmentLength = options.midPoints
    ? segmentLength / 2
    : segmentLength;

  for (let i = 0; i <= n; i += 1) {
    const distanceBetweenPoints = calculatePointsDistance(
      startPoint,
      nextPoint
    );
    currentSegmentLength += distanceBetweenPoints;

    if (currentSegmentLength < segmentLength) {
      coordIndex += 1;
      if (coordIndex < coords.length - 1) {
        startPoint = coords[coordIndex];
        nextPoint = coords[coordIndex + 1];
        angle = calculateAngle(startPoint, nextPoint, options.alwaysUp);
        i -= 1;
        // continue;
      } else {
        if (!options.midPoints) {
          const splitPointCoords = nextPoint;
          if (
            !options.extent ||
            containsCoordinate(options.extent, splitPointCoords)
          ) {
            splitPointCoords.push(angle);
            splitPoints.push(splitPointCoords);
          }
        }
        break;
      }
    } else {
      const distanceToSplitPoint = currentSegmentLength - segmentLength;
      const splitPointCoords = calculateSplitPointCoords(
        startPoint,
        nextPoint,
        distanceBetweenPoints,
        distanceToSplitPoint
      );
      startPoint = splitPointCoords.slice();
      if (
        !options.extent ||
        containsCoordinate(options.extent, splitPointCoords)
      ) {
        splitPointCoords.push(angle);
        splitPoints.push(splitPointCoords);
      }
      currentSegmentLength = 0;
    }
  }

  return splitPoints;
}

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
  // eslint-disable-next-line
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
 * @param {ol/render/canvas/Immediate} render Instance of CanvasImmediateRenderer used to paint stroke marks directly to the canvas.
 * @param {Array<Array<number>>} pixelCoords A line as array of [x,y] point coordinate arrays in pixel space.
 * @param {number} minSegmentLength Minimum segment length in pixels for distributing stroke marks along the line.
 * @param {ol/style/Style} pointStyle OpenLayers style instance used for rendering stroke marks.
 * @param {number} pixelRatio Ratio of device pixels to css pixels.
 * @returns {void}
 */
function renderStrokeMarks(render, pixelCoords, minSegmentLength, pointStyle, pixelRatio) {
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
        minSegmentLength,
        pointStyle,
        pixelRatio
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
    minSegmentLength * pixelRatio,
    { alwaysUp: true, midPoints: false, extent: render.extent_ }
  );

  splitPoints.forEach(point => {
    const splitPointAngle = image.getRotation() - point[2];
    render.setImageStyle2(image, splitPointAngle);
    render.drawPoint(new Point([point[0] / pixelRatio, point[1] / pixelRatio]));
  });
}

/**
 * Create a renderer function for renderining GraphicStroke marks
 * to be used inside an OpenLayers Style.renderer function.
 * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
 * @returns {ol/style/Style~RenderFunction} A style renderer function (pixelCoords, renderState) => void.
 */
export function getGraphicStrokeRenderer(linesymbolizer) {
  if (!(linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke)) {
    throw new Error(
      'getGraphicStrokeRenderer error: symbolizer.stroke.graphicstroke null or undefined.'
    );
  }

  const { graphicstroke, styling } = linesymbolizer.stroke;
  // Use strokeDasharray to space graphics. First digit represents size of graphic, second the relative space, e.g.
  // size = 20, dash = [2 6] -> 2 ~ 20 then 6 ~ 60, total segment length should be 20 + 60 = 80
  let multiplier = 1; // default, i.e. a segment is the size of the graphic (without stroke/outline).
  if (styling && styling.strokeDasharray) {
    const dash = styling.strokeDasharray.split(' ');
    if (dash.length >= 2 && dash[0] !== 0) {
      multiplier = dash[1] / dash[0] + 1;
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

    const pointStyle = getPointStyle(graphicstroke, renderState.feature);
    const graphicSize =
      (graphicstroke.graphic && graphicstroke.graphic.size) ||
      defaultGraphicSize;
    const pointSize = Number(evaluate(graphicSize, renderState.feature));
    const minSegmentLength = multiplier * pointSize;

    renderStrokeMarks(render, pixelCoords, minSegmentLength, pointStyle, pixelRatio);
  };
}

/**
 * Create an OpenLayers style for rendering line symbolizers with a GraphicStroke.
 * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
 * @returns {ol/style/Style} An OpenLayers style instance.
 */
function getGraphicStrokeStyle(linesymbolizer) {
  if (!(linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke)) {
    throw new Error(
      'getGraphicStrokeStyle error: linesymbolizer.stroke.graphicstroke null or undefined.'
    );
  }

  return new Style({
    renderer: getGraphicStrokeRenderer(linesymbolizer),
  });
}

export default getGraphicStrokeStyle;
