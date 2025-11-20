// Some constants used for QGIS symbols.
// See also: https://github.com/qgis/QGIS/blob/master/src/core/symbology/qgsmarkersymbollayer.cpp
const VERTEX_OFFSET_FROM_ORIGIN = 0.6072;
const THICKNESS = 0.3;
const HALF_THICKNESS = THICKNESS / 2.0;
const INTERSECTION_POINT = THICKNESS / Math.SQRT2;
const DIAGONAL1 = Math.SQRT1_2 - INTERSECTION_POINT * 0.5;
const DIAGONAL2 = Math.SQRT1_2 + INTERSECTION_POINT * 0.5;

// Custom symbols that cannot be represented as RegularShape.
// Coordinates are normalized within a [-1,-1,1,1] square and will be scaled by size/2 when rendered.
// Shapes are auto-closed, so no need to make the last coordinate equal to the first.
const customSymbols = {
  // ============
  // QGIS symbols
  // ============
  arrow: [
    [0, 1],
    [-0.5, 0.5],
    [-0.25, 0.5],
    [-0.25, -1],
    [0.25, -1],
    [0.25, 0.5],
    [0.5, 0.5],
  ],
  arrowhead: [
    [0, 0],
    [-1, 1],
    [0, 0],
    [-1, -1],
  ],
  filled_arrowhead: [
    [0, 0],
    [-1, 1],
    [-1, -1],
  ],
  cross_fill: [
    [1, 0.2],
    [0.2, 0.2],
    [0.2, 1],
    [-0.2, 1],
    [-0.2, 0.2],
    [-1, 0.2],
    [-1, -0.2],
    [-0.2, -0.2],
    [-0.2, -1],
    [0.2, -1],
    [0.2, -0.2],
    [1, -0.2],
  ],
  quarter_square: [
    [0, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
  ],
  half_square: [
    [0, 1],
    [-1, 1],
    [-1, -1],
    [0, -1],
  ],
  diagonal_half_square: [
    [-1, 1],
    [-1, -1],
    [1, -1],
  ],
  // In QGIS, right_half_triangle apparently means "skip the right half of the triangle".
  right_half_triangle: [
    [0, 1],
    [-1, -1],
    [0, -1],
  ],
  left_half_triangle: [
    [0, 1],
    [0, -1],
    [1, -1],
  ],
  trapezoid: [
    [0.5, 0.5],
    [1, -0.5],
    [-1, -0.5],
    [-0.5, 0.5],
  ],
  parallelogram_left: [
    [1, -0.5],
    [0.5, 0.5],
    [-1, 0.5],
    [-0.5, -0.5],
  ],
  parallelogram_right: [
    [0.5, -0.5],
    [1, 0.5],
    [-0.5, 0.5],
    [-1, -0.5],
  ],
  square_with_corners: [
    [-VERTEX_OFFSET_FROM_ORIGIN, -1],
    [VERTEX_OFFSET_FROM_ORIGIN, -1],
    [1, -VERTEX_OFFSET_FROM_ORIGIN],
    [1, VERTEX_OFFSET_FROM_ORIGIN],
    [VERTEX_OFFSET_FROM_ORIGIN, 1],
    [-VERTEX_OFFSET_FROM_ORIGIN, 1],
    [-1, VERTEX_OFFSET_FROM_ORIGIN],
    [-1, -VERTEX_OFFSET_FROM_ORIGIN],
  ],
  shield: [
    [1, -0.5],
    [1, 1],
    [-1, 1],
    [-1, -0.5],
    [0, -1],
  ],
  asterisk_fill: [
    [-HALF_THICKNESS, 1],
    [HALF_THICKNESS, 1],
    [HALF_THICKNESS, HALF_THICKNESS + INTERSECTION_POINT],
    [DIAGONAL1, DIAGONAL2],
    [DIAGONAL2, DIAGONAL1],
    [HALF_THICKNESS + INTERSECTION_POINT, HALF_THICKNESS],
    [1, HALF_THICKNESS],
    [1, -HALF_THICKNESS],
    [HALF_THICKNESS + INTERSECTION_POINT, -HALF_THICKNESS],
    [DIAGONAL2, -DIAGONAL1],
    [DIAGONAL1, -DIAGONAL2],
    [HALF_THICKNESS, -HALF_THICKNESS - INTERSECTION_POINT],
    [HALF_THICKNESS, -1],
    [-HALF_THICKNESS, -1],
    [-HALF_THICKNESS, -HALF_THICKNESS - INTERSECTION_POINT],
    [-DIAGONAL1, -DIAGONAL2],
    [-DIAGONAL2, -DIAGONAL1],
    [-HALF_THICKNESS - INTERSECTION_POINT, -HALF_THICKNESS],
    [-1, -HALF_THICKNESS],
    [-1, HALF_THICKNESS],
    [-HALF_THICKNESS - INTERSECTION_POINT, HALF_THICKNESS],
    [-DIAGONAL2, DIAGONAL1],
    [-DIAGONAL1, DIAGONAL2],
    [-HALF_THICKNESS, HALF_THICKNESS + INTERSECTION_POINT],
  ],
  // =================
  // Geoserver symbols
  // =================
  'shape://carrow': [
    [0, 0],
    [-1, 0.4],
    [-1, -0.4],
  ],
  'shape://oarrow': [
    [0, 0],
    [-1, 0.4],
    [0, 0],
    [-1, -0.4],
  ],
};

/**
 * Get registered custom symbol coordinate array.
 * @private
 * @param {string} name Wellknown symbol name.
 * @returns {Array<Array<number>>} Custom symbol coordinates inside the [-1,-1,1,1] square.
 */
export function getCustomSymbolCoordinates(name) {
  return customSymbols[name];
}

/**
 * Register a custom symbol for use as a graphic.
 * Custom symbols are referenced by WellKnownName inside a Mark.
 * Custom symbol coordinates must be entered in counterclockwise order and must all lie within [-1,-1,1,1].
 * The first and last coordinates must not be equal. The shape will be closed automatically.
 * @param {string} wellknownname Custom symbol name.
 * @param {Array<Array<number>>} normalizedCoordinates Array of coordinates.
 * @returns {void}
 */
export function registerCustomSymbol(name, normalizedCoordinates) {
  // Verify that input coordinates lie outside the expected [-1,-1,1,1] square.
  const allInside = normalizedCoordinates.every(
    ([x, y]) => x >= -1 && x <= 1 && y >= -1 && y <= 1
  );
  if (!allInside) {
    throw new Error('Custom symbol coordinates must lie within [-1,-1,1,1].');
  }

  // Verify that input shape is not closed.
  const [x1, y1] = normalizedCoordinates[0];
  const [xN, yN] = normalizedCoordinates[normalizedCoordinates.length - 1];
  if (x1 === xN && y1 === yN) {
    throw new Error(
      'Custom symbol start and end coordinate should not be the same. Custom symbols will close themselves.'
    );
  }

  customSymbols[name] = normalizedCoordinates;
}
