import { toContext } from 'ol/render';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';
import RadialShape from './RadialShape';

import { warnOnce } from '../Utils';

const HALF_CIRCLE_RESOLUTION = 96; // Number of points to approximate half a circle as radial shape.

/**
 * Test render a point with an image style (or subclass). Will throw an error if rendering a point fails.
 * @param {ol/styleImage} olImage OpenLayers Image style (or subclass) instance.
 * @returns {void} Does nothing if render succeeds.
 */
function testRenderImageMark(olImage) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d');
  const olContext = toContext(context);
  const olStyle = new Style({ image: olImage });
  olContext.setStyle(olStyle);
  olContext.drawGeometry(new Point([16, 16]));
}

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
  wellKnownName,
  startAngle,
  endAngle,
  radius,
  stroke,
  fill,
  rotation,
}) {
  let a1 = startAngle;
  let a2 = endAngle;
  if (a2 < a1) {
    [a2, a1] = [a1, a2];
  }

  const numPoints = Math.ceil(
    (HALF_CIRCLE_RESOLUTION * (endAngle - startAngle)) / Math.PI
  );
  const radii = [0];
  const angles = [0];
  for (let k = 0; k <= numPoints; k += 1) {
    const deltaAngle = (endAngle - startAngle) / numPoints;
    radii.push(radius);
    angles.push(startAngle + k * deltaAngle);
  }

  try {
    const olImage = new RadialShape({
      radii,
      angles,
      stroke,
      fill,
      rotation: rotation ?? 0.0,
    });
    testRenderImageMark(olImage);
    return olImage;
  } catch (err) {
    // Custom radial shapes only work from OL v10.3.0 onwards,
    // lower versions give errors because RadialShape expects Fill properties that were introduced in v10.3.0.
    warnOnce(
      `Error rendering symbol '${wellKnownName}'. OpenLayers v10.3.0 or higher required. ${err}`
    );
    // When creating a radial shape fails, return default square as fallback.
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
  wellKnownName,
  coordinates,
  radius,
  stroke,
  fill,
  rotation,
}) {
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

  try {
    const olImage = new RadialShape({
      radii,
      angles,
      stroke,
      fill,
      rotation: rotation ?? 0.0,
    });
    testRenderImageMark(olImage);
    return olImage;
  } catch (err) {
    // Custom radial shapes only work from OL v10.3.0 onwards,
    // lower versions give errors because RadialShape expects Fill properties that were introduced in v10.3.0.
    warnOnce(
      `Error rendering symbol '${wellKnownName}'. OpenLayers v10.3.0 or higher required. ${err}`
    );
    // When creating a radial shape fails, return default square as fallback.
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
        stroke,
        rotation: rotationRadians,
      });

    case 'pentagon':
      return new RegularShape({
        fill,
        points: 5,
        radius,
        stroke,
        rotation: rotationRadians,
      });

    case 'hexagon':
      return new RegularShape({
        fill,
        points: 6,
        radius,
        stroke,
        rotation: rotationRadians,
      });

    case 'octagon':
      return new RegularShape({
        angle: Math.PI / 8,
        fill,
        points: 8,
        radius: radius / Math.cos(Math.PI / 8),
        stroke,
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
        stroke,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
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
        wellKnownName,
        startAngle: 0,
        endAngle: Math.PI,
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'third_circle':
      return createPartialCircleRadialShape({
        wellKnownName,
        startAngle: Math.PI / 2,
        endAngle: (7 * Math.PI) / 6,
        radius,
        stroke,
        fill,
        rotation: rotationRadians,
      });

    case 'quarter_circle':
      return createPartialCircleRadialShape({
        wellKnownName,
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
