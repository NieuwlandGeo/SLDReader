/* global describe it expect beforeEach */
import {reader} from 'reader';
import {sld} from './data/test.sld';

var result;
beforeEach(() => {
  result = reader(sld);
});

describe('Reads xml', function() {
  it('returns object', function() {
    expect(result).to.be.an.instanceof(Object);
  });
});
