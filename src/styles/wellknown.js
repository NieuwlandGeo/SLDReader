import { Stroke, Circle, RegularShape } from 'ol/style';

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

    case 'horline':
      return new RegularShape({
        fill,
        points: 2,
        radius,
        angle: Math.PI / 2,
        stroke,
        rotation: rotationRadians,
      });

    case 'line':
      return new RegularShape({
        fill,
        points: 2,
        radius,
        angle: 0,
        stroke,
        rotation: rotationRadians,
      });

    case 'backslash':
      return new RegularShape({
        fill,
        points: 2,
        radius: radius * Math.sqrt(2),
        angle: -Math.PI / 4,
        stroke,
        rotation: rotationRadians,
      });

    case 'slash':
      return new RegularShape({
        fill,
        points: 2,
        radius: radius * Math.sqrt(2),
        angle: Math.PI / 4,
        stroke,
        rotation: rotationRadians,
      });

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
