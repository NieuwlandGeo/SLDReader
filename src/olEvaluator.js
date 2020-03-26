// This module contains an evaluate function that takes an SLD expression and a feature and outputs the value for that feature.
// Constant expressions are returned as-is.

/**
 * @private
 * Evaluate the value of a sub-expression.
 * @param {object} childExpression SLD object expression child.
 * @param {ol/feature} feature OpenLayers feature instance.feature.
 */
function evaluateChildExpression(childExpression, feature) {
  // For now, the only valid child types are 'propertyname' and 'literal'.
  // Todo: add,sub,mul,div. Maybe a few functions as well.
  if (childExpression.type === 'literal') {
    return childExpression.value;
  }

  if (childExpression.type === 'propertyname') {
    return feature.get(childExpression.value);
  }

  return null;
}

/**
 * @private
 * This function takes an SLD expression and an OL feature and outputs the expression value for that feature.
 * Constant expressions are returned as-is.
 * @param {object|string} expression SLD object expression.
 * @param {ol/feature} feature OpenLayers feature instance.
 */
export default function evaluate(expression, feature) {
  // The only compound expressions have type: 'expression'.
  // If it does not have this type, it's probably a plain string (or number).
  if (expression.type !== 'expression') {
    return expression;
  }

  // Evaluate the child expression when there is only one child.
  if (expression.children.length === 1) {
    return evaluateChildExpression(expression.children[0], feature);
  }

  // In case of multiple child expressions, concatenate the evaluated child results.
  const childValues = [];
  for (let k = 0; k < expression.children.length; k += 1) {
    childValues.push(evaluateChildExpression(expression.children[k], feature));
  }
  return childValues.join('');
}

/**
 * @private
 * Utility function for evaluating dynamic expressions without a feature.
 * If the expression is static, the expression value will be returned.
 * If the expression is dynamic, defaultValue will be returned.
 * If the expression is falsy, defaultValue will be returned.
 * @param {object|string} expression SLD object expression (or string).
 * @param {any} defaultValue Default value.
 * @returns {any} The value of a static expression or default value if the expression is dynamic.
 */
export function expressionOrDefault(expression, defaultValue) {
  if (!expression) {
    return defaultValue;
  }

  if (expression.type === 'expression') {
    return defaultValue;
  }

  return expression;
}
