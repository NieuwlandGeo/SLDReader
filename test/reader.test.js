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
});
