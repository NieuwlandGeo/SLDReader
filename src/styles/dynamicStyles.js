import evaluate, { isDynamicExpression } from '../olEvaluator';
import { hexToRGB } from './styleUtils';

/**
 * Change OL Style fill properties for dynamic symbolizer style parameters.
 * Modification happens in-place on the given style instance.
 * @param {ol/style/Style} olStyle OL Style instance.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
 * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
 * @returns {void} The input style instance (adjustments are made in-place).
 */
export function applyDynamicFillStyling(
  olStyle,
  symbolizer,
  feature,
  getProperty
) {
  const olFill = olStyle.getFill();
  if (!olFill) {
    return;
  }

  const stroke = symbolizer.fill || {};
  const styling = stroke.styling || {};

  // Change fill color if either color or opacity is property based.
  if (
    isDynamicExpression(styling.fill) ||
    isDynamicExpression(styling.fillOpacity)
  ) {
    let fillColor = evaluate(styling.fill, feature, getProperty, '#808080');
    const fillOpacity = evaluate(
      styling.fillOpacity,
      feature,
      getProperty,
      1.0
    );
    if (
      fillOpacity !== null &&
      fillOpacity < 1.0 &&
      fillColor.startsWith('#')
    ) {
      fillColor = hexToRGB(fillColor, fillOpacity);
    }
    olFill.setColor(fillColor);
  }
}

/**
 * Change OL Style stroke properties for dynamic symbolizer style parameters.
 * Modification happens in-place on the given style instance.
 * @param {ol/style/Style} olStyle OL Style instance.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
 * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
 * @returns {void}
 */
export function applyDynamicStrokeStyling(
  olStyle,
  symbolizer,
  feature,
  getProperty
) {
  const olStroke = olStyle.getStroke();
  if (!olStroke) {
    return;
  }

  const stroke = symbolizer.stroke || {};
  const styling = stroke.styling || {};

  // Change stroke width if it's property based.
  if (isDynamicExpression(styling.strokeWidth)) {
    const strokeWidth = evaluate(
      styling.strokeWidth,
      feature,
      getProperty,
      1.0
    );
    olStroke.setWidth(strokeWidth);
  }

  // Change stroke color if either color or opacity is property based.
  if (
    isDynamicExpression(styling.stroke) ||
    isDynamicExpression(styling.strokeOpacity)
  ) {
    let strokeColor = evaluate(styling.stroke, feature, getProperty, '#000000');
    const strokeOpacity = evaluate(
      styling.strokeOpacity,
      feature,
      getProperty,
      1.0
    );
    if (
      strokeOpacity !== null &&
      strokeOpacity < 1.0 &&
      strokeColor.startsWith('#')
    ) {
      strokeColor = hexToRGB(strokeColor, strokeOpacity);
    }
    olStroke.setColor(strokeColor);
  }
}
