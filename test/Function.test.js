/* global it describe before after afterEach expect */
import {
  clearFunctionCache,
  getFunction,
  registerFunction,
} from '../src/functions';
import addBuiltInFunctions from '../src/functions/builtins';

describe('Function registration', () => {
  afterEach(() => {
    clearFunctionCache();
  });

  it('Can register function implementation', () => {
    registerFunction('randomWord', () => 'Banana');
    const randomWord = getFunction('randomWord');
    expect(typeof randomWord).to.equal('function');
    expect(randomWord()).to.equal('Banana');
  });

  it('Returns null for unknown functions', () => {
    expect(getFunction('abracadabra')).to.be.null;
  });
});

describe('Builtin function implementations', () => {
  before(() => {
    addBuiltInFunctions();
  });
  after(() => {
    clearFunctionCache();
  });

  describe('String case conversion functions', () => {
    it('Conversion functions are registered under Geoserver and QGIS alias', () => {
      const f1 = getFunction('strToLowerCase');
      const f2 = getFunction('lower');
      expect(f1).to.equal(f2);
      const f3 = getFunction('strToUpperCase');
      const f4 = getFunction('upper');
      expect(f3).to.equal(f4);
    });

    describe('Convert to upper case', () => {
      const testCases = [
        ['string input', 'Banana', 'BANANA'],
        ['null value', null, ''],
        ['undefined value', undefined, ''],
        ['numeric input', 3.14159, '3.14159'],
        ['object as input', { complex: 'value' }, 'OBJECT'],
        ['array as input', ['hello'], 'OBJECT'],
        ['function as input', () => {}, 'FUNCTION'],
      ];
      testCases.forEach(([label, input, expectedOutput]) => {
        it(`Test case: ${label}`, () => {
          const toUpper = getFunction('strToUpperCase');
          expect(toUpper(input)).to.equal(expectedOutput);
        });
      });
    });

    describe('Convert to lower case', () => {
      it('Convert string to lower case', () => {
        // No need to repeat all upper case test cases. Just do a single input as sanity check.
        const toLower = getFunction('strToLowerCase');
        expect(toLower('Banana')).to.equal('banana');
      });
    });
  });

  describe('Substring extraction', () => {
    describe('QGIS substr function', () => {
      const testCases = [
        ['HELLO WORLD', 3, 5, 'LLO W'],
        ['HELLO WORLD', 6, undefined, ' WORLD'],
        ['HELLO WORLD', -5, undefined, 'WORLD'],
        ['HELLO', 3, -1, 'LL'],
        ['HELLO WORLD', -5, 2, 'WO'],
        ['HELLO WORLD', -5, -1, 'WORL'],
        ['HELLO WORLD', '2', '3', 'ELL'], // should also work for stringly typed parameters.
      ];

      testCases.forEach(([input, start, length, output]) => {
        it(`'${input}', start: ${start}, length: ${length}, output: '${output}'`, () => {
          const substr = getFunction('substr');
          expect(substr(input, start, length)).to.equal(output);
        });
      });
    });

    it('Geoserver strSubstring', () => {
      const strSubstring = getFunction('strSubstring');
      expect(strSubstring('HELLO', 2, 4)).to.equal('LL');
    });

    it('Geoserver strSubstringStart', () => {
      const strSubstringStart = getFunction('strSubstringStart');
      expect(strSubstringStart('HELLO', 2)).to.equal('LLO');
      expect(strSubstringStart('HELLO', -2)).to.equal('LO');
    });
  });

  describe('Set membership using "in" function', () => {
    it('Test membership for strings', () => {
      const inFunc = getFunction('in');
      // prettier-ignore
      expect(inFunc('fox', 'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'the', 'lazy', 'dog')).to.be.true;
    });

    it('Test membership for numbers using string-based comparison', () => {
      const inFunc = getFunction('in');
      // prettier-ignore
      expect(inFunc(42, '1', '2', '3', '42', '100')).to.be.true;
    });

    it('Use geoserver inN alias', () => {
      const in4 = getFunction('in4');
      expect(in4('fox', 'the', 'quick', 'brown', 'fox')).to.be.true;
    });
  });
});
