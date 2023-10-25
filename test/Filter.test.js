import OLFormatGeoJSON from 'ol/format/GeoJSON';

import { filterSelector, scaleSelector } from '../src/Filter';
/* global describe it before beforeEach after expect */
import Reader from '../src/Reader';
import { clearFunctionCache } from '../src/functions';
import addBuiltInFunctions from '../src/functions/builtins';

const fmtGeoJSON = new OLFormatGeoJSON();

describe('filter rules', () => {
  describe('FID filter', () => {
    const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
      <FeatureId fid="tasmania_water_bodies.2" />
      <FeatureId fid="tasmania_water_bodies.3" />
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);

    it('filter fid', () => {
      const feature = { id: 'tasmania_water_bodies.2' };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    it('filter fid false', () => {
      const feature = { id: 'tasmania_water_bodies.0' };
      expect(filterSelector(filter, feature)).to.be.false;
    });
  });

  describe('Binary comparison', () => {
    it('propertyislessthan when true', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsLessThan>
          <PropertyName>AREA</PropertyName>
          <Literal>1065512599</Literal>
        </PropertyIsLessThan>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { AREA: 1065512598 } };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    it('propertyislessthan when false', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsLessThan>
          <PropertyName>AREA</PropertyName>
          <Literal>1065512599</Literal>
        </PropertyIsLessThan>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { AREA: 1065512599 } };
      expect(filterSelector(filter, feature)).to.be.false;
    });

    it('propertyisequalto', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { PERIMETER: 1071304933 } };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    it('propertyisequalto for non existent prop', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { PERIMETEEER: 1071304933 } };
      expect(filterSelector(filter, feature)).to.be.false;
    });

    it('propertyisnotequalto', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsNotEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsNotEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const featureeq = { properties: { PERIMETER: 1071304933 } };
      expect(filterSelector(filter, featureeq)).to.be.false;
      const featureuneq = { properties: { PERIMETER: 1071304900 } };
      expect(filterSelector(filter, featureuneq)).to.be.true;
    });

    it('propertyisnull', () => {
      const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsNull>
          <PropertyName>PERIMETER</PropertyName>
        </PropertyIsNull>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const featureeq = { properties: { PERIMETER: 1071304933 } };
      expect(filterSelector(filter, featureeq)).to.be.false;
      const featureuneq = { properties: { PERIMETER: null } };
      expect(filterSelector(filter, featureuneq)).to.be.true;
    });

    it('propertyislessthanorequalto', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsLessThanOrEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsLessThanOrEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { PERIMETER: 1071304933 } };
      expect(filterSelector(filter, feature)).to.be.true;
      const featurels = { properties: { PERIMETER: 1071304932 } };
      expect(filterSelector(filter, featurels)).to.be.true;
      const featuregt = { properties: { PERIMETER: 1071304934 } };
      expect(filterSelector(filter, featuregt)).to.be.false;
    });

    it('propertyisgreaterthan', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsGreaterThan>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsGreaterThan>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { PERIMETER: 1071304933 } };
      expect(filterSelector(filter, feature)).to.be.false;
    });

    it('propertyisgreaterthanorequalto', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsGreaterThanOrEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsGreaterThanOrEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { PERIMETER: 1071304933 } };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    describe('propertyisbetween', () => {
      let filter;
      before(() => {
        const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
        <StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
          <PropertyIsBetween>
            <PropertyName>age</PropertyName>
            <LowerBoundary>
              <Literal>30</Literal>
            </LowerBoundary>
            <UpperBoundary>
              <Literal>100</Literal>
            </UpperBoundary>
          </PropertyIsBetween>
        </Filter></StyledLayerDescriptor>`;
        filter = Reader(filterXml).filter;
      });

      it('inside', () => {
        const feature = { properties: { age: 42 } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('at lower bound', () => {
        const feature = { properties: { age: 30 } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('below lower bound', () => {
        const feature = { properties: { age: 10 } };
        expect(filterSelector(filter, feature)).to.be.false;
      });

      it('at upper bound', () => {
        const feature = { properties: { age: 100 } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('above upper bound', () => {
        const feature = { properties: { age: 100.001 } };
        expect(filterSelector(filter, feature)).to.be.false;
      });
    });

    describe('propertyislike', () => {
      let filterBase;
      beforeEach(() => {
        const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
          <PropertyIsLike wildCard="%" singleChar="?" escapeChar="\\">
            <PropertyName>value</PropertyName>
            <Literal></Literal> <!-- will be overidden in testLike function below -->
          </PropertyIsLike>
        </Filter></StyledLayerDescriptor>`;
        filterBase = Reader(filterXml).filter;
      });

      function testLike(pattern, value) {
        const filter = Object.assign(filterBase, { expression2: pattern });
        const feature = { properties: { value } };
        return filterSelector(filter, feature);
      }

      it('exact match true', () => {
        expect(testLike('exact', 'exact')).to.be.true;
      });

      it('exact match false', () => {
        expect(testLike('exact', 'exacT')).to.be.false;
      });

      it('wildcard match true', () => {
        expect(testLike('ab%ra', 'abracadabra')).to.be.true;
      });

      it('wildcard match false', () => {
        expect(testLike('ab%ra', 'abracadabrabla')).to.be.false;
      });

      it('singlechar match true', () => {
        expect(testLike('jans?en', 'janssen')).to.be.true;
      });

      it('singlechar match false', () => {
        expect(testLike('jans?en', 'jansen')).to.be.false;
      });

      it('wildcard match without content true', () => {
        expect(testLike('%hoi%', 'hoi')).to.be.true;
      });

      it('Case insensitive match', () => {
        const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
          <PropertyIsLike wildCard="%" singleChar="?" escapeChar="\\" matchCase="false">
            <PropertyName>text</PropertyName>
            <Literal>TeSt</Literal>
          </PropertyIsLike>
        </Filter></StyledLayerDescriptor>`;
        const { filter } = Reader(filterXml);
        const feature = { properties: { text: 'TEST' } };
        expect(filterSelector(filter, feature)).to.be.true;
      });
    });

    describe('Boolean equality testing', () => {
      const testCases = [
        [true, true],
        ['true', true],
        [true, 'true'],
        ['true', 'true'],
        [false, false],
        ['false', false],
        [false, 'false'],
        ['false', 'false'],
      ];
      testCases.forEach(([b1, b2]) => {
        const t1 = typeof b1 === 'boolean' ? b1 : `"${b1}"`;
        const t2 = typeof b2 === 'boolean' ? b2 : `"${b2}"`;
        it(`These should be equal: ${t1} and ${t2}`, () => {
          const filter = {
            type: 'comparison',
            operator: 'propertyisequalto',
            expression1: b1,
            expression2: b2,
            matchcase: true,
          };
          const dummyFeature = { properties: {} };
          expect(filterSelector(filter, dummyFeature)).to.be.true;
        });
      });
    });
  });

  describe('Comparisons with missing/null values', () => {
    it('propertyislike should return false for missing/null values', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsLike wildCard="%" singleChar="?" escapeChar="\\" matchCase="false">
          <PropertyName>text</PropertyName>
          <Literal>something</Literal>
        </PropertyIsLike>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const emptyFeature = { properties: { text: null } };
      expect(filterSelector(filter, emptyFeature)).to.be.false;
    });

    it('propertyisbetween should return false for missing/null values', () => {
      const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
      <StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsBetween>
          <PropertyName>age</PropertyName>
          <LowerBoundary>
            <Literal>-100</Literal>
          </LowerBoundary>
          <UpperBoundary>
            <Literal>100</Literal>
          </UpperBoundary>
        </PropertyIsBetween>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const emptyFeature = { properties: { age: null } };
      expect(filterSelector(filter, emptyFeature)).to.be.false;
    });

    const operators = [
      'PropertyIsEqualTo',
      'PropertyIsNotEqualTo',
      'PropertyIsLessThan',
      'PropertyIsLessThanOrEqualTo',
      'PropertyIsGreaterThan',
      'PropertyIsGreaterThanOrEqualTo',
    ];

    operators.forEach(operator => {
      it(`Comparison should return false for missing/null value: ${operator}`, () => {
        const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
          <${operator}>
            <PropertyName>TEMPERATURE</PropertyName>
            <Literal>42</Literal>
          </${operator}>
        </Filter></StyledLayerDescriptor>`;
        const { filter } = Reader(filterXml);
        const emptyFeature = { properties: { TEMPERATURE: null } };
        expect(filterSelector(filter, emptyFeature)).to.be.false;
      });
    });
  });

  describe('Comparisons with strings', () => {
    it('propertyisequalto with matchCase: false', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo matchCase="false">
          <PropertyName>text</PropertyName>
          <Literal>TEST</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { text: 'test' } };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    it('propertyisgreaterthan with matchCase: true', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsGreaterThan matchCase="true">
          <PropertyName>text</PropertyName>
          <Literal>Banana</Literal>
        </PropertyIsGreaterThan>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { text: 'monkey' } };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    describe('propertyisbetween for strings', () => {
      let filter;
      before(() => {
        const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
        <StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
          <PropertyIsBetween>
            <PropertyName>date</PropertyName>
            <LowerBoundary>
              <Literal>1980-05-02</Literal>
            </LowerBoundary>
            <UpperBoundary>
              <Literal>2021-06-27</Literal>
            </UpperBoundary>
          </PropertyIsBetween>
        </Filter></StyledLayerDescriptor>`;
        filter = Reader(filterXml).filter;
      });

      it('inside', () => {
        const feature = { properties: { date: '1999-12-31' } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('at lower bound', () => {
        const feature = { properties: { date: '1980-05-02' } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('below lower bound', () => {
        const feature = { properties: { date: '1950-09-07' } };
        expect(filterSelector(filter, feature)).to.be.false;
      });

      it('at upper bound', () => {
        const feature = { properties: { date: '2021-06-27' } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('at upper bound, simple date', () => {
        const feature = { properties: { date: '2021-06-27' } };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('above upper bound', () => {
        const feature = { properties: { date: '2222-12-21' } };
        expect(filterSelector(filter, feature)).to.be.false;
      });
    });
  });

  describe('Logical filters', () => {
    let lakeFilter;
    let areaFilter;
    let areaFilter2;
    before(() => {
      const lakeFilterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <PropertyName>WATER_TYPE</PropertyName>
          <Literal>Lake</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      lakeFilter = Reader(lakeFilterXml).filter;

      const areaFilterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <PropertyName>area</PropertyName>
          <Literal>1067509088</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      areaFilter = Reader(areaFilterXml).filter;

      const areaFilter2Xml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsGreaterThanOrEqualTo>
          <PropertyName>area</PropertyName>
          <Literal>1067509088</Literal>
        </PropertyIsGreaterThanOrEqualTo>
      </Filter></StyledLayerDescriptor>`;
      areaFilter2 = Reader(areaFilter2Xml).filter;
    });

    const feature = {
      properties: { WATER_TYPE: 'Lake', area: 1067509088 },
    };

    describe('AND', () => {
      it('and filter', () => {
        const filter = {
          type: 'and',
          predicates: [lakeFilter, areaFilter2],
        };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('and filter with 2 child filters of same type', () => {
        const filter = {
          type: 'and',
          predicates: [areaFilter],
        };
        expect(filterSelector(filter, feature)).to.be.true;
      });

      it('and filter with no predicates returns false', () => {
        const filter = {
          type: 'and',
          predicates: [],
        };
        expect(filterSelector(filter, feature)).to.be.false;
      });
    });

    describe('OR', () => {
      let kwikFilter;
      let kwekFilter;
      let kwakFilter;
      before(() => {
        const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
          <PropertyIsEqualTo>
            <PropertyName>name</PropertyName>
            <Literal>Kwik</Literal>
          </PropertyIsEqualTo>
        </Filter></StyledLayerDescriptor>`;
        kwikFilter = Reader(filterXml).filter;
        kwekFilter = { ...kwikFilter, expression2: 'Kwek' };
        kwakFilter = { ...kwikFilter, expression2: 'Kwak' };
      });

      const duckling = { properties: { name: 'Kwak' } };

      it('or filter without predicates should return false', () => {
        const filter = { type: 'or', predicates: [] };
        expect(filterSelector(filter, duckling)).to.be.false;
      });

      it('or filter with one match returns true', () => {
        const filter = {
          type: 'or',
          predicates: [kwikFilter, kwekFilter, kwakFilter],
        };
        expect(filterSelector(filter, duckling)).to.be.true;
      });

      it('or filter with no matches returns false', () => {
        const filter = {
          type: 'or',
          predicates: [kwikFilter, kwekFilter],
        };
        expect(filterSelector(filter, duckling)).to.be.false;
      });
    });

    describe('NOT', () => {
      it('not filter', () => {
        const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
          <Not>
            <PropertyIsEqualTo>
              <PropertyName>WATER_TYPE</PropertyName>
              <Literal>Acid</Literal>
            </PropertyIsEqualTo>
          </Not>
        </Filter></StyledLayerDescriptor>`;
        const { filter } = Reader(filterXml);
        expect(filterSelector(filter, feature)).to.be.true;
      });
    });

    it('Double negation', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <Not>
          <Not>
            <PropertyIsEqualTo>
              <PropertyName>name</PropertyName>
              <Literal>Piet</Literal>
            </PropertyIsEqualTo>
          </Not>
        </Not>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const piet = { properties: { name: 'Piet' } };
      expect(filterSelector(filter, piet)).to.be.true;
    });

    it('Nested logical filters', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <And>
          <Not>
            <Or>
              <PropertyIsEqualTo>
                <PropertyName>name</PropertyName>
                <Literal>Piet</Literal>
              </PropertyIsEqualTo>
              <PropertyIsEqualTo>
                <PropertyName>name</PropertyName>
                <Literal>Harry</Literal>
              </PropertyIsEqualTo>
            </Or>
          </Not>
          <PropertyIsLessThan>
            <PropertyName>age</PropertyName>
            <Literal>18</Literal>
          </PropertyIsLessThan>
        </And>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const sjenkie = { properties: { name: 'Sjenkie', age: 8 } };
      expect(filterSelector(filter, sjenkie)).to.be.true;
      const piet = { properties: { name: 'Piet', age: 8 } };
      expect(filterSelector(filter, piet)).to.be.false;
    });
  });
});

describe('scale selector', () => {
  it('return false when resultion is greater as rule maxscaledenominator', () => {
    const rule = {
      maxscaledenominator: 999,
    };
    expect(scaleSelector(rule, 1000 * 0.00028)).to.be.false;
  });
});

describe('Custom Feature Id extraction', () => {
  it('Tests against FID for a custom feature', () => {
    const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
      <FeatureId fid="tasmania_water_bodies.2" />
      <FeatureId fid="tasmania_water_bodies.3" />
    </Filter></StyledLayerDescriptor>`;
    const fidFilter = Reader(filterXml).filter;

    const myFeature = {
      ogc_fid: 'tasmania_water_bodies.2',
    };

    const result = filterSelector(fidFilter, myFeature, {
      getFeatureId: feature => feature.ogc_fid,
    });

    expect(result).to.be.true;
  });
});

describe('Custom property extraction', () => {
  it('Simple filter', () => {
    const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <PropertyName>name</PropertyName>
        <Literal>Test1234</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);

    const myFeature = {
      getAttributes: () => ({
        name: 'Test',
      }),
    };

    const result = filterSelector(filter, myFeature, {
      getProperty: (feature, propertyName) =>
        feature.getAttributes()[propertyName],
    });

    expect(result).to.be.false;
  });

  it('Logical filter', () => {
    const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
      <And>
        <PropertyIsGreaterThan>
          <PropertyName>age</PropertyName>
          <Literal>40</Literal>
        </PropertyIsGreaterThan>
        <PropertyIsEqualTo>
          <PropertyName>name</PropertyName>
          <Literal>Test</Literal>
        </PropertyIsEqualTo>
      </And>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);

    const myFeature = {
      getAttributes: () => ({
        name: 'Test',
        age: 42,
      }),
    };

    const result = filterSelector(filter, myFeature, {
      getProperty: (feature, propertyName) =>
        feature.getAttributes()[propertyName],
    });

    expect(result).to.be.true;
  });

  describe('Non-standard filters', () => {
    it('Literal equals another literal', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <Literal>Test1234</Literal>
          <Literal>Test1234</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: {} };
      const result = filterSelector(filter, feature);
      expect(result).to.be.true;
    });

    it('Property equals another property', () => {
      const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <PropertyName>prop1</PropertyName>
          <PropertyName>prop2</PropertyName>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { prop1: 42, prop2: 42 } };
      const result = filterSelector(filter, feature);
      expect(result).to.be.true;
    });
  });

  describe('Functions in filters', () => {
    before(() => {
      addBuiltInFunctions();
    });

    after(() => {
      clearFunctionCache();
    });

    it('Comparison using function value', () => {
      // Yes, I know the matchCase attribute exists on binary comparison operators.
      // This is just testing if the function gets called correctly.
      const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <Function name="upper">
            <PropertyName>title</PropertyName>
          </Function>
          <Literal>NIEUWLAND</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const feature = { properties: { title: 'Nieuwland' } };
      const result = filterSelector(filter, feature);
      expect(result).to.be.true;
    });

    it('Comparison using geometry dimension', () => {
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
      const lineFeature = fmtGeoJSON.readFeature(lineGeoJSON);
      const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <Function name="dimension">
            <PropertyName>geometry</PropertyName>
          </Function>
          <Literal>1</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const result = filterSelector(filter, lineFeature);
      expect(result).to.be.true;
    });

    it('Comparison using nested functions and geometry type', () => {
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
      const lineFeature = fmtGeoJSON.readFeature(lineGeoJSON);
      const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
        <PropertyIsEqualTo>
          <Function name="in3">
            <Function name="strToLowerCase">
              <Function name="geometryType">
                <PropertyName>geometry</PropertyName>
              </Function>
            </Function>
            <Literal>linestring</Literal>
            <Literal>linearring</Literal>
            <Literal>multilinestring</Literal>
          </Function>
          <Literal>true</Literal>
        </PropertyIsEqualTo>
      </Filter></StyledLayerDescriptor>`;
      const { filter } = Reader(filterXml);
      const result = filterSelector(filter, lineFeature);
      expect(result).to.be.true;
    });
  });
});
