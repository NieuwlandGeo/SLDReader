/* global describe it expect beforeEach */
import {reader} from 'reader';
import {sld} from './data/test.sld';

var result;
beforeEach(() => {
  result = reader(sld);
});

describe('Reads xml', function() {
  it('returns object', () => {
    expect(result).to.be.an.instanceof(Object);
    expect(result.version).to.equal('1.0.0');
  });
  it('returns object for the layers', () => {
    var layernames = ['WaterBodies', 'Roads', 'Cities', 'Land'];
    for (let s of layernames) {
      expect(result[s]).to.be.an.instanceof(Object);
    }
  });
  it('has style for waterbodies', function() {
    const wbstyles = result['WaterBodies'].styles;
    expect(wbstyles).to.be.an.instanceof(Array);
    expect(wbstyles).to.have.length(12);
  });
  it('style has props', function() {
    const style = result['WaterBodies'].styles['0'];
    expect(style.featuretypestyles).to.be.an.instanceof(Array);
    expect(style.default).to.be.true;
  });
  it('featuretypestyles has rules', function() {
    const featuretypestyle = result['WaterBodies'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
  });
  it('rules have filter for featureid', function() {
    const filter = result['WaterBodies'].styles['0'].featuretypestyles['0'].rules['0'].filters['0'];
    expect(filter).to.be.an.instanceof(Object);
    expect(filter.type).to.equal('FeatureId');
    expect(filter.value).to.equal('tasmania_water_bodies.2');
  });
});
