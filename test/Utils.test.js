/* global describe it expect */
import * as Utils from '../src/Utils';

describe('reads info from StyledLayerDescriptor object', () => {
  it('get layer names', () => {
    const sld = {
      layers: [
        {
          name: 'WaterBodies',
        },
        {
          name: 'Roads',
        },
        {
          name: 'Cities',
        },
      ],
    };
    const layernames = Utils.getLayerNames(sld);
    expect(layernames).to.have.length(3);
    expect(layernames).to.deep.equal(['WaterBodies', 'Roads', 'Cities']);
  });
  it('get layer by name', () => {
    const sld = {
      layers: [
        {
          name: 'WaterBodies',
          styles: [{}],
        },
        {
          name: 'Roads',
        },
        {
          name: 'Cities',
        },
      ],
    };
    const layer = Utils.getLayer(sld, 'WaterBodies');
    expect(layer.styles).to.have.length(1);
    expect(layer.name).to.equal('WaterBodies');
  });
  it('get style names', () => {
    const layer = {
      styles: [
        {
          name: 'Default Styler',
        },
      ],
    };
    const stylenames = Utils.getStyleNames(layer, 'WaterBodies');
    expect(stylenames).to.have.length(1);
    expect(stylenames).to.deep.equal(['Default Styler']);
  });
  it('get style', () => {
    const layer = {
      styles: [
        {
          name: 'Default Styler',
        },
        {
          name: 'Hover Styler',
        },
      ],
    };
    const style = Utils.getStyle(layer, 'Hover Styler');
    expect(style.name).to.equal('Hover Styler');
  });
});
