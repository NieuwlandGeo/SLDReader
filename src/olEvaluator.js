// This module contains an evaluate function that takes an SLD expression and a feature and outputs the value for that feature.
// Constant expressions are returned as-is.

/**
 * Check if an expression depends on feature properties.
 * @param {object} expression OGC expression object.
 * @returns {bool} Returns true if the expression depends on feature properties.
 */
export function isDynamicExpression(expression) {
  switch ((expression || {}).type) {
    case 'expression':
      // Expressions with all static values are already concatenated into a static string,
      // so any expression that survives that process has at least one dynamic component.
      return true;
    case 'literal':
      return false;
    case 'propertyname':
      return true;
    case 'function':
      return true;
    default:
      return false;
  }
}

/**
 * @private
 * This function takes an SLD expression and an OL feature and outputs the expression value for that feature.
 * Constant expressions are returned as-is.
 * @param {object|string} expression SLD object expression.
 * @param {ol/feature} feature OpenLayers feature instance.
 * @param {function} getProperty A function to get a specific property value from a feature.
 * @param {any} defaultValue Optional default value to use when feature is null.
 * Signature (feature, propertyName) => property value.
 */
export default function evaluate(
  expression,
  feature,
  getProperty,
  defaultValue = null
) {
  // Determine the value of the expression.
  let value = null;

  const jsType = typeof expression;
  if (
    jsType === 'string' ||
    jsType === 'number' ||
    jsType === 'undefined' ||
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
    if (feature) {
      value = getProperty(feature, expression.value);
    } else {
      value = defaultValue;
    }
  } else if (expression.type === 'expression') {
    // Expression value is the concatenation of all child expession values.
    if (expression.children.length === 1) {
      value = evaluate(
        expression.children[0],
        feature,
        getProperty,
        defaultValue
      );
    } else {
      // In case of multiple child expressions, concatenate the evaluated child results.
      const childValues = [];
      for (let k = 0; k < expression.children.length; k += 1) {
        childValues.push(
          // Do not use default values when evaluating children. Only apply default is
          // the concatenated result is empty.
          evaluate(expression.children[k], feature, getProperty, null)
        );
      }
      value = childValues.join('');
    }
  } else if (expression.type === 'function') {
    // Todo: evaluate function expression.
    // For now, return null.
    value = null;
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
    return defaultValue;
  }

  // Convert value to number if expression is flagged as numeric.
  if (expression && expression.typeHint === 'number') {
    value = Number(value);
    if (Number.isNaN(value)) {
      return defaultValue;
    }
  }

  return value;
}
