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
  const radius = 0.5 * parseFloat(size);
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
        radius1: radius,
        radius2: radius / 2.5,
        stroke,
        rotation: rotationRadians,
      });

    case 'cross':
      return new RegularShape({
        fill,
        points: 4,
        radius1: radius,
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
        fill,
        points: 8,
        radius,
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    case 'x':
      return new RegularShape({
        angle: Math.PI / 4,
        fill,
        points: 4,
        radius1: radius,
        radius2: 0,
        stroke:
          stroke ||
          new Stroke({
            color: fillColor,
            width: radius / 2,
          }),
        rotation: rotationRadians,
      });

    default:
      // Default is `square`
      return new RegularShape({
        angle: Math.PI / 4,
        fill,
        points: 4,
        // For square, scale radius so the height of the square equals the given size.
        radius1: radius * Math.sqrt(2.0),
        stroke,
        rotation: rotationRadians,
      });
  }
}

export default getWellKnownSymbol;
