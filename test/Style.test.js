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

  it('selects rule testRuleName for fid 2', () => {
    const rules = s.getRules({ fid: 'tasmania_water_bodies.2' });
    expect(rules).to.be.an.instanceof(Array);
    expect(rules).to.have.lengthOf(1);
    expect(rules[0].name).to.equal('testRuleName');
  });
  it('select rule with name testRuleNameElse for other feature', () => {
    const rules = s.getRules({ fid: 'tasmania_water_bodies.5' });
    expect(rules).to.be.an.instanceof(Array);
    expect(rules).to.have.lengthOf(1);
    expect(rules[0].name).to.equal('testRuleNameElse');
  });
});
