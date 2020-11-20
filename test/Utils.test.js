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

  describe('Evaluating rule filters: ElseFilters and ScaleDenominators', () => {
    const testFeature = {
      type: 'Feature',
      geometry: null,
      properties: {
        value: 42,
      },
    };

    it('Skip rules outside min/max scale denominator', () => {
      const featureTypeStyle = {
        rules: [
          {
            name: 'rule1',
            maxscaledenominator: 500,
          },
          {
            name: 'rule2',
            minscaledenominator: 500,
            maxscaledenominator: 5000,
          },
          {
            name: 'rule3',
            minscaledenominator: 5000,
          },
        ],
      };
      const filteredRules = Utils.getRules(
        featureTypeStyle,
        testFeature,
        0.28 // scale 1:1000.
      );
      expect(filteredRules.map(rule => rule.name)).to.deep.equal(['rule2']);
    });

    it('Skip ElseFilter when any other rule matches', () => {
      const featureTypeStyle = {
        rules: [
          {
            name: 'always-passes',
          },
          {
            name: 'rule-elsefilter',
            elsefilter: true,
          },
          {
            name: 'always-passes-too',
          },
        ],
      };
      const filteredRules = Utils.getRules(
        featureTypeStyle,
        testFeature,
        0.28 // scale 1:1000.
      );
      expect(filteredRules.map(rule => rule.name)).to.deep.equal([
        'always-passes',
        'always-passes-too',
      ]);
    });

    it('Keep ElseFilter rule if no other rule matches', () => {
      const featureTypeStyle = {
        rules: [
          {
            name: 'rule-elsefilter',
            elsefilter: true,
          },
          {
            name: 'only-above-scale-5000',
            minscaledenominator: 5000,
          },
          {
            name: 'value-equals-100',
            filter: {
              type: 'comparison',
              operator: 'propertyisequalto',
              propertyname: 'value',
              literal: '100',
            },
          },
        ],
      };
      const filteredRules = Utils.getRules(
        featureTypeStyle,
        testFeature,
        0.28 // scale 1:1000.
      );
      expect(filteredRules.map(rule => rule.name)).to.deep.equal([
        'rule-elsefilter',
      ]);
    });
  });
});
