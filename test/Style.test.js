/* global describe it expect beforeEach */
import {Style} from 'Style';
import {sld} from './data/test.sld';

var s;
beforeEach(() => {
  s = new Style();
  s.read(sld);
});

describe('Base styler class', function() {
  it('reads', () => {
    expect(s.sld.version).to.equal('1.0.0');
  });
  it('selects layer', () => {
    s.setStyle('Roads');
    expect(s.layer.name).to.equal('Roads');
    expect(s.style.name).to.equal('RoadsDefault');
  });

  it('selects rule', () => {
    const rules = s.getRules({fid: 'tasmania_water_bodies.2'});
    expect(rules).to.be.an.instanceof(Array);
    expect(rules[0].name).to.equal('testRuleName');

  });
});
