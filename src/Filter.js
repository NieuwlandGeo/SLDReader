import evaluate from './olEvaluator';

function isNullOrUndefined(value) {
  /* eslint-disable-next-line eqeqeq */
  return value == null;
}

function compareNumbers(a, b) {
  if (a < b) {
    return -1;
  }
  if (a === b) {
    return 0;
  }
  return 1;
}

function toNumber(text) {
  if (text === '') {
    return NaN;
  }
  return Number(text);
}

function compare(a, b, matchcase) {
  const aNumber = toNumber(a);
  const bNumber = toNumber(b);
  if (!(Number.isNaN(aNumber) || Number.isNaN(bNumber))) {
    return compareNumbers(aNumber, bNumber);
  }

  // If a and/or b is non-numeric, compare both values as strings.
  const aString = a.toString();
  const bString = b.toString();

  // Note: using locale compare with sensitivity option fails the CI test, while it works on my PC.
  // So, case insensitive comparison is done in a more brute-force way by using lower case comparison.
  // Original method:
  // const caseSensitiveCollator = new Intl.Collator(undefined, { sensitivity: 'case' });
  // caseSensitiveCollator.compare(string1, string2);
  if (matchcase) {
    return aString.localeCompare(bString);
  }

  return aString.toLowerCase().localeCompare(bString.toLowerCase());
}

function propertyIsNull(comparison, feature, context) {
  const value = evaluate(comparison.expression, feature, context);
  return isNullOrUndefined(value);
}

function propertyIsLessThan(comparison, feature, context) {
  const value1 = evaluate(comparison.expression1, feature, context);
  if (isNullOrUndefined(value1)) {
    return false;
  }

  const value2 = evaluate(comparison.expression2, feature, context);
  if (isNullOrUndefined(value2)) {
    return false;
  }

  return compare(value1, value2) < 0;
}

function propertyIsGreaterThan(comparison, feature, context) {
  const value1 = evaluate(comparison.expression1, feature, context);
  if (isNullOrUndefined(value1)) {
    return false;
  }

  const value2 = evaluate(comparison.expression2, feature, context);
  if (isNullOrUndefined(value2)) {
    return false;
  }

  return compare(value1, value2) > 0;
}

function propertyIsBetween(comparison, feature, context) {
  const value = evaluate(comparison.expression, feature, context);
  if (isNullOrUndefined(value)) {
    return false;
  }

  const lowerBoundary = evaluate(
    comparison.lowerboundary,
    feature,
    context
  );
  if (isNullOrUndefined(lowerBoundary)) {
    return false;
  }

  const upperBoundary = evaluate(
    comparison.upperboundary,
    feature,
    context
  );
  if (isNullOrUndefined(upperBoundary)) {
    return false;
  }

  return (
    compare(lowerBoundary, value) <= 0 && compare(upperBoundary, value) >= 0
  );
}

function propertyIsEqualTo(comparison, feature, context) {
  const value1 = evaluate(comparison.expression1, feature, context);
  if (isNullOrUndefined(value1)) {
    return false;
  }

  const value2 = evaluate(comparison.expression2, feature, context);
  if (isNullOrUndefined(value2)) {
    return false;
  }

  if (
    !comparison.matchcase ||
    typeof value1 === 'boolean' ||
    typeof value2 === 'boolean'
  ) {
    return compare(value1, value2, false) === 0;
  }

  /* eslint-disable-next-line eqeqeq */
  return value1 == value2;
}

// Watch out! Null-ish values should not pass propertyIsNotEqualTo,
// just like in databases.
// This means that PropertyIsNotEqualTo is not the same as NOT(PropertyIsEqualTo).
function propertyIsNotEqualTo(comparison, feature, context) {
  const value1 = evaluate(comparison.expression1, feature, context);
  if (isNullOrUndefined(value1)) {
    return false;
  }

  const value2 = evaluate(comparison.expression2, feature, context);
  if (isNullOrUndefined(value2)) {
    return false;
  }

  return !propertyIsEqualTo(comparison, feature, context);
}

/**
 * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
 * @private
 * @param {object} comparison filter object for operator 'propertyislike'
 * @param {string|number} value Feature property value.
 * @param {EvaluationContext} context Evaluation context.
 * the value of a property from a feature.
 */
function propertyIsLike(comparison, feature, context) {
  const value = evaluate(comparison.expression1, feature, context);
  if (isNullOrUndefined(value)) {
    return false;
  }

  const pattern = evaluate(comparison.expression2, feature, context);
  if (isNullOrUndefined(pattern)) {
    return false;
  }

  // Create regex string from match pattern.
  const { wildcard, singlechar, escapechar, matchcase } = comparison;

  // Replace wildcard by '.*'
  let patternAsRegex = pattern.replace(new RegExp(`[${wildcard}]`, 'g'), '.*');

  // Replace single char match by '.'
  patternAsRegex = patternAsRegex.replace(
    new RegExp(`[${singlechar}]`, 'g'),
    '.'
  );

  // Replace escape char by '\' if escape char is not already '\'.
  if (escapechar !== '\\') {
    patternAsRegex = patternAsRegex.replace(
      new RegExp(`[${escapechar}]`, 'g'),
      '\\'
    );
  }

  // Bookend the regular expression.
  patternAsRegex = `^${patternAsRegex}$`;

  const rex =
    matchcase === false
      ? new RegExp(patternAsRegex, 'i')
      : new RegExp(patternAsRegex);
  return rex.test(value);
}

/**
 * Test feature properties against a comparison filter.
 * @private
 * @param  {Filter} comparison A comparison filter object.
 * @param  {object} feature A feature object.
 * @param {EvaluationContext} context Evaluation context.
 * @return {bool}  does feature fullfill comparison
 */
function doComparison(comparison, feature, context) {
  switch (comparison.operator) {
    case 'propertyislessthan':
      return propertyIsLessThan(comparison, feature, context);
    case 'propertyisequalto':
      return propertyIsEqualTo(comparison, feature, context);
    case 'propertyislessthanorequalto':
      return (
        propertyIsEqualTo(comparison, feature, context) ||
        propertyIsLessThan(comparison, feature, context)
      );
    case 'propertyisnotequalto':
      return propertyIsNotEqualTo(comparison, feature, context);
    case 'propertyisgreaterthan':
      return propertyIsGreaterThan(comparison, feature, context);
    case 'propertyisgreaterthanorequalto':
      return (
        propertyIsEqualTo(comparison, feature, context) ||
        propertyIsGreaterThan(comparison, feature, context)
      );
    case 'propertyisbetween':
      return propertyIsBetween(comparison, feature, context);
    case 'propertyisnull':
      return propertyIsNull(comparison, feature, context);
    case 'propertyislike':
      return propertyIsLike(comparison, feature, context);
    default:
      throw new Error(`Unkown comparison operator ${comparison.operator}`);
  }
}

function doFIDFilter(fids, featureId) {
  for (let i = 0; i < fids.length; i += 1) {
    if (fids[i] === featureId) {
      return true;
    }
  }

  return false;
}

/**
 * Calls functions from Filter object to test if feature passes filter.
 * Functions are called with filter part they match and feature.
 * @private
 * @param  {Filter} filter
 * @param  {object} feature feature
 * @param {EvaluationContext} context Evaluation context.
 * @return {boolean} True if the feature passes the conditions described by the filter object.
 */
export function filterSelector(filter, feature, context) {
  const { type } = filter;
  switch (type) {
    case 'featureid':
      return doFIDFilter(filter.fids, context.getId(feature));

    case 'comparison':
      return doComparison(filter, feature, context);

    case 'and': {
      if (!filter.predicates) {
        throw new Error('And filter must have predicates array.');
      }

      // And without predicates should return false.
      if (filter.predicates.length === 0) {
        return false;
      }

      return filter.predicates.every(predicate =>
        filterSelector(predicate, feature, context)
      );
    }

    case 'or': {
      if (!filter.predicates) {
        throw new Error('Or filter must have predicates array.');
      }

      return filter.predicates.some(predicate =>
        filterSelector(predicate, feature, context)
      );
    }

    case 'not': {
      if (!filter.predicate) {
        throw new Error('Not filter must have predicate.');
      }

      return !filterSelector(filter.predicate, feature, context);
    }

    default:
      throw new Error(`Unknown filter type: ${type}`);
  }
}

/**
 * [scaleSelector description]
 * The "standardized rendering pixel size" is defined to be 0.28mm × 0.28mm
 * @private
 * @param  {Rule} rule
 * @param  {number} resolution  m/px
 * @return {boolean}
 */
export function scaleSelector(rule, resolution) {
  if (
    rule.maxscaledenominator !== undefined &&
    rule.minscaledenominator !== undefined
  ) {
    if (
      resolution / 0.00028 < rule.maxscaledenominator &&
      resolution / 0.00028 > rule.minscaledenominator
    ) {
      return true;
    }
    return false;
  }
  if (rule.maxscaledenominator !== undefined) {
    return resolution / 0.00028 < rule.maxscaledenominator;
  }
  if (rule.minscaledenominator !== undefined) {
    return resolution / 0.00028 > rule.minscaledenominator;
  }
  return true;
}
