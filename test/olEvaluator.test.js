/* global describe it expect beforeEach */
import OLFormatGeoJSON from 'ol/format/GeoJSON';

import evaluate from '../src/olEvaluator';

const geojson = {
  type: 'Feature',
  geometry: {
    type: 'Point',
    coordinates: [175134, 442000],
  },
  properties: {
    angle: 42,
    size: 20,
    title: 'Nieuwland',
  },
};

const fmtGeoJSON = new OLFormatGeoJSON();

describe('OpenLayers expression evaluation', () => {
  let feature;
  beforeEach(() => {
    feature = fmtGeoJSON.readFeature(geojson);
  });

  it('Constant value', () => {
    const expression = 42;
    expect(evaluate(expression, feature)).to.equal(42);
  });

  it('PropertyName', () => {
    const expression = {
      type: 'expression',
      children: [
        {
          type: 'propertyname',
          value: 'size',
        },
      ],
    };
    expect(evaluate(expression, feature)).to.equal(20);
  });

  it('Compound filter expression', () => {
    const expression = {
      type: 'expression',
      children: [
        {
          type: 'literal',
          value: '-',
        },
        {
          type: 'propertyname',
          value: 'angle',
        },
      ],
    };
    expect(evaluate(expression, feature)).to.equal('-42');
  });
});
