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


  it('set layer with default style', () => {
    s.setStyle('Roads');
    expect(s.layer.name).to.equal('Roads');
    expect(s.style.name).to.equal('RoadsDefault');
  });

  it('set style of layer', () => {
    s.setStyle('WaterBodies', 'Hover Styler');
    expect(s.layer.name).to.equal('WaterBodies');
    expect(s.style.name).to.equal('Hover Styler');
  });

  it('set testRuleNameHover rule', () => {
    s.setStyle('WaterBodies', 'Hover Styler');
    const rules = s.getRules({ PERIMETER: '1', AREA: 1 });
    expect(rules).to.be.an.instanceof(Array);
    expect(rules).to.have.lengthOf(1);
    expect(rules[0].name).to.equal('testRuleNameHover');
  });
  it('set testRuleNameHoverElse rule', () => {
    s.setStyle('WaterBodies', 'Hover Styler');
    const rules = s.getRules({ PERIMETER: '1071304933', AREA: 1 });
    expect(rules).to.be.an.instanceof(Array);
    expect(rules).to.have.lengthOf(1);
    expect(rules[0].name).to.equal('testRuleNameHoverElse');
  });
});
