/* global describe it expect */
import { filterSelector, scaleSelector } from '../src/Filter';

describe('filter rules', () => {
  it('filter fid', () => {
    const feature = { id: 'tasmania_water_bodies.2' };
    const filter = { featureid: ['tasmania_water_bodies.2', 'tasmania_water_bodies.3'] };
    expect(filterSelector(filter, feature)).to.be.true;
  });
  it('filter fid false', () => {
    const feature = { id: 'tasmania_water_bodies.0' };
    const filter = { featureid: ['tasmania_water_bodies.2', 'tasmania_water_bodies.3'] };
    expect(filterSelector(filter, feature)).to.be.false;
  });
  it('propertyislessthan when true', () => {
    const feature = { properties: { AREA: 1065512598 } };
    const filter = { propertyislessthan: [{ propertyname: 'AREA', literal: 1065512599 }] };
    expect(filterSelector(filter, feature)).to.be.true;
  });
  it('propertyislessthan when false', () => {
    const feature = { properties: { AREA: 1065512599 } };
    const filter = { propertyislessthan: [{ propertyname: 'AREA', literal: 1065512599 }] };
    expect(filterSelector(filter, feature)).to.be.false;
  });
  it('propertyisequalto', () => {
    const feature = { properties: { PERIMETER: 1071304933 } };
    const filter = { propertyisequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }] };
    expect(filterSelector(filter, feature)).to.be.true;
  });
  it('propertyisequalto for non existent prop', () => {
    const feature = { properties: { PERIMETEEER: 1071304933 } };
    const filter = { propertyisequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }] };
    expect(filterSelector(filter, feature)).to.be.false;
  });
  it('propertyisnotequalto', () => {
    const featureeq = { properties: { PERIMETER: 1071304933 } };
    const filter = { propertyisnotequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }] };
    expect(filterSelector(filter, featureeq)).to.be.false;
    const featureuneq = { properties: { PERIMETER: 1071304900 } };
    expect(filterSelector(filter, featureuneq)).to.be.true;
  });
  it('propertyislessthanorequalto', () => {
    const feature = { properties: { PERIMETER: 1071304933 } };
    const filter = {
      propertyislessthanorequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }],
    };
    expect(filterSelector(filter, feature)).to.be.true;
    const featurels = { properties: { PERIMETER: 1071304932 } };
    expect(filterSelector(filter, featurels)).to.be.true;
    const featuregt = { properties: { PERIMETER: 1071304934 } };
    expect(filterSelector(filter, featuregt)).to.be.false;
  });
  it('propertyisgreaterthan', () => {
    const feature = { properties: { PERIMETER: 1071304933 } };
    const filter = { propertyisgreaterthan: [{ propertyname: 'PERIMETER', literal: 1071304933 }] };
    expect(filterSelector(filter, feature)).to.be.false;
  });
  it('propertyisgreaterthanorequalto', () => {
    const feature = { properties: { PERIMETER: 1071304933 } };
    const filter = {
      propertyisgreaterthanorequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }],
    };
    expect(filterSelector(filter, feature)).to.be.true;
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
