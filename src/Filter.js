function propertyIsLessThan(comparison, value) {
  return (
    // Todo: support string comparison as well
    typeof value !== 'undefined' && Number(value) < Number(comparison.literal)
  );
}

function propertyIsBetween(comparison, value) {
  // Todo: support string comparison as well
  const lowerBoundary = Number(comparison.lowerboundary);
  const upperBoundary = Number(comparison.upperboundary);
  const numericValue = Number(value);
  return numericValue >= lowerBoundary && numericValue <= upperBoundary;
}

function propertyIsEqualTo(comparison, value) {
  if (typeof value === 'undefined') {
    return false;
  }
  /* eslint-disable-next-line eqeqeq */
  return value == comparison.literal;
}

/**
 * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
 * @private
 * @param {object} comparison filter object for operator 'propertyislike'
 * @param {string|number} value Feature property value.
 * @param {object} getProperty A function with parameters (feature, propertyName) to extract
 * the value of a property from a feature.
 */
function propertyIsLike(comparison, value) {
  const pattern = comparison.literal;

  if (typeof value === 'undefined') {
    return false;
  }

  // Create regex string from match pattern.
  const { wildcard, singlechar, escapechar } = comparison;

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

  const rex = new RegExp(patternAsRegex);
  return rex.test(value);
}

/**
 * Test feature properties against a comparison filter.
 * @private
 * @param  {Filter} comparison A comparison filter object.
 * @param  {object} feature A feature object.
 * @param  {Function} getProperty A function with parameters (feature, propertyName)
 * to extract a single property value from a feature.
 * @return {bool}  does feature fullfill comparison
 */
function doComparison(comparison, feature, getProperty) {
  const value = getProperty(feature, comparison.propertyname);

  switch (comparison.operator) {
    case 'propertyislessthan':
      return propertyIsLessThan(comparison, value);
    case 'propertyisequalto':
      return propertyIsEqualTo(comparison, value);
    case 'propertyislessthanorequalto':
      return (
        propertyIsEqualTo(comparison, value) ||
        propertyIsLessThan(comparison, value)
      );
    case 'propertyisnotequalto':
      return !propertyIsEqualTo(comparison, value);
    case 'propertyisgreaterthan':
      return (
        !propertyIsLessThan(comparison, value) &&
        !propertyIsEqualTo(comparison, value)
      );
    case 'propertyisgreaterthanorequalto':
      return (
        !propertyIsLessThan(comparison, value) ||
        propertyIsEqualTo(comparison, value)
      );
    case 'propertyisbetween':
      return propertyIsBetween(comparison, value);
    case 'propertyislike':
      return propertyIsLike(comparison, value);
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
 * @private
 * Get feature properties from a GeoJSON feature.
 * @param {object} feature GeoJSON feature.
 * @returns {object} Feature properties.
 *
 */
function getGeoJSONProperty(feature, propertyName) {
  return feature.properties[propertyName];
}

/**
 * @private
 * Gets feature id from a GeoJSON feature.
 * @param {object} feature GeoJSON feature.
 * @returns {number|string} Feature ID.
 */
function getGeoJSONFeatureId(feature) {
  return feature.id;
}

/**
 * Calls functions from Filter object to test if feature passes filter.
 * Functions are called with filter part they match and feature.
 * @private
 * @param  {Filter} filter
 * @param  {object} feature feature
 * @param  {object} options Custom filter options.
 * @param  {Function} options.getProperty An optional function with parameters (feature, propertyName)
 * that can be used to extract properties from a feature.
 * When not given, properties are read from feature.properties directly.
 * @param  {Function} options.getFeatureId An optional function to extract the feature id from a feature.
 * When not given, feature id is read from feature.id.
 * @return {boolean} True if the feature passes the conditions described by the filter object.
 */
export function filterSelector(filter, feature, options = {}) {
  const getProperty =
    typeof options.getProperty === 'function'
      ? options.getProperty
      : getGeoJSONProperty;

  const getFeatureId =
    typeof options.getFeatureId === 'function'
      ? options.getFeatureId
      : getGeoJSONFeatureId;

  const { type } = filter;
  switch (type) {
    case 'featureid':
      return doFIDFilter(filter.fids, getFeatureId(feature));

    case 'comparison':
      return doComparison(filter, feature, getProperty);

    case 'and': {
      if (!filter.predicates) {
        throw new Error('And filter must have predicates array.');
      }

      // And without predicates should return false.
      if (filter.predicates.length === 0) {
        return false;
      }

      return filter.predicates.every(predicate =>
        filterSelector(predicate, feature, options)
      );
    }

    case 'or': {
      if (!filter.predicates) {
        throw new Error('Or filter must have predicates array.');
      }

      return filter.predicates.some(predicate =>
        filterSelector(predicate, feature, options)
      );
    }

    case 'not': {
      if (!filter.predicate) {
        throw new Error('Not filter must have predicate.');
      }

      return !filterSelector(filter.predicate, feature, options);
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
