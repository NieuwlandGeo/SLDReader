import Reader from './Reader';
import OlStyler, { createOlStyleFunction, createOlStyle } from './OlStyler';
import categorizeSymbolizers from './categorizeSymbolizers';
import { registerCustomSymbol } from './styles/customSymbols';
import { registerFunction, getFunction } from './functions';
import addBuiltInFunctions from './functions/builtins';
import version from './version';

// Add support for a handful of built-in SLD function implementations.
addBuiltInFunctions();

export * from './Utils';
export {
  Reader,
  categorizeSymbolizers,
  OlStyler,
  createOlStyleFunction,
  createOlStyle,
  registerFunction,
  getFunction,
  registerCustomSymbol,
  version,
};
