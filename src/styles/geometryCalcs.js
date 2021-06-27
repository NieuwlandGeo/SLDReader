import { containsCoordinate } from 'ol/extent';

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
