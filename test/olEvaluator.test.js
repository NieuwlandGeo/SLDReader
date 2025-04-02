/* global describe it expect before beforeEach after */
import OLFormatGeoJSON from 'ol/format/GeoJSON';
import OLLineString from 'ol/geom/LineString';

import evaluate from '../src/olEvaluator';
import addBuiltInFunctions from '../src/functions/builtins';
import { clearFunctionCache } from '../src/functions';
import { Reader } from '../src';

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
  const context = {
    getProperty: (feature, propertyName) => feature.get(propertyName),
    getId: feature => feature.id,
    resolution: 10,
  };

  let feature;
  beforeEach(() => {
    feature = fmtGeoJSON.readFeature(geojson);
  });

  it('Constant value', () => {
    const expression = 42;
    expect(evaluate(expression, feature, context)).to.equal(42);
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
    expect(evaluate(expression, feature, context)).to.equal(20);
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
    expect(evaluate(expression, feature, context)).to.equal(-42);
  });

  it('Custom property getter', () => {
    const customcontext = {
      getProperty: (feat, prop) => {
        if (prop === 'size') {
          return 100;
        }
        return feat.get(prop);
      },
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
    expect(evaluate(expression, feature, customcontext)).to.equal(100);
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
        const testContext = {
          getProperty: (feat, propertyName) => feat.properties[propertyName],
        };
        const testExpression = {
          type: 'propertyname',
          typeHint,
          value: 'value',
        };
        return evaluate(testExpression, testFeature, testContext, defaultValue);
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

  describe('Function evaluation', () => {
    before(() => {
      addBuiltInFunctions();
    });

    after(() => {
      clearFunctionCache();
    });

    it('Evaluate function expression', () => {
      const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <Function name="strToLowerCase">
            <PropertyName>title</PropertyName>
          </Function>
          <Literal>nieuwland</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const functionExpression = filter.expression1;
      const result = evaluate(functionExpression, feature, context);
      expect(result).to.equal('nieuwland');
    });
  });

  describe('Geometry-valued expressions', () => {
    let lineFeature;
    before(() => {
      const lineGeoJSON = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        },
        properties: {},
      };
      lineFeature = fmtGeoJSON.readFeature(lineGeoJSON);
    });

    it('Propertyname expression using geometry field name returns OpenLayers geometry', () => {
      // Note, 'geometry' is the default geometry field name used by OpenLayers.
      const expression = {
        type: 'propertyname',
        value: 'geometry',
      };
      const result = evaluate(expression, lineFeature, context);
      expect(result instanceof OLLineString).to.be.true;
      expect(result.getCoordinates()).to.deep.equal([
        [0, 0],
        [1, 1],
      ]);
    });
  });

  it('Mathematical operator expressions', () => {
    // (36 / (8 - 2)) * (4 + 3)
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <Mul>
          <Div>
            <Literal>36</Literal>
            <Sub>
              <Literal>8</Literal>
              <Literal>2</Literal>
            </Sub>
          </Div>
          <Add>
            <Literal>4</Literal>
            <Literal>3</Literal>
          </Add>
        </Mul>
        <Literal>42</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);
    const mathExpression = filter.expression1;
    const result = evaluate(mathExpression, null, null);
    expect(result).to.equal(42);
  });
});
