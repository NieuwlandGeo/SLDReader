/**
 * Render a single font character as an HTMLCanvasElement.
 * @param {string} fontFamily Font family.
 * @param {integer} markIndex Mark index.
 * @param {integer} size Symbol size in pixels.
 * @param {string} fillColor Font symbol color.
 * @param {double} strokeWidth Font symbol stroke outline with in pixels.
 * @param {string} strokeColor Font symbol stroke outline color. When set to '-', do not render a stroke.
 * @param {integer} [scaleFactor] Scale returned image by scaleFactor. Default 1 (no scaling).
 * @returns {HTMLCanvasElement} An HTMLCanvasElement containing the rendered font symbol.
 */
export function renderFontSymbolToCanvas(
  fontFamily,
  markIndex,
  size,
  fillColor,
  strokeWidth,
  strokeColor,
  scaleFactor = 1
) {
  // Draw character on a canvas.
  const symbolText = String.fromCharCode(markIndex);
  const symbolSize = size * scaleFactor;
  const canvasSize = symbolSize;

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  const context = canvas.getContext('2d');

  // Set font and text alignment for predictable placement.
  let fontSize = symbolSize;
  context.font = `${fontSize}px ${fontFamily}`;
  context.lineCap = 'round';
  context.direction = 'ltr';
  context.textBaseline = 'top';
  context.textAlign = 'center';

  // Symbol width may larger than the font size. In that case, scale the symbol so it fits within the canvas bounding box.
  let textMetrics = context.measureText(symbolText);
  if (textMetrics.width > symbolSize) {
    fontSize = Math.round(
      fontSize * (fontSize / textMetrics.width)
    );
    context.font = `${fontSize}px ${fontFamily}`;
  }

  // Apply symbol color.
  context.fillStyle = fillColor;
  context.fillText(symbolText, canvasSize / 2, 0);

  // Apply symbol stroke (if there is one).
  if (strokeColor && strokeColor !== '-') {
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth * scaleFactor;
    context.strokeText(symbolText, canvasSize / 2, 0);
  }

  return canvas;
}
