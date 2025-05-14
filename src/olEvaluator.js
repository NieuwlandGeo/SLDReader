// This module contains an evaluate function that takes an SLD expression and a feature and outputs the value for that feature.
// Constant expressions are returned as-is.

/**
 * @module
 * @private
 */

import RenderFeature from 'ol/render/Feature';
import { METRES_PER_FOOT, UOM_FOOT, UOM_METRE } from './constants';
import { getFunction } from './functions';
import { dimensionFromGeometryType } from './functions/helpers';

/**
 * Check if an expression depends on feature properties.
 * @private
 * @param {Expression} expression SLDReader expression object.
 * @returns {bool} Returns true if the expression depends on feature properties.
 */
export function isDynamicExpression(expression) {
  // Expressions whose pixel value changes with resolution are dynamic by definition.
  if (
    expression &&
    (expression.uom === UOM_METRE || expression.uom === UOM_FOOT)
  ) {
    return true;
  }

  switch ((expression || {}).type) {
    case 'expression':
      // Expressions with all literal child values are already concatenated into a static string,
      // so any expression that survives that process has at least one non-literal child
      // and therefore possibly dynamic component.
      return true;
    case 'literal':
      return false;
    case 'propertyname':
      return true;
    case 'function':
      // Note: assuming function expressions are dynamic is correct in most practical cases.
      // A more accurate implementation would be that a function expression is static if:
      // * The function is idempotent. You cannot tell from the implementation, unless the implementor marks it as such.
      // * All function parameter expressions are static.
      return true;
    default:
      return false;
  }
}

/**
 * @private
 * This function takes an SLD expression and an OL feature and outputs the expression value for that feature.
 * Constant expressions are returned as-is.
 * @param {Expression} expression SLD object expression.
 * @param {ol/feature} feature OpenLayers feature instance.
 * @param {EvaluationContext} context Evaluation context.
 * @param {any} defaultValue Optional default value to use when feature is null.
 * Signature (feature, propertyName) => property value.
 */
export default function evaluate(
  expression,
  feature,
  context,
  defaultValue = null
) {
  // Determine the value of the expression.
  let value = null;

  const jsType = typeof expression;
  if (
    jsType === 'string' ||
    jsType === 'number' ||
    jsType === 'undefined' ||
    jsType === 'boolean' ||
    expression === null
  ) {
    // Expression value equals the expression itself if it's a native javascript type.
    value = expression;
  } else if (expression.type === 'literal') {
    // Take expression value directly from literal type expression.
    value = expression.value;
  } else if (expression.type === 'propertyname') {
    // Expression value is taken from input feature.
    // If feature is null/undefined, use default value instead.
    const propertyName = expression.value;
    if (feature) {
      // If the property name equals the geometry field name, return the feature geometry.
      if (
        typeof feature.getGeometryName === 'function' &&
        propertyName === feature.getGeometryName()
      ) {
        value = feature.getGeometry();
      } else {
        value = context.getProperty(feature, propertyName);
      }
    } else {
      value = defaultValue;
    }
  } else if (expression.type === 'expression') {
    // Expression value is the concatenation of all child expession values.
    if (expression.children.length === 1) {
      value = evaluate(expression.children[0], feature, context, defaultValue);
    } else {
      // In case of multiple child expressions, concatenate the evaluated child results.
      const childValues = [];
      for (let k = 0; k < expression.children.length; k += 1) {
        childValues.push(
          // Do not use default values when evaluating children. Only apply default is
          // the concatenated result is empty.
          evaluate(expression.children[k], feature, context, null)
        );
      }
      value = childValues.join('');
    }
  } else if (
    expression.type === 'function' &&
    expression.name === 'dimension' &&
    feature instanceof RenderFeature
  ) {
    // Special shortcut for the dimension function when used on a RenderFeature (vector tiles),
    // which ignores the geometry name parameter and directly outputs the dimension.
    value = dimensionFromGeometryType(feature.getType());
  } else if (expression.type === 'function') {
    const func = getFunction(expression.name);
    if (!func) {
      value = expression.fallbackValue;
    } else {
      try {
        // evaluate parameter expressions.
        const paramValues = expression.params.map(paramExpression =>
          evaluate(paramExpression, feature, context)
        );
        value = func(...paramValues);
      } catch {
        value = expression.fallbackValue;
      }
    }
  }

  // Do not substitute default value if the value is numeric zero.
  if (value === 0) {
    return value;
  }

  // Check if value is empty/null. If so, return default value.
  if (
    value === null ||
    typeof value === 'undefined' ||
    value === '' ||
    Number.isNaN(value)
  ) {
    value = defaultValue;
  }

  if (expression) {
    // Convert value to number if expression is flagged as numeric.
    if (expression.typeHint === 'number') {
      value = Number(value);
      if (Number.isNaN(value)) {
        value = defaultValue;
      }
    }
    // Convert value to pixels in case of uom = metre or feet.
    if (expression.uom === UOM_FOOT) {
      // Convert feet to metres.
      value *= METRES_PER_FOOT;
    }
    if (expression.uom === UOM_METRE || expression.uom === UOM_FOOT) {
      // Convert metres to pixels.
      const scaleFactor = context ? context.resolution : 1;
      value /= scaleFactor;
    }
  }

  return value;
}
