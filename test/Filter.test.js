/* global describe it expect */
import { filterSelector } from '../src/Filter';

describe('filter rules', () => {
  it('filter isEqualto', () => {
    const props = { fid: 'tasmania_water_bodies.2' };
    const filter = { featureid: ['tasmania_water_bodies.2', 'tasmania_water_bodies.3'] };
    expect(filterSelector(filter, props)).to.be.true;
  });
  it('filter isEqualto false', () => {
    const props = { fid: 'tasmania_water_bodies.0' };
    const filter = { featureid: ['tasmania_water_bodies.2', 'tasmania_water_bodies.3'] };
    expect(filterSelector(filter, props)).to.be.false;
  });
  it('propertyislessthan when true', () => {
    const props = { AREA: 1065512598 };
    const filter = { propertyislessthan: [{ propertyname: 'AREA', literal: 1065512599 }] };
    expect(filterSelector(filter, props)).to.be.true;
  });
  it('propertyislessthan when false', () => {
    const props = { AREA: 1065512599 };
    const filter = { propertyislessthan: [{ propertyname: 'AREA', literal: 1065512599 }] };
    expect(filterSelector(filter, props)).to.be.false;
  });
  it('propertyisequalto', () => {
    const props = { PERIMETER: 1071304933 };
    const filter = { propertyisequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }] };
    expect(filterSelector(filter, props)).to.be.true;
  });
  it('propertyisequalto for non existent prop', () => {
    const props = { PERIMETEEER: 1071304933 };
    const filter = { propertyisequalto: [{ propertyname: 'PERIMETER', literal: 1071304933 }] };
    expect(filterSelector(filter, props)).to.be.false;
  });
});
