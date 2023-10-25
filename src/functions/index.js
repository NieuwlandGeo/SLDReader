// This module contains a global registry of function implementations,
// and functions to register new function implementations.

const FunctionCache = new Map();

/**
 * Register a function implementation by name. When evaluating the function, it will be called
 * with the values of the parameter elements evaluated for a single feature.
 * If the function returns null, the fallback value given in the SLD function element will be used instead.
 *
 * Note: take care of these possible gotcha's in the function implementation.
 * * The function will be called with the number of parameters given in the SLD function element.
 *   This number can be different from the expected number of arguments.
 * * Try to avoid throwing errors from the function implementation and return null if possible.
 * * Literal values will always be provided as strings. Convert numeric parameters to numbers yourself.
 * * Geometry valued parameters will be provided as OpenLayers geometry instances. Do not mutate these!
 * @param {string} functionName Function name.
 * @param {Function} implementation The function implementation.
 */
export function registerFunction(functionName, implementation) {
  if (typeof implementation !== 'function') {
    throw new Error('Function implementation is not a function');
  }
  FunctionCache[functionName] = implementation;
}

/**
 * Get a function implementation by name.
 * @param {string} functionName Function name.
 * @returns {Function} The function implementation, or null if no function with the given
 * name has been registered yet.
 */
export function getFunction(functionName) {
  return FunctionCache[functionName] || null;
}

/**
 * Clear the function cache.
 */
export function clearFunctionCache() {
  FunctionCache.clear();
}
