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
  // TEST AREA
  const canvas = document.createElement('canvas');
  const width = size * scaleFactor;
  const height = size * scaleFactor;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  context.fillStyle = fillColor;
  context.arc(width / 2, height / 2, width / 3, 0, 2 * Math.PI);
  context.fill();

  if (strokeColor && strokeColor !== '-') {
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth * scaleFactor;
    context.arc(width / 2, height / 2, width / 3, 0, 2 * Math.PI);
    context.stroke();
  }

  return canvas;
}
