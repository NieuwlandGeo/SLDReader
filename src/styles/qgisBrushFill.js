import { Fill } from 'ol/style';

const dense1Pixels = [[1, 1]];
const dense2Pixels = [
  [0, 0],
  [2, 2],
];
const dense3Pixels = [
  [0, 0],
  [1, 1],
  [2, 2],
  [3, 3],
  [2, 0],
  [0, 2],
];
const dense4Pixels = [
  [0, 0],
  [1, 1],
];

function fillPixels(context, xyCoords) {
  xyCoords.forEach(([x, y]) => {
    context.fillRect(x, y, 1, 1);
  });
}

function clearPixels(context, xyCoords) {
  xyCoords.forEach(([x, y]) => {
    context.clearRect(x, y, 1, 1);
  });
}

function createPixelPattern(size, color, pixels) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.fillStyle = color;
  fillPixels(context, pixels);

  const pattern = context.createPattern(canvas, 'repeat');
  return pattern;
}

function createInversePixelPattern(size, color, pixels) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.fillStyle = color;
  context.fillRect(0, 0, size, size);
  clearPixels(context, pixels);

  const pattern = context.createPattern(canvas, 'repeat');
  return pattern;
}

export default function getQGISBrushFill(brushName, fillColor) {
  let fill = null;
  switch (brushName) {
    case 'brush://dense1':
      fill = new Fill({
        color: createInversePixelPattern(4, fillColor, dense1Pixels),
      });
      break;

    case 'brush://dense2':
      fill = new Fill({
        color: createInversePixelPattern(4, fillColor, dense2Pixels),
      });
      break;

    case 'brush://dense3':
      fill = new Fill({
        color: createInversePixelPattern(4, fillColor, dense3Pixels),
      });
      break;

    case 'brush://dense4':
      fill = new Fill({
        color: createPixelPattern(2, fillColor, dense4Pixels),
      });
      break;

    case 'brush://dense5':
      fill = new Fill({
        color: createPixelPattern(4, fillColor, dense3Pixels),
      });
      break;

    case 'brush://dense6':
      fill = new Fill({
        color: createPixelPattern(4, fillColor, dense2Pixels),
      });
      break;

    case 'brush://dense7':
      fill = new Fill({
        color: createPixelPattern(4, fillColor, dense1Pixels),
      });
      break;

    default:
      fill = new Fill({ color: fillColor });
      break;
  }

  return fill;
}
