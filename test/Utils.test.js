/* global describe it expect */
import { createOlStyleFunction } from '../src/OlStyler';
import { getLayer, getLayerNames, getStyle, getStyleNames } from '../src/Utils';

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
    const layernames = getLayerNames(sld);
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
    const layer = getLayer(sld, 'WaterBodies');
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
    const stylenames = getStyleNames(layer, 'WaterBodies');
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
    const style = getStyle(layer, 'Hover Styler');
    expect(style.name).to.equal('Hover Styler');
  });

  it('get default style in layer when name is not given', () => {
    const layer = {
      styles: [
        {
          name: 'Default Styler',
        },
        {
          name: 'Hover Styler',
          default: true,
        },
      ],
    };
    const style = getStyle(layer);
    expect(style.name).to.equal('Hover Styler');
  });

  it('get first style in layer when name is not given and there is no default style', () => {
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
    const style = getStyle(layer);
    expect(style.name).to.equal('Default Styler');
  });

  describe('Evaluating rule filters: ElseFilters and ScaleDenominators', () => {
    const testFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [12.34, 45.68],
      },
      properties: {
        value: 42,
      },
    };

    const createPointSymbolizer = fillColor => ({
      type: 'pointsymbolizer',
      uom: 'pixel',
      graphic: {
        mark: {
          wellknownname: 'circle',
          fill: {
            styling: {
              fill: fillColor,
            },
          },
        },
        size: 10,
      },
    });

    it('Skip rules outside min/max scale denominator', () => {
      // Use colors to check which rules have been hit.
      const featureTypeStyle = {
        rules: [
          {
            name: 'rule1',
            maxscaledenominator: 500,
            symbolizers: [createPointSymbolizer('#FF0000')],
          },
          {
            name: 'rule2',
            minscaledenominator: 500,
            maxscaledenominator: 5000,
            symbolizers: [createPointSymbolizer('#00FF00')],
          },
          {
            name: 'rule3',
            minscaledenominator: 5000,
            symbolizers: [createPointSymbolizer('#0000FF')],
          },
        ],
      };
      const styleFn = createOlStyleFunction(featureTypeStyle);
      const olStyles = styleFn(testFeature, 0.28); // resolution 0.28 = scale 1:1000
      expect(
        olStyles.map(style => style.getImage().getFill().getColor())
      ).to.deep.equal(['#00FF00']); // only rule 2 matches scale 1:1000
    });

    it('Skip ElseFilter when any other rule matches', () => {
      const featureTypeStyle = {
        rules: [
          {
            name: 'always-passes',
            symbolizers: [createPointSymbolizer('#FF0000')],
          },
          {
            name: 'always-passes-too',
            symbolizers: [createPointSymbolizer('#00FF00')],
          },
        ],
        elseFilterRules: [
          {
            name: 'rule-elsefilter',
            elsefilter: true,
            symbolizers: [createPointSymbolizer('#0000FF')],
          },
        ],
      };
      const styleFn = createOlStyleFunction(featureTypeStyle);
      const olStyles = styleFn(testFeature, 0.28); // resolution 0.28 = scale 1:1000
      expect(
        olStyles.map(style => style.getImage().getFill().getColor())
      ).to.deep.equal(['#FF0000', '#00FF00']); // elsefilter rule is skipped because at least one other rule matches
    });

    it('Keep ElseFilter rule if all other eligible rules are outside scale range', () => {
      const featureTypeStyle = {
        rules: [
          {
            name: 'only-above-scale-5000',
            minscaledenominator: 5000,
            symbolizers: [createPointSymbolizer('#FF0000')],
          },
          {
            name: 'value-equals-100',
            filter: {
              type: 'comparison',
              operator: 'propertyisequalto',
              propertyname: 'value',
              literal: '100',
            },
            symbolizers: [createPointSymbolizer('#00FF00')],
          },
        ],
        elseFilterRules: [
          {
            name: 'rule-elsefilter',
            elsefilter: true,
            symbolizers: [createPointSymbolizer('#0000FF')],
          },
        ],
      };
      const styleFn = createOlStyleFunction(featureTypeStyle);
      const olStyles = styleFn(testFeature, 0.28); // resolution 0.28 = scale 1:1000
      expect(
        olStyles.map(style => style.getImage().getFill().getColor())
      ).to.deep.equal(['#0000FF']); // ElseFilter rule is selected because both other rules are filtered out.
    });

    it('Discard ElseFilter rule if at least one other eligible rule is within scale range', () => {
      const featureTypeStyle = {
        rules: [
          {
            name: 'only-above-scale-5000',
            minscaledenominator: 5000,
            symbolizers: [createPointSymbolizer('#FF0000')],
          },
          {
            name: 'value-equals-100',
            filter: {
              type: 'comparison',
              operator: 'propertyisequalto',
              propertyname: 'value',
              literal: '100',
            },
            symbolizers: [createPointSymbolizer('#00FF00')],
          },
        ],
        elseFilterRules: [
          {
            name: 'rule-elsefilter',
            elsefilter: true,
            symbolizers: [createPointSymbolizer('#0000FF')],
          },
        ],
      };
      const styleFn = createOlStyleFunction(featureTypeStyle);
      const olStyles = styleFn(testFeature, 2.8); // resolution 2.8 = scale 1:10000
      expect(
        olStyles.map(style => style.getImage().getFill().getColor())
      ).to.deep.equal(['#FF0000']); // Only rule 1 matches, so no else filter rules.
    });
  });
});
