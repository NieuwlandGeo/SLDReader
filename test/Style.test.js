/* global describe it expect beforeEach */
import Style from 'Style';
import { sld } from './data/test.sld';

let s;
beforeEach(() => {
  s = new Style();
  s.read(sld);
});

describe('Base styler class', () => {
  it('reads', () => {
    expect(s.sld.version).to.equal('1.0.0');
  });
  it('selects layer', () => {
    s.setStyle('Roads');
    expect(s.layer.name).to.equal('Roads');
    expect(s.style.name).to.equal('RoadsDefault');
  });

  it('selects rule', () => {
    const rules = s.getRules({ fid: 'tasmania_water_bodies.2' });
    expect(rules).to.be.an.instanceof(Array);
    expect(rules).to.have.lengthOf(1);
    expect(rules[0].name).to.equal('testRuleName');
  });
  it('does not select rule for other feature name', () => {
    const rules = s.getRules({ fid: 'tasmania_water_bodies.5' });
    expect(rules).to.be.an.instanceof(Array);
    expect(rules).to.have.lengthOf(0);
  });
});
