import evaluate, { isDynamicExpression } from '../olEvaluator';
import { getOLColorString } from './styleUtils';

/**
 * Change OL Style fill properties for dynamic symbolizer style parameters.
 * Modification happens in-place on the given style instance.
 * @private
 * @param {ol/style/Style} olStyle OL Style instance.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
 * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
 * @returns {bool} Returns true if any property-dependent fill style changes have been made.
 */
export function applyDynamicFillStyling(
  olStyle,
  symbolizer,
  feature,
  getProperty
) {
  const olFill = olStyle.getFill();
  if (!olFill) {
    return false;
  }

  if (typeof getProperty !== 'function') {
    return false;
  }

  let somethingChanged = false;

  const fill = symbolizer.fill || {};
  const styling = fill.styling || {};

  // Change fill color if either color or opacity is property based.
  if (
    isDynamicExpression(styling.fill) ||
    isDynamicExpression(styling.fillOpacity)
  ) {
    const fillColor = evaluate(styling.fill, feature, getProperty, '#808080');
    const fillOpacity = evaluate(
      styling.fillOpacity,
      feature,
      getProperty,
      1.0
    );
    olFill.setColor(getOLColorString(fillColor, fillOpacity));
    somethingChanged = true;
  }

  return somethingChanged;
}

/**
 * Change OL Style stroke properties for dynamic symbolizer style parameters.
 * Modification happens in-place on the given style instance.
 * @private
 * @param {ol/style/Style} olStyle OL Style instance.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
 * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
 * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
 */
export function applyDynamicStrokeStyling(
  olStyle,
  symbolizer,
  feature,
  getProperty
) {
  const olStroke = olStyle.getStroke();
  if (!olStroke) {
    return false;
  }

  if (typeof getProperty !== 'function') {
    return false;
  }

  let somethingChanged = false;

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
    somethingChanged = true;
  }

  // Change stroke color if either color or opacity is property based.
  if (
    isDynamicExpression(styling.stroke) ||
    isDynamicExpression(styling.strokeOpacity)
  ) {
    const strokeColor = evaluate(
      styling.stroke,
      feature,
      getProperty,
      '#000000'
    );
    const strokeOpacity = evaluate(
      styling.strokeOpacity,
      feature,
      getProperty,
      1.0
    );
    olStroke.setColor(getOLColorString(strokeColor, strokeOpacity));
    somethingChanged = true;
  }

  return somethingChanged;
}

/**
 * Change OL Text properties for dynamic symbolizer style parameters.
 * Modification happens in-place on the given style instance.
 * @private
 * @param {ol/style/Style} olStyle OL Style instance.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
 * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
 * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
 */
export function applyDynamicTextStyling(
  olStyle,
  symbolizer,
  feature,
  getProperty
) {
  const olText = olStyle.getText();
  if (!olText) {
    return false;
  }

  if (typeof getProperty !== 'function') {
    return false;
  }

  // Text fill style has to be applied to text color, so it has to be set as olText stroke.
  if (
    symbolizer.fill &&
    symbolizer.fill.styling &&
    (isDynamicExpression(symbolizer.fill.styling.fill) ||
      isDynamicExpression(symbolizer.fill.styling.fillOpacity))
  ) {
    const textStrokeSymbolizer = {
      stroke: {
        styling: {
          stroke: symbolizer.fill.styling.fill,
          strokeOpacity: symbolizer.fill.styling.fillOpacity,
        },
      },
    };
    applyDynamicStrokeStyling(
      olText,
      textStrokeSymbolizer,
      feature,
      getProperty
    );
  }

  // Halo fill has to be applied as olText fill.
  if (
    symbolizer.halo &&
    symbolizer.halo.fill &&
    symbolizer.halo.fill.styling &&
    (isDynamicExpression(symbolizer.halo.fill.styling.fill) ||
      isDynamicExpression(symbolizer.halo.fill.styling.fillOpacity))
  ) {
    applyDynamicFillStyling(olText, symbolizer.halo, feature, getProperty);
  }

  // Halo radius has to be applied as olText.stroke width.
  if (symbolizer.halo && isDynamicExpression(symbolizer.halo.radius)) {
    const haloRadius = evaluate(
      symbolizer.halo.radius,
      feature,
      getProperty,
      1.0
    );
    const olStroke = olText.getStroke();
    if (olStroke) {
      const haloStrokeWidth =
        (haloRadius === 2 || haloRadius === 4
          ? haloRadius - 0.00001
          : haloRadius) * 2;
      olStroke.setWidth(haloStrokeWidth);
    }
  }

  return false;
}
