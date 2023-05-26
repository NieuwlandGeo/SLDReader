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
  // If it's a number or a string (or null), return value as-is.
  const jsType = typeof expression;
  if (jsType === 'string' || jsType === 'number') {
    return expression;
  }

  if (jsType === 'undefined' || expression === null) {
    return defaultValue;
  }

  if (expression.type === 'literal') {
    if (expression.typeHint === 'number') {
      return parseFloat(expression.value);
    }
    return expression.value;
  }

  if (expression.type === 'propertyname') {
    let propertyValue =
      feature === null ? defaultValue : getProperty(feature, expression.value);
    if (typeof propertyValue === 'undefined' || propertyValue === null) {
      propertyValue = defaultValue;
    }
    if (expression.typeHint === 'number') {
      // When typeHint is number, treat an empty string as missing value and return default value.
      if (propertyValue === '') {
        return defaultValue;
      }
      return parseFloat(propertyValue);
    }
    return propertyValue;
  }

  if (expression.type === 'function') {
    // Todo: implement function expression evaluation.
    return null;
  }

  if (expression.type === 'expression') {
    let result;
    if (expression.children.length === 1) {
      result = evaluate(expression.children[0], feature, getProperty);
    } else {
      // In case of multiple child expressions, concatenate the evaluated child results.
      const childValues = [];
      for (let k = 0; k < expression.children.length; k += 1) {
        childValues.push(
          evaluate(expression.children[k], feature, getProperty)
        );
      }
      result = childValues.join('');
    }

    if (expression.typeHint === 'number') {
      return parseFloat(result);
    }

    return result;
  }

  return expression;
}
