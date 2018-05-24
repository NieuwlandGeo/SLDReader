function propertyIsLessThan(comparison, feature) {
  return (
    feature.properties[comparison.propertyname] &&
    Number(feature.properties[comparison.propertyname]) <
      Number(comparison.literal)
  );
}

function propertyIsEqualTo(comparison, feature) {
  if (!(comparison.propertyname in feature.properties)) {
    return false;
  }

  return feature.properties[comparison.propertyname] === comparison.literal;
}

/**
 * [doComparison description]
 * @private
 * @param  {Comparison} comparison [description]
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
      return (
        propertyIsEqualTo(comparison, feature) ||
        propertyIsLessThan(comparison, feature)
      );
    case 'propertyisnotequalto':
      return !propertyIsEqualTo(comparison, feature);
    case 'propertyisgreaterthan':
      return (
        !propertyIsLessThan(comparison, feature) &&
        !propertyIsEqualTo(comparison, feature)
      );
    case 'propertyisgreaterthanorequalto':
      return (
        !propertyIsLessThan(comparison, feature) ||
        propertyIsEqualTo(comparison, feature)
      );
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

// const Filters = {
//   featureid: (value, feature) => {
//     for (let i = 0; i < value.length; i += 1) {
//       if (value[i] === feature.id) {
//         return true;
//       }
//     }
//     return false;
//   },
//   not: (value, feature) => !filterSelector(value, feature),
//   or: (value, feature) => {
//     const keys = Object.keys(value);
//     for (let i = 0; i < keys.length; i += 1) {
//       if (value[keys[i]].length === 1 && filterSelector(value, feature, i)) {
//         return true;
//       }
//     }
//     return false;
//   },
//   and: (value, feature) => {
//     const keys = Object.keys(value);
//     return keys.every((key, i) => filterSelector(value, feature, i));
//   },
//   /**
//    * @private
//    * @param  {Comparison[]} value   [description]
//    * @param  {object} feature geojson
//    * @return {bool}         [description]
//    */
//   comparison: (value, feature) =>
//     value.every(comparison => doComparison(comparison, feature)),
//   propertyisequalto: (values, feature) =>
//     values.every(
//       value =>
//         feature.properties[value.propertyname] &&
//         feature.properties[value.propertyname] === value.literal
//     ),
//   propertyisnotequalto: (value, feature) =>
//     !Filters.propertyisequalto(value, feature),
//   propertyislessthanorequalto: (value, feature) =>
//     Filters.propertyisequalto(value, feature) ||
//     Filters.propertyislessthan(value, feature),
//   propertyisgreaterthan: (values, feature) =>
//     values.every(
//       value =>
//         feature.properties[value.propertyname] &&
//         Number(feature.properties[value.propertyname]) > Number(value.literal)
//     ),
//   propertyisgreaterthanorequalto: (value, feature) =>
//     Filters.propertyisequalto(value, feature) ||
//     Filters.propertyisgreaterthan(value, feature),
// };

/**
 * Calls functions from Filter object to test if feature passes filter.
 * Functions are called with filter part they match and feature.
 * @private
 * @param  {Filter} filter
 * @param  {object} feature feature
 * @return {boolean}
 */
export function filterSelector(filter, feature) {
  const type = filter.type;
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

      return filter.predicates.every(predicate =>
        filterSelector(predicate, feature)
      );
    }

    case 'or': {
      if (!filter.predicates) {
        throw new Error('And filter must have predicates array.');
      }

      return filter.predicates.some(predicate =>
        filterSelector(predicate, feature)
      );
    }

    case 'not': {
      if (!filter.predicate) {
        throw new Error('Not filter must have predicate.');
      }

      return !filterSelector(filter.predicate, feature);
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
