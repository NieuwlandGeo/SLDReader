/* global describe it expect */
import { filterSelector } from '../src/Filter';

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
});
