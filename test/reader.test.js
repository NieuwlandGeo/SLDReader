/* global describe it expect beforeEach */
import {Reader} from 'Reader';
import {sld} from './data/test.sld';

var result;
beforeEach(() => {
  result = Reader(sld);
});

describe('Reads xml', function() {
  it('returns object', () => {
    expect(result).to.be.an.instanceof(Object);
    expect(result.version).to.equal('1.0.0');
    expect(result.layers).to.be.an.instanceof(Array);
  });
  it('returns object for the layers', () => {
    var layernames = ['WaterBodies', 'Roads', 'Cities', 'Land'];
    expect(result.layers).to.have.length(4);
    for (let i in result.layers) {
      expect(result.layers[i].name).to.equal(layernames[i]);
    }
  });
  it('has style for waterbodies', function() {
    const wbstyles = result.layers['0'].styles;
    expect(wbstyles).to.be.an.instanceof(Array);
    expect(wbstyles).to.have.length(12);
  });
  it('style has props', function() {
    const style = result.layers['0'].styles['0'];
    expect(style.featuretypestyles).to.be.an.instanceof(Array);
    expect(style.default).to.be.true;
  });
  it('featuretypestyles has rules', function() {
    const featuretypestyle = result.layers['0'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
  });
  it('rules have filter for featureid', function() {
    const filter = result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'].filters['0'];
    expect(filter).to.be.an.instanceof(Object);
    expect(filter.type).to.equal('FeatureId');
    expect(filter.value).to.equal('tasmania_water_bodies.2');
  });
  it('rules have symbolizers', function() {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule.polygonsymbolizer).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.css['0']).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.css['0'].name).to.equal('fill');
    expect(rule.polygonsymbolizer.fill.css['0'].value).to.equal('blue');
    expect(rule.polygonsymbolizer.fill.css['1'].name).to.equal('fill-opacity');
    expect(rule.polygonsymbolizer.fill.css['1'].value).to.equal('1.0');
    expect(rule.polygonsymbolizer.stroke.css['0']).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.stroke.css['0'].name).to.equal('stroke');
  });

});
