import { containsCoordinate } from 'ol/extent';

import { PLACEMENT_FIRSTPOINT, PLACEMENT_LASTPOINT } from '../constants';

// eslint-disable-next-line import/prefer-default-export
export function splitLineString(geometry, graphicSpacing, options) {
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

  /**
   * Calculate the angle of a vector in radians clockwise from the positive x-axis.
   * Example: (0,0) -> (1,1) --> -pi/4 radians.
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

  const coords = geometry.getCoordinates();

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

  // Without placement vendor options, draw regularly spaced GraphicStroke markers.
  const splitPoints = [];
  let coordIndex = 0;
  let startPoint = coords[coordIndex];
  let nextPoint = coords[coordIndex + 1];
  let angle = calculateAngle(startPoint, nextPoint, options.invertY);

  const n = Math.ceil(geometry.getLength() / graphicSpacing);
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
        angle = calculateAngle(startPoint, nextPoint, options.invertY);
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
