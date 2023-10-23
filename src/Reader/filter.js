/**
 * Factory methods for filterelements
 * @see http://schemas.opengis.net/filter/1.0.0/filter.xsd
 *
 * @module
 */

const TYPE_COMPARISON = 'comparison';

/**
 * @var string[] element names of binary comparison
 * @private
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
 * @private
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
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createComparison(element, addParameterValueProp) {
  if (BINARY_COMPARISON_NAMES.includes(element.localName)) {
    return createBinaryFilterComparison(element, addParameterValueProp);
  }
  if (element.localName === 'PropertyIsBetween') {
    return createIsBetweenComparison(element, addParameterValueProp);
  }
  if (element.localName === 'PropertyIsNull') {
    return createIsNullComparison(element, addParameterValueProp);
  }
  if (element.localName === 'PropertyIsLike') {
    return createIsLikeComparison(element, addParameterValueProp);
  }
  throw new Error(`Unknown comparison element ${element.localName}`);
}

/**
 * factory for element type BinaryComparisonOpType
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createBinaryFilterComparison(element, addParameterValueProp) {
  const obj = {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    // Match case attribute is true by default, so only make it false if the attribute value equals 'false'.
    matchcase: element.getAttribute('matchCase') !== 'false',
  };

  // Parse child expressions, and add them to the comparison object.
  const parsed = {};
  addParameterValueProp(element, parsed, 'expressions', {
    concatenateLiterals: false,
  });

  if (parsed.expressions && parsed.expressions.children) {
    obj.expression1 = parsed.expressions.children[0];
    obj.expression2 = parsed.expressions.children[1];
  }

  return obj;
}

/**
 * factory for element type PropertyIsLikeType
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createIsLikeComparison(element, addParameterValueProp) {
  // A like comparison is a binary comparison expression, with extra attributes.
  const obj = createBinaryFilterComparison(element, addParameterValueProp);
  return {
    ...obj,
    wildcard: element.getAttribute('wildCard'),
    singlechar: element.getAttribute('singleChar'),
    escapechar: element.getAttribute('escapeChar'),
  };
}

/**
 * factory for element type PropertyIsNullType
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createIsNullComparison(element) {
  const propertyname = getChildTextContent(element, 'PropertyName');

  return {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    propertyname,
  };
}
/**
 * factory for element type PropertyIsBetweenType
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createIsBetweenComparison(element, addParameterValueProp) {
  const obj = {
    type: TYPE_COMPARISON,
    operator: element.localName.toLowerCase(),
    // Match case attribute is true by default, so only make it false if the attribute value equals 'false'.
    matchcase: element.getAttribute('matchCase') !== 'false',
  };

  // Parse child expressions, and add them to the comparison object.
  const parsed = {};
  addParameterValueProp(element, parsed, 'expressions', {
    concatenateLiterals: false,
  });

  if (parsed.expressions && parsed.expressions.children) {
    // According to spec, the child elements should be expression, lower boundary, upper boundary.
    obj.expression = parsed.expressions.children[0];
    obj.lowerboundary = parsed.expressions.children[1];
    obj.upperboundary = parsed.expressions.children[2];
  }

  return obj;
}

/**
 * Factory for and/or filter
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createBinaryLogic(element, addParameterValueProp) {
  const predicates = [];
  for (let n = element.firstElementChild; n; n = n.nextElementSibling) {
    if (isComparison(n)) {
      predicates.push(createComparison(n, addParameterValueProp));
    }
  }
  return {
    type: element.localName.toLowerCase(),
    predicates,
  };
}

/**
 * Factory for not filter
 * @private
 * @param {Element} element
 *
 * @return {object}
 */
function createUnaryLogic(element, addParameterValueProp) {
  let predicate = null;
  const childElement = element.firstElementChild;
  if (childElement && isComparison(childElement)) {
    predicate = createComparison(childElement, addParameterValueProp);
  }
  if (childElement && isBinary(childElement)) {
    predicate = createBinaryLogic(childElement, addParameterValueProp);
  }
  return {
    type: element.localName.toLowerCase(),
    predicate,
  };
}

/**
 * Factory root filter element
 * @param {Element} element
 *
 * @return {Filter}
 */
export default function createFilter(element, addParameterValueProp) {
  let filter = {};
  for (let n = element.firstElementChild; n; n = n.nextElementSibling) {
    if (isComparison(n)) {
      filter = createComparison(n, addParameterValueProp);
    }
    if (isBinary(n)) {
      filter = createBinaryLogic(n, addParameterValueProp);
    }
    if (n.localName.toLowerCase() === 'not') {
      filter = createUnaryLogic(n, addParameterValueProp);
    }
    if (n.localName.toLowerCase() === 'featureid') {
      filter.type = 'featureid';
      filter.fids = filter.fids || [];
      filter.fids.push(n.getAttribute('fid'));
    }
  }
  return filter;
}

/**
 * A filter predicate.
 * @typedef Filter
 * @name Filter
 * @description [filter operators](http://schemas.opengis.net/filter/1.1.0/filter.xsd), see also
 * [geoserver](http://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html)
 * @property {string} type Can be 'comparison', 'and', 'or', 'not', or 'featureid'.
 * @property {Array<string>} [fids] An array of feature id's. Required for type='featureid'.
 * @property {string} [operator] Required for type='comparison'. Can be one of
 * 'propertyisequalto',
 * 'propertyisnotequalto',
 * 'propertyislessthan',
 * 'propertyislessthanorequalto',
 * 'propertyisgreaterthan',
 * 'propertyisgreaterthanorequalto',
 * 'propertyislike',
 * 'propertyisbetween'
 * @property {Filter[]} [predicates] Required for type='and' or type='or'.
 * An array of filter predicates that must all evaluate to true for 'and', or
 * for which at least one must evaluate to true for 'or'.
 * @property {Filter} [predicate] Required for type='not'. A single predicate to negate.
 * @property {string} [propertyname] Required for type='comparison'.
 * @property {string} [literal] A literal value to use in a comparison,
 * required for type='comparison'.
 * @property {string} [lowerboundary] Lower boundary, required for operator='propertyisbetween'.
 * @property {string} [upperboundary] Upper boundary, required for operator='propertyisbetween'.
 * @property {string} [wildcard] Required wildcard character for operator='propertyislike'.
 * @property {string} [singlechar] Required single char match character,
 * required for operator='propertyislike'.
 * @property {string} [escapechar] Required escape character for operator='propertyislike'.
 */
