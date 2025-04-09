function appendPropToPath(path, propName) {
  if (path === '') {
    return propName;
  }
  return `${path}.${propName}`;
}

function appendArrayIndexToPath(path, index) {
  return `${path}[${index}]`;
}

function _validateObjectProperties(prop, propName, path, validateFn, errors) {
  let currentPath = path;
  try {
    validateFn(prop, propName);
    if (Array.isArray(prop)) {
      for (let k = 0; k < prop.length; k += 1) {
        currentPath = appendArrayIndexToPath(path, k);
        _validateObjectProperties(
          prop[k],
          propName,
          currentPath,
          validateFn,
          errors
        );
      }
    } else if (prop && typeof prop === 'object') {
      const childProps = Object.keys(prop);
      childProps.forEach(childPropName => {
        currentPath = appendPropToPath(path, childPropName);
        _validateObjectProperties(
          prop[childPropName],
          childPropName,
          currentPath,
          validateFn,
          errors
        );
      });
    }
  } catch (err) {
    errors.push({ path: currentPath, errorMessage: err.toString() });
  }
}

/**
 * This function validates object properties recursively and returns an array of validation errors,
 * including a path to the failing property.
 * @param {object} obj Test object (or array).
 * @param {object} nodeName Root node name.
 * @param {Function} validateFn Function that tests an object (or property thereof)
 * and throws an error if the test fails.
 */
// eslint-disable-next-line import/prefer-default-export
export function validateObjectProperties(obj, rootName, validateFn) {
  const errors = [];
  _validateObjectProperties(obj, rootName, '', validateFn, errors);
  return errors;
}
