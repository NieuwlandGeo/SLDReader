import { DEVICE_PIXEL_RATIO } from 'ol/has';
import Fill from 'ol/style/Fill';

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

function createCanvasPattern(canvas) {
  const context = canvas.getContext('2d');

  // Scale pixel pattern according to device pixel ratio if necessary.
  if (DEVICE_PIXEL_RATIO === 1) {
    return context.createPattern(canvas, 'repeat');
  }

  const scaledCanvas = document.createElement('canvas');
  scaledCanvas.width = canvas.width * DEVICE_PIXEL_RATIO;
  scaledCanvas.height = canvas.height * DEVICE_PIXEL_RATIO;

  const scaledContext = scaledCanvas.getContext('2d');
  scaledContext.imageSmoothingEnabled = false;
  scaledContext.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    scaledCanvas.width,
    scaledCanvas.height
  );

  return scaledContext.createPattern(scaledCanvas, 'repeat');
}

function createPixelPattern(size, color, pixels) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.fillStyle = color;
  fillPixels(context, pixels);

  return createCanvasPattern(canvas);
}

function createInversePixelPattern(size, color, pixels) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.fillStyle = color;
  context.fillRect(0, 0, size, size);
  clearPixels(context, pixels);

  return createCanvasPattern(canvas);
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
