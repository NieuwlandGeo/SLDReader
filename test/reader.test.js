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
  it('default has featuretypestyle', function() {
    const style = result['WaterBodies'].styles['0'];
    expect(style.featuretypestyle).to.be.an.instanceof(Object);
  });
});
