// Custom symbols that cannot be represented as RegularShape.
// Coordinates are normalized within a [-1,-1,1,1] square and will be scaled by size/2 when rendered.
// Shapes are auto-closed, so no need to make the last coordinate equal to the first.
const customSymbols = {
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

export function getCustomSymbolCoordinates(name) {
  return customSymbols[name];
}
