/* eslint-disable no-underscore-dangle */
import { Style, Stroke } from 'ol/style';
import { toContext } from 'ol/render';
import { Point, LineString } from 'ol/geom';
import { containsCoordinate } from 'ol/extent';

import { hexToRGB, memoizeStyleFunction } from './styleUtils';
import { DEFAULT_POINT_SIZE } from '../constants';
import { expressionOrDefault } from '../olEvaluator';
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
  rendererProto.setImageStyle2 = function(imageStyle, rotation) {
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
 * @private
 * @param  {LineSymbolizer} linesymbolizer [description]
 * @return {object} openlayers style
 */
function lineStyle(linesymbolizer) {
  let style = {};
  if (linesymbolizer.stroke) {
    style = linesymbolizer.stroke.styling;

    if (linesymbolizer.stroke.graphicstroke) {
      return new Style({
        renderer: (pixelCoords, renderState) => {
          // TODO: Error handling, alternatives, etc.
          const render = toContext(renderState.context);
          patchRenderer(render);

          const pointStyle = getPointStyle(
            linesymbolizer.stroke.graphicstroke,
            renderState.feature
          );

          const size = expressionOrDefault(
            linesymbolizer.stroke.graphicstroke.graphic.size,
            DEFAULT_POINT_SIZE
          );
          let multiplier = 1; // default, i.e. a segment is the size of the graphic (without stroke/outline).

          // Use strokeDasharray to space graphics. First digit represents size of graphic, second the relative space, e.g.
          // size = 20, dash = [2 6] -> 2 ~ 20 then 6 ~ 60, total segment length should be 20 + 60 = 80
          if (
            linesymbolizer.stroke.styling &&
            linesymbolizer.stroke.styling.strokeDasharray
          ) {
            const dash = linesymbolizer.stroke.styling.strokeDasharray.split(
              ' '
            );
            if (dash.length >= 2 && dash[0] !== 0) {
              multiplier = dash[1] / dash[0] + 1;
            }
          }

          const splitPoints = splitLineString(
            new LineString(pixelCoords),
            multiplier * size,
            { alwaysUp: true, midPoints: false, extent: render.extent_ }
          );
          splitPoints.forEach(point => {
            const image = pointStyle.getImage();
            const splitPointAngle = image.getRotation() - point[2];
            render.setImageStyle2(image, splitPointAngle);
            render.drawPoint(new Point([point[0], point[1]]));
          });
        },
      });
    }
  }
  return new Style({
    stroke: new Stroke({
      color:
        style.strokeOpacity && style.stroke && style.stroke.slice(0, 1) === '#'
          ? hexToRGB(style.stroke, style.strokeOpacity)
          : style.stroke || '#3399CC',
      width: style.strokeWidth || 1.25,
      lineCap: style.strokeLinecap && style.strokeLinecap,
      lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
      lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
      lineJoin: style.strokeLinejoin && style.strokeLinejoin,
    }),
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
