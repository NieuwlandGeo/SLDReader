import evaluate, { isDynamicExpression } from '../olEvaluator';
import { getOLColorString } from './styleUtils';

/**
 * Change OL Style fill properties for dynamic symbolizer style parameters.
 * Modification happens in-place on the given style instance.
 * @private
 * @param {ol/style/Style} olStyle OL Style instance.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
 * @param {EvaluationContext} context Evaluation context.
 * @returns {bool} Returns true if any property-dependent fill style changes have been made.
 */
export function applyDynamicFillStyling(olStyle, symbolizer, feature, context) {
  const olFill = olStyle.getFill();
  if (!olFill) {
    return false;
  }

  if (!context) {
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
    const fillColor = evaluate(styling.fill, feature, context, '#808080');
    const fillOpacity = evaluate(styling.fillOpacity, feature, context, 1.0);
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
 * @param {EvaluationContext} context Evaluation context.
 * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
 */
export function applyDynamicStrokeStyling(
  olStyle,
  symbolizer,
  feature,
  context
) {
  const olStroke = olStyle.getStroke();
  if (!olStroke) {
    return false;
  }

  if (!context) {
    return false;
  }

  let somethingChanged = false;

  const styling = symbolizer?.stroke?.styling;

  // Change stroke width if it's property based.
  if (isDynamicExpression(styling?.strokeWidth)) {
    const strokeWidth = evaluate(styling.strokeWidth, feature, context, 1.0);
    olStroke.setWidth(strokeWidth);
    somethingChanged = true;
  }

  // Change stroke color if either color or opacity is property based.
  if (
    isDynamicExpression(styling?.stroke) ||
    isDynamicExpression(styling?.strokeOpacity)
  ) {
    const strokeColor = evaluate(styling.stroke, feature, context, '#000000');
    const strokeOpacity = evaluate(
      styling.strokeOpacity,
      feature,
      context,
      1.0
    );
    olStroke.setColor(getOLColorString(strokeColor, strokeOpacity));
    somethingChanged = true;
  }

  // Change stroke offset if it's scale or property based.
  if (isDynamicExpression(symbolizer?.perpendicularoffset)) {
    const offset = evaluate(symbolizer.perpendicularoffset, feature, context, null);
    // Changing offset is only possible from OL 10.8.0 onwards.
    // Check to prevent crash for older OL versions here.
    if (typeof olStroke.setOffset === 'function') {
      if (offset === null) {
        olStroke.setOffset(null);
      } else {
        olStroke.setOffset(-offset);
      }
    }
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
 * @param {EvaluationContext} context Evaluation context.
 * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
 */
export function applyDynamicTextStyling(olStyle, symbolizer, feature, context) {
  const olText = olStyle.getText();
  if (!olText) {
    return false;
  }

  if (!context) {
    return false;
  }

  // Text fill style has to be applied to text color, so it has to be set as olText stroke.
  if (
    isDynamicExpression(symbolizer?.fill?.styling?.fill) ||
    isDynamicExpression(symbolizer?.fill?.styling?.fillOpacity)
  ) {
    const textStrokeSymbolizer = {
      stroke: {
        styling: {
          stroke: symbolizer?.fill?.styling?.fill,
          strokeOpacity: symbolizer?.fill?.styling?.fillOpacity,
        },
      },
    };
    applyDynamicStrokeStyling(olText, textStrokeSymbolizer, feature, context);
  }

  // Halo fill has to be applied as olText fill.
  if (
    isDynamicExpression(symbolizer?.halo?.fill?.styling?.fill) ||
    isDynamicExpression(symbolizer?.halo?.fill?.styling?.fillOpacity)
  ) {
    applyDynamicFillStyling(olText, symbolizer.halo, feature, context);
  }

  // Halo radius has to be applied as olText.stroke width.
  if (isDynamicExpression(symbolizer?.halo?.radius)) {
    const haloRadius = evaluate(symbolizer.halo.radius, feature, context, 1.0);
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
