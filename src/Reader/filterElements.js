/* eslint-disable import/prefer-default-export */

/**
 * Factory methods for filterelements
 * @module
 * @see http://schemas.opengis.net/filter/1.0.0/filter.xsd
 */

const TYPE_COMPARISON = 'comparison';

/**
 * @var string[] element names of binary comparison
 */
const BINARY_COMPARISON_NAMES = [
  'PropertyIsEqualTo',
  'PropertyIsNotEqualTo',
  'PropertyIsLessThan',
  'PropertyIsLessThanOrEqualTo',
  'PropertyIsGreaterThan',
  'PropertyIsGreaterThanOrEqualTo',
];

const COMPARISON_NAMES = BINARY_COMPARISON_NAMES.concat([
  'PropertyIsLike',
  'PropertyIsNull',
  'PropertyIsBetween',
]);

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

function isComparison(element) {
  return COMPARISON_NAMES.includes(element.localName);
}

function isBinary(element) {
  return ['or', 'and'].includes(element.localName.toLowerCase());
}

/**
 * factory for comparisonOps
 *
 * @param {Element} element
 *
 * @return {object}
 */
function createComparison(element) {
  if (BINARY_COMPARISON_NAMES.includes(element.localName)) {
    return createBinaryFilterComparison(element);
  }
  if (element.localName === 'PropertyIsBetween') {
    return createIsBetweenComparison(element);
  }
  if (element.localName === 'PropertyIsNull') {
    return createIsNullComparison(element);
  }
  if (element.localName === 'PropertyIsLike') {
    return createIsLikeComparison(element);
  }
  throw new Error(`Unknown comparison element ${element.localName}`);
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

/**
 * Factory for and/or filter
 * @param {Element} element
 *
 * @return {object}
 */
export function createBinaryLogic(element) {
  const predicates = [];
  for (let n = element.firstElementChild; n; n = n.nextElementSibling) {
    if (isComparison(n)) {
      predicates.push(createComparison(n));
    }
  }
  return {
    type: element.localName.toLowerCase(),
    predicates,
  };
}

export function createUnaryLogic(element) {
  let predicate = null;
  const childElement = element.firstElementChild;
  if (childElement && isComparison(childElement)) {
    predicate = createComparison(childElement);
  }
  if (childElement && isBinary(childElement)) {
    predicate = createBinaryLogic(childElement);
  }
  return {
    type: element.localName.toLowerCase(),
    predicate,
  };
}
