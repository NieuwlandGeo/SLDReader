import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';
import RadialShape from './RadialShape';

// Todo: make this a global setting.
const RADIAL_SHAPE_SUPPORTED = true;

/**
 * Approximate a partial circle as a radial shape.
 * @private
 * @param {object} options Options.
 * @param {number} startAngle Start angle in radians.
 * @param {number} endAngle End angle in radians.
 * @param {number} radius Symbol radius.
 * @param {ol/style/stroke} stroke OpenLayers Stroke instance.
 * @param {ol/style/fill} fill OpenLayers Fill instance.
 * @param {number} rotation Symbol rotation in radians (clockwise). Default 0.
 * @returns {RadialShape} A RadialShape instance.
 */
function createPartialCircleRadialShape({
  startAngle,
  endAngle,
  radius,
  stroke,
  fill,
  rotation,
}) {
  // Return a square if radial shape is not supported.
  if (!RADIAL_SHAPE_SUPPORTED) {
    return new RegularShape({
      angle: Math.PI / 4,
      fill,
      points: 4,
      // For square, scale radius so the height of the square equals the given size.
      radius: radius * Math.sqrt(2.0),
      stroke,
      rotation: rotation ?? 0.0,
    });
  }

  let a1 = startAngle;
  let a2 = endAngle;
  if (a2 < a1) {
    [a2, a1] = [a1, a2];
  }

  const RESOLUTION = 96; // Number of points for a half circle.
  const numPoints = Math.ceil((RESOLUTION * (endAngle - startAngle)) / Math.PI);
  const radii = [0];
  const angles = [0];
  for (let k = 0; k <= numPoints; k += 1) {
    const deltaAngle = (endAngle - startAngle) / numPoints;
    radii.push(radius);
    angles.push(startAngle + k * deltaAngle);
  }

  return new RadialShape({
    radii,
    angles,
    stroke,
    fill,
    rotation: rotation ?? 0.0,
  });
}

/**
 * Create a radial shape from symbol coordinates in the unit square, scaled by radius.
 * @private
 * @param {object} options Options.
 * @param {Array<Array<number>>} coordinates Unit coordinates in counter-clockwise order.
 * @param {number} radius Symbol radius.
 * @param {ol/style/stroke} stroke OpenLayers Stroke instance.
 * @param {ol/style/fill} fill OpenLayers Fill instance.
 * @param {number} rotation Symbol rotation in radians (clockwise). Default 0.
 * @returns {RadialShape} A RadialShape instance.
 */
function radialShapeFromUnitCoordinates({
  coordinates,
  radius,
  stroke,
  fill,
  rotation,
}) {
  // Return a square if radial shape is not supported.
  if (!RADIAL_SHAPE_SUPPORTED) {
    return new RegularShape({
      angle: Math.PI / 4,
      fill,
      points: 4,
      // For square, scale radius so the height of the square equals the given size.
      radius: radius * Math.sqrt(2.0),
      stroke,
      rotation: rotation ?? 0.0,
    });
  }

  // Convert unit coordinates and radius to polar coordinate representation.
  const radii = [];
  const angles = [];
  coordinates.forEach(([x, y]) => {
    const polarRadius = radius * Math.sqrt(x * x + y * y);
    let polarAngle = Math.atan2(y, x);
    if (polarAngle < 2) {
      polarAngle += 2 * Math.PI;
    }
    radii.push(polarRadius);
    angles.push(polarAngle);
  });

  return new RadialShape({
    radii,
    angles,
    stroke,
    fill,
    rotation: rotation ?? 0.0,
  });
}

/**
 * @private
 * Create an OL point style corresponding to a well known symbol identifier.
 * @param {string} wellKnownName SLD Well Known Name for symbolizer.
 * Can be 'circle', 'square', 'triangle', 'star', 'cross', 'x', 'hexagon', 'octagon'.
 * @param {number} size Symbol size in pixels.
 * @param {ol/style/stroke} stroke OpenLayers Stroke instance.
 * @param {ol/style/fill} fill OpenLayers Fill instance.
 * @param {number} rotationDegrees Symbol rotation in degrees (clockwise). Default 0.
 */
function getWellKnownSymbol(
  wellKnownName,
  size,
  stroke,
  fill,
  rotationDegrees = 0.0
) {
  const radius = size / 2;
  const rotationRadians = (Math.PI * rotationDegrees) / 180.0;

  let fillColor;
  if (fill && fill.getColor()) {
    fillColor = fill.getColor();
  }

  switch (wellKnownName) {
    case 'circle':
      return new Circle({
        fill,
        radius,
        stroke,
      });

    case 'shape://dot':
      return new Circle({
        fill,
        radius: radius / 8,
        stroke,
      });

    case 'equilateral_triangle':
    case 'triangle':
      return new RegularShape({
        fill,
        points: 3,
        radius,
        stroke,
        rotation: rotationRadians,
      });

    case 'star':
      return new RegularShape({
        fill,
        points: 5,
        radius,
        radius2: radius / 2.5,
        stroke,
        rotation: rotationRadians,
      });

    case 'shape://plus':
    case 'cross':
      return new RegularShape({
        fill,
        points: 4,
        radius,
        radius2: 0,
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    case 'pentagon':
      return new RegularShape({
        fill,
        points: 5,
        radius,
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    case 'hexagon':
      return new RegularShape({
        fill,
        points: 6,
        radius,
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    case 'octagon':
      return new RegularShape({
        angle: Math.PI / 8,
        fill,
        points: 8,
        radius: radius / Math.cos(Math.PI / 8),
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    case 'shape://times':
    case 'cross2': // cross2 is used by QGIS for the x symbol.
    case 'x':
      return new RegularShape({
        angle: Math.PI / 4,
        fill,
        points: 4,
        radius: Math.sqrt(2.0) * radius,
        radius2: 0,
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    case 'diamond':
      return new RegularShape({
        fill,
        points: 4,
        radius,
        stroke,
        rotation: rotationRadians,
      });

    case 'shape://horline':
    case 'horline':
      return new RegularShape({
        fill,
        points: 2,
        radius,
        angle: Math.PI / 2,
        stroke,
        rotation: rotationRadians,
      });

    case 'shape://vertline':
    case 'line':
      return new RegularShape({
        fill,
        points: 2,
        radius,
        angle: 0,
        stroke,
        rotation: rotationRadians,
      });

    case 'shape://backslash':
    case 'backslash':
      return new RegularShape({
        fill,
        points: 2,
        radius: radius * Math.sqrt(2),
        angle: -Math.PI / 4,
        stroke,
        rotation: rotationRadians,
      });

    case 'shape://slash':
    case 'slash':
      return new RegularShape({
        fill,
        points: 2,
        radius: radius * Math.sqrt(2),
        angle: Math.PI / 4,
        stroke,
        rotation: rotationRadians,
      });

    // Symbols that cannot be represented by RegularShape.
    // These are implemented by the custom RadialShape class.
    case 'shape://carrow':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 0],
          [-1, 0.4],
          [-1, -0.4],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'shape://oarrow':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 0],
          [-1, 0.4],
          [0, 0],
          [-1, -0.4],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'cross_fill':
      return radialShapeFromUnitCoordinates({
        coordinates: [
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
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'arrow':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 1],
          [-0.5, 0.5],
          [-0.25, 0.5],
          [-0.25, -1],
          [0.25, -1],
          [0.25, 0.5],
          [0.5, 0.5],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'filled_arrowhead':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 0],
          [-1, 1],
          [-1, -1],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'arrowhead':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 0],
          [-1, 1],
          [0, 0],
          [-1, -1],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'quarter_square':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 0],
          [0, 1],
          [-1, 1],
          [-1, 0],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'half_square':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 1],
          [-1, 1],
          [-1, -1],
          [0, -1],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'diagonal_half_square':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [-1, 1],
          [-1, -1],
          [1, -1],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    // In QGIS, right_half_triangle apparently means "skip the right half of the triangle".
    case 'right_half_triangle':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 1],
          [-1, -1],
          [0, -1],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'left_half_triangle':
      return radialShapeFromUnitCoordinates({
        coordinates: [
          [0, 1],
          [0, -1],
          [1, -1],
        ],
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'semi_circle':
      return createPartialCircleRadialShape({
        startAngle: 0,
        endAngle: Math.PI,
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'third_circle':
      return createPartialCircleRadialShape({
        startAngle: Math.PI / 2,
        endAngle: 7 * Math.PI / 6,
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'quarter_circle':
      return createPartialCircleRadialShape({
        startAngle: Math.PI / 2,
        endAngle: Math.PI,
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    // Default for unknown wellknownname is a square.
    default:
      // Default is `square`
      return new RegularShape({
        angle: Math.PI / 4,
        fill,
        points: 4,
        // For square, scale radius so the height of the square equals the given size.
        radius: radius * Math.sqrt(2.0),
        stroke,
        rotation: rotationRadians,
      });
  }
}

export default getWellKnownSymbol;
