import { containsCoordinate } from 'ol/extent';

import { PLACEMENT_FIRSTPOINT, PLACEMENT_LASTPOINT } from '../constants';

function calculatePointsDistance(coord1, coord2) {
  const dx = coord1[0] - coord2[0];
  const dy = coord1[1] - coord2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateSplitPointCoords(startCoord, endCoord, distanceFromStart) {
  const distanceBetweenNodes = calculatePointsDistance(startCoord, endCoord);
  const d = distanceFromStart / distanceBetweenNodes;
  const x = startCoord[0] + (endCoord[0] - startCoord[0]) * d;
  const y = startCoord[1] + (endCoord[1] - startCoord[1]) * d;
  return [x, y];
}

/**
 * Calculate the angle of a vector in radians clockwise from the positive x-axis.
 * Example: (0,0) -> (1,1) --> -pi/4 radians.
 * @private
 * @param {Array<number>} p1 Start of the line segment as [x,y].
 * @param {Array<number>} p2 End of the line segment as [x,y].
 * @param {boolean} invertY If true, calculate with Y-axis pointing downwards.
 * @returns {number} Angle in radians, clockwise from the positive x-axis.
 */
function calculateAngle(p1, p2, invertY) {
  const dX = p2[0] - p1[0];
  const dY = p2[1] - p1[1];
  const angle = -Math.atan2(invertY ? -dY : dY, dX);
  return angle;
}

// eslint-disable-next-line import/prefer-default-export
export function splitLineString(geometry, graphicSpacing, options = {}) {
  const coords = geometry.getCoordinates();

  // Handle degenerate cases.
  // LineString without points
  if (coords.length === 0) {
    return [];
  }

  // LineString containing only one point.
  if (coords.length === 1) {
    return [[...coords[0], 0]];
  }

  // Handle first point placement case.
  if (options.placement === PLACEMENT_FIRSTPOINT) {
    const p1 = coords[0];
    const p2 = coords[1];
    return [[p1[0], p1[1], calculateAngle(p1, p2, options.invertY)]];
  }

  // Handle last point placement case.
  if (options.placement === PLACEMENT_LASTPOINT) {
    const p1 = coords[coords.length - 2];
    const p2 = coords[coords.length - 1];
    return [[p2[0], p2[1], calculateAngle(p1, p2, options.invertY)]];
  }

  const totalLength = geometry.getLength();
  const gapSize = Math.max(graphicSpacing, 0.1); // 0.1 px minimum gap size to prevent accidents.

  // Measure along line to place the next point.
  // Can start at a nonzero value if initialGap is used.
  let nextPointMeasure = options.initialGap || 0.0;
  let pointIndex = 0;
  const currentSegmentStart = [...coords[0]];
  const currentSegmentEnd = [...coords[1]];

  // Cumulative measure of the line where each segment's length is added in succession.
  let cumulativeMeasure = 0;

  const splitPoints = [];

  // Keep adding points until the next point measure lies beyond the line length.
  while (nextPointMeasure <= totalLength) {
    const currentSegmentLength = calculatePointsDistance(
      currentSegmentStart,
      currentSegmentEnd
    );
    if (cumulativeMeasure + currentSegmentLength < nextPointMeasure) {
      // If the current segment is too short to reach the next point, go to the next segment.
      if (pointIndex === coords.length - 2) {
        // Stop if there is no next segment to process.
        break;
      }
      currentSegmentStart[0] = currentSegmentEnd[0];
      currentSegmentStart[1] = currentSegmentEnd[1];
      currentSegmentEnd[0] = coords[pointIndex + 2][0];
      currentSegmentEnd[1] = coords[pointIndex + 2][1];
      pointIndex += 1;
      cumulativeMeasure += currentSegmentLength;
    } else {
      // Next point lies on the current segment.
      // Calculate its position and increase next point measure by gap size.
      const distanceFromSegmentStart = nextPointMeasure - cumulativeMeasure;
      const splitPointCoords = calculateSplitPointCoords(
        currentSegmentStart,
        currentSegmentEnd,
        distanceFromSegmentStart
      );
      const angle = calculateAngle(
        currentSegmentStart,
        currentSegmentEnd,
        options.invertY
      );
      if (
        !options.extent ||
        containsCoordinate(options.extent, splitPointCoords)
      ) {
        splitPointCoords.push(angle);
        splitPoints.push(splitPointCoords);
      }
      nextPointMeasure += gapSize;
    }
  }

  return splitPoints;
}
