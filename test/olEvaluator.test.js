/* global describe it expect beforeEach */
import OLFormatGeoJSON from 'ol/format/GeoJSON';

import evaluate from '../src/olEvaluator';

const geojson = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [175134, 442000],
  },
  properties: {
    angle: 42,
    size: 20,
    title: 'Nieuwland',
  },
};

const fmtGeoJSON = new OLFormatGeoJSON();

describe('Expression evaluation', () => {
  const getProperty = (feat, prop) => feat.get(prop);

  let feature;
  beforeEach(() => {
    feature = fmtGeoJSON.readFeature(geojson);
  });

  it('Constant value', () => {
    const expression = 42;
    expect(evaluate(expression, feature, getProperty)).to.equal(42);
  });

  it('PropertyName', () => {
    const expression = {
      type: 'expression',
      children: [
        {
          type: 'propertyname',
          value: 'size',
        },
      ],
    };
    expect(evaluate(expression, feature, getProperty)).to.equal(20);
  });

  it('Compound filter expression', () => {
    const expression = {
      type: 'expression',
      typeHint: 'number',
      children: [
        {
          type: 'literal',
          value: '-',
        },
        {
          type: 'propertyname',
          value: 'angle',
        },
      ],
    };
    expect(evaluate(expression, feature, getProperty)).to.equal(-42);
  });

  it('Custom property getter', () => {
    const customGetProperty = (feat, prop) => {
      if (prop === 'size') {
        return 100;
      }
      return feat.get(prop);
    };

    const expression = {
      type: 'expression',
      children: [
        {
          type: 'propertyname',
          value: 'size',
        },
      ],
    };
    expect(evaluate(expression, feature, customGetProperty)).to.equal(100);
  });

  describe('Default values', () => {
    describe('Javascript values', () => {
      it('Use default value when expression is null', () => {
        expect(evaluate(null, null, null, 42)).to.equal(42);
      });

      it('Use default value when expression is undefined', () => {
        expect(evaluate(undefined, null, null, 42)).to.equal(42);
      });

      it('Do not use default value when expression is zero', () => {
        expect(evaluate(0, null, null, 42)).to.equal(0);
      });

      it('Use default value when expression is empty string', () => {
        expect(evaluate('', null, null, '42')).to.equal('42');
      });
    });

    describe('Property lookups', () => {
      function readValueProperty(testFeature, defaultValue, typeHint) {
        const testGetter = (feat, propertyName) =>
          feat.properties[propertyName];
        const testExpression = {
          type: 'propertyname',
          typeHint,
          value: 'value',
        };
        return evaluate(testExpression, testFeature, testGetter, defaultValue);
      }

      it('Use default value when feature is null', () => {
        expect(readValueProperty(null, 42, 'number')).to.equal(42);
      });

      it('Use default value when feature property equals null', () => {
        expect(
          readValueProperty(
            {
              type: 'Feature',
              properties: { value: null },
            },
            42,
            'number'
          )
        ).to.equal(42);
      });

      it('Use default value when feature property is missing', () => {
        expect(
          readValueProperty(
            {
              type: 'Feature',
              properties: {}, // no value property present
            },
            42,
            'number'
          )
        ).to.equal(42);
      });

      it('Do not use default value when feature property equals zero', () => {
        expect(
          readValueProperty(
            {
              type: 'Feature',
              properties: { value: 0 },
            },
            42,
            'number'
          )
        ).to.equal(0);
      });

      it('When typeHint is number, use default value when feature property is an empty string', () => {
        expect(
          readValueProperty(
            {
              type: 'Feature',
              properties: { value: '' },
            },
            42,
            'number'
          )
        ).to.equal(42);
      });

      it('When typeHint is number, use default value when feature property is an invalid numeric string', () => {
        expect(
          readValueProperty(
            {
              type: 'Feature',
              properties: { value: '3,50€' },
            },
            42,
            'number'
          )
        ).to.equal(42);
      });

      it('When typeHint is string, use default value when feature property is an empty string', () => {
        expect(
          readValueProperty(
            {
              type: 'Feature',
              properties: { value: '' },
            },
            'DEFAULT',
            'string'
          )
        ).to.equal('DEFAULT');
      });
    });
  });
});
