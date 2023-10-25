/**
 *
 * @param {any} input Input value.
 * @returns The string representation of the input value.
 * It will always return a valid string and return an empty string for null and undefined values.
 * Other types of input will be returned as their type name.
 */
// eslint-disable-next-line import/prefer-default-export
export function asString(input) {
  if (input === null) {
    return '';
  }
  const inputType = typeof input;
  switch (inputType) {
    case 'string':
      return input;
    case 'number':
    case 'bigint':
    case 'boolean':
      return input.toString();
    case 'undefined':
      return '';
    default:
      // object, function, symbol, bigint, boolean, other?
      return inputType;
  }
}
