function propertyIsLessThan(comparison, feature) {
  return (
    feature.properties[comparison.propertyname]
    && Number(feature.properties[comparison.propertyname]) < Number(comparison.literal)
  );
}

function propertyIsBetween(comparison, feature) {
  // Todo: support string comparison as well
  const lowerBoundary = Number(comparison.lowerboundary);
  const upperBoundary = Number(comparison.upperboundary);
  const value = Number(feature.properties[comparison.propertyname]);
  return value >= lowerBoundary && value <= upperBoundary;
}

function propertyIsEqualTo(comparison, feature) {
  if (!(comparison.propertyname in feature.properties)) {
    return false;
  }
  /* eslint-disable-next-line eqeqeq */
  return feature.properties[comparison.propertyname] == comparison.literal;
}

/**
 * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
 * @private
 * @param {object} comparison filter object for operator 'propertyislike'
 * @param {object} feature the feature to test
 */
function propertyIsLike(comparison, feature) {
  const pattern = comparison.literal;
  const value = feature.properties && feature.properties[comparison.propertyname];

  if (!value) {
    return false;
  }

  // Create regex string from match pattern.
  const { wildcard, singlechar, escapechar } = comparison;

  // Replace wildcard by '.*'
  let patternAsRegex = pattern.replace(new RegExp(`[${wildcard}]`, 'g'), '.*');

  // Replace single char match by '.'
  patternAsRegex = patternAsRegex.replace(new RegExp(`[${singlechar}]`, 'g'), '.');

  // Replace escape char by '\' if escape char is not already '\'.
  if (escapechar !== '\\') {
    patternAsRegex = patternAsRegex.replace(new RegExp(`[${escapechar}]`, 'g'), '\\');
  }

  // Bookend the regular expression.
  patternAsRegex = `^${patternAsRegex}$`;

  const rex = new RegExp(patternAsRegex);
  return rex.test(value);
}

/**
 * [doComparison description]
 * @private
 * @param  {Filter} comparison [description]
 * @param  {object} feature    geojson
 * @return {bool}  does feature fullfill comparison
 */
function doComparison(comparison, feature) {
  switch (comparison.operator) {
    case 'propertyislessthan':
      return propertyIsLessThan(comparison, feature);
    case 'propertyisequalto':
      return propertyIsEqualTo(comparison, feature);
    case 'propertyislessthanorequalto':
      return propertyIsEqualTo(comparison, feature) || propertyIsLessThan(comparison, feature);
    case 'propertyisnotequalto':
      return !propertyIsEqualTo(comparison, feature);
    case 'propertyisgreaterthan':
      return !propertyIsLessThan(comparison, feature) && !propertyIsEqualTo(comparison, feature);
    case 'propertyisgreaterthanorequalto':
      return !propertyIsLessThan(comparison, feature) || propertyIsEqualTo(comparison, feature);
    case 'propertyisbetween':
      return propertyIsBetween(comparison, feature);
    case 'propertyislike':
      return propertyIsLike(comparison, feature);
    default:
      throw new Error(`Unkown comparison operator ${comparison.operator}`);
  }
}

function doFIDFilter(fids, feature) {
  for (let i = 0; i < fids.length; i += 1) {
    if (fids[i] === feature.id) {
      return true;
    }
  }

  return false;
}

function doLiteralFilter(filter, feature) {
    if (filter.literal && feature) {
        const featureProperties = feature.getProperties();

        for (let property in featureProperties) {
            if (featureProperties[property] == filter.literal) {
                return true;
            }
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
 * @return {boolean}
 */
export function filterSelector(filter, feature) {
  const { type } = filter;
  switch (type) {
    case 'featureid':
      return doFIDFilter(filter.fids, feature);

    case 'comparison':
      return doComparison(filter, feature);

    case 'and': {
      if (!filter.predicates) {
        throw new Error('And filter must have predicates array.');
      }

      // And without predicates should return false.
      if (filter.predicates.length === 0) {
        return false;
      }

      return filter.predicates.every(predicate => filterSelector(predicate, feature));
    }

    case 'or': {
      if (!filter.predicates) {
        throw new Error('Or filter must have predicates array.');
      }

      return filter.predicates.some(predicate => filterSelector(predicate, feature));
    }

    case 'not': {
      if (!filter.predicate) {
        throw new Error('Not filter must have predicate.');
      }

      return !filterSelector(filter.predicate, feature);
    }

    case 'literal': {
        return doLiteralFilter(filter, feature);
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
  if (rule.maxscaledenominator !== undefined && rule.minscaledenominator !== undefined) {
    if (
      resolution / 0.00028 < rule.maxscaledenominator
      && resolution / 0.00028 > rule.minscaledenominator
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
