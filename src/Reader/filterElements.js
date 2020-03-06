/* eslint-disable import/prefer-default-export */

/**
 * Factory methods for filterelements
 * @module
 * @see http://schemas.opengis.net/filter/1.0.0/filter.xsd
 */
const TYPE_COMPARISON = 'comparison';
/**
 *
 * @param {string} localName
 *
 * @return null|string
 */
function getChildTextContent(node, localName) {
  const propertyNameElement = node
    .getElementsByTagNameNS(node.namespaceURI, localName)
    .item(0);
  if (!propertyNameElement) {
    return null;
  }
  if (propertyNameElement.parentNode !== node) {
    throw new Error('Expected direct descant');
  }
  return propertyNameElement ? propertyNameElement.textContent.trim() : null;
}

/**
 * factory for element type BinaryComparisonOpType
 *
 * @param {Element} element
 *
 * @return {object}
 */
export function createBinaryFilterComparison(element) {
  const propertyname = getChildTextContent(element, 'PropertyName');
  const literal = getChildTextContent(element, 'Literal');

  return {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    propertyname,
    literal,
  };
}
/**
 * factory for element type PropertyIsLikeType
 *
 * @param {Element} element
 *
 * @return {object}
 */
export function createIsLikeComparison(element) {
  const propertyname = getChildTextContent(element, 'PropertyName');
  const literal = getChildTextContent(element, 'Literal');
  return {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    propertyname,
    literal,
    wildcard: element.getAttribute('wildCard'),
    singlechar: element.getAttribute('singleChar'),
    escapechar: element.getAttribute('escapeChar'),
  };
}
/**
 * factory for element type PropertyIsNullType
 *
 * @param {Element} element
 *
 * @return {object}
 */
export function createIsNullComparison(element) {
  const propertyname = getChildTextContent(element, 'PropertyName');
  console.log('hoihoi');

  return {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    propertyname,
  };
}
/**
 * factory for element type PropertyIsBetweenType
 *
 * @param {Element} element
 *
 * @return {object}
 */
export function createIsBetweenComparison(element) {
  const propertyname = getChildTextContent(element, 'PropertyName');
  const lowerboundary = getChildTextContent(element, 'LowerBoundary');
  const upperboundary = getChildTextContent(element, 'UpperBoundary');
  return {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    lowerboundary,
    upperboundary,
    propertyname,
  };
}
