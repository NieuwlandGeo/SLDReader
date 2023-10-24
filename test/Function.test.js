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
});
