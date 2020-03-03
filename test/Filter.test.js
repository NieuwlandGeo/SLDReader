/* global describe it expect */
import { filterSelector, scaleSelector } from '../src/Filter';

describe('filter rules', () => {
  describe('FID filter', () => {
    const filter = {
      type: 'featureid',
      fids: ['tasmania_water_bodies.2', 'tasmania_water_bodies.3'],
    };

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
      const feature = { properties: { AREA: 1065512598 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyislessthan',
        propertyname: 'AREA',
        literal: 1065512599,
      };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    it('propertyislessthan when false', () => {
      const feature = { properties: { AREA: 1065512599 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyislessthan',
        propertyname: 'AREA',
        literal: 1065512599,
      };
      expect(filterSelector(filter, feature)).to.be.false;
    });

    it('propertyisequalto', () => {
      const feature = { properties: { PERIMETER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyisequalto',
        propertyname: 'PERIMETER',
        literal: 1071304933,
      };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    it('propertyisequalto for non existent prop', () => {
      const feature = { properties: { PERIMETEEER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyisequalto',
        propertyname: 'PERIMETER',
        literal: 1071304933,
      };
      expect(filterSelector(filter, feature)).to.be.false;
    });

    it('propertyisnotequalto', () => {
      const featureeq = { properties: { PERIMETER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyisnotequalto',
        propertyname: 'PERIMETER',
        literal: 1071304933,
      };
      expect(filterSelector(filter, featureeq)).to.be.false;
      const featureuneq = { properties: { PERIMETER: 1071304900 } };
      expect(filterSelector(filter, featureuneq)).to.be.true;
    });

    it('propertyisnull', () => {
      const featureeq = { properties: { PERIMETER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyisnull',
        propertyname: 'PERIMETER',
      };
      expect(filterSelector(filter, featureeq)).to.be.false;
      const featureuneq = { properties: { PERIMETER: null } };
      expect(filterSelector(filter, featureuneq)).to.be.true;
    });

    it('propertyislessthanorequalto', () => {
      const feature = { properties: { PERIMETER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyislessthanorequalto',
        propertyname: 'PERIMETER',
        literal: 1071304933,
      };
      expect(filterSelector(filter, feature)).to.be.true;
      const featurels = { properties: { PERIMETER: 1071304932 } };
      expect(filterSelector(filter, featurels)).to.be.true;
      const featuregt = { properties: { PERIMETER: 1071304934 } };
      expect(filterSelector(filter, featuregt)).to.be.false;
    });

    it('propertyisgreaterthan', () => {
      const feature = { properties: { PERIMETER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyisgreaterthan',
        propertyname: 'PERIMETER',
        literal: 1071304933,
      };
      expect(filterSelector(filter, feature)).to.be.false;
    });

    it('propertyisgreaterthanorequalto', () => {
      const feature = { properties: { PERIMETER: 1071304933 } };
      const filter = {
        type: 'comparison',
        operator: 'propertyisgreaterthanorequalto',
        propertyname: 'PERIMETER',
        literal: 1071304933,
      };
      expect(filterSelector(filter, feature)).to.be.true;
    });

    describe('propertyisbetween', () => {
      const filter = {
        type: 'comparison',
        operator: 'propertyisbetween',
        propertyname: 'age',
        lowerboundary: '30',
        upperboundary: '100',
      };

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
      const filterBase = {
        type: 'comparison',
        operator: 'propertyislike',
        propertyname: 'value',
        literal: '', // overridden in testLike function below
        wildcard: '%',
        singlechar: '?',
        escapechar: '\\',
      };

      function testLike(pattern, value) {
        const filter = Object.assign(filterBase, { literal: pattern });
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
    });
  });

  describe('Logical filters', () => {
    const lakeFilter = {
      type: 'comparison',
      operator: 'propertyisequalto',
      propertyname: 'WATER_TYPE',
      literal: 'Lake',
    };

    const areaFilter = {
      type: 'comparison',
      operator: 'propertyisequalto',
      propertyname: 'area',
      literal: 1067509088,
    };

    const areaFilter2 = {
      type: 'comparison',
      operator: 'propertyisgreaterthanorequalto',
      propertyname: 'area',
      literal: 1067509088,
    };

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
      const kwikFilter = {
        type: 'comparison',
        operator: 'propertyisequalto',
        propertyname: 'name',
        literal: 'Kwik',
      };

      const kwekFilter = { ...kwikFilter, literal: 'Kwek' };

      const kwakFilter = { ...kwikFilter, literal: 'Kwak' };

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
        const filter = {
          type: 'not',
          predicate: {
            type: 'comparison',
            operator: 'propertyisequalto',
            propertyname: 'WATER_TYPE',
            literal: 'Acid',
          },
        };
        expect(filterSelector(filter, feature)).to.be.true;
      });
    });

    describe('Nested logical filter', () => {
      const harry = { properties: { name: 'Harry', age: 64 } };
      const sjenkie = { properties: { name: 'Sjenkie', age: 8 } };

      function getEqualsFilter(propertyname, literal) {
        return {
          type: 'comparison',
          operator: 'propertyisequalto',
          propertyname,
          literal,
        };
      }

      function negate(predicate) {
        return {
          type: 'not',
          predicate,
        };
      }

      const nameIsPietOrHarry = {
        type: 'or',
        predicates: [
          getEqualsFilter('name', 'Piet'),
          getEqualsFilter('name', 'Harry'),
        ],
      };

      const isAKid = {
        type: 'comparison',
        operator: 'propertyislessthan',
        propertyname: 'age',
        literal: 18,
      };

      // Sanity check for each subfilter.
      expect(filterSelector(nameIsPietOrHarry, harry)).to.be.true;
      expect(filterSelector(isAKid, sjenkie)).to.be.true;

      const combinedFilter = {
        type: 'and',
        predicates: [negate(nameIsPietOrHarry), isAKid],
      };
      expect(filterSelector(combinedFilter, sjenkie)).to.be.true;
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
    const fidFilter = {
      type: 'featureid',
      fids: ['tasmania_water_bodies.2', 'tasmania_water_bodies.3'],
    };

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
  const myFeature = {
    getAttributes: () => ({
      name: 'Test',
      age: 42,
    }),
  };

  it('Simple filter', () => {
    const filter = {
      type: 'comparison',
      operator: 'propertyisequalto',
      propertyname: 'name',
      literal: 'Test1234',
    };

    const result = filterSelector(filter, myFeature, {
      getProperty: (feature, propertyName) =>
        feature.getAttributes()[propertyName],
    });

    expect(result).to.be.false;
  });

  it('Logical filter', () => {
    const filter = {
      type: 'and',
      predicates: [
        {
          type: 'comparison',
          operator: 'propertyisequalto',
          propertyname: 'name',
          literal: 'Test',
        },
        {
          type: 'comparison',
          operator: 'propertyisgreaterthan',
          propertyname: 'Age',
          literal: '40',
        },
      ],
    };

    const result = filterSelector(filter, myFeature, {
      getProperty: (feature, propertyName) =>
        feature.getAttributes()[propertyName],
    });

    expect(result).to.be.true;
  });
});
