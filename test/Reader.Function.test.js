/* global it describe expect */
import { dynamicSld } from './data/dynamic.sld';

import Reader from '../src/Reader';

describe('Function parsing', () => {
  it('Parse function inside filter expression', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <Function name="strSubstringStart" fallbackValue="1900">
          <PropertyName>timestamp</PropertyName>
          <Literal>-4</Literal>
        </Function>
        <Literal>2023</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);
    expect(filter.expression1).to.deep.equal({
      type: 'function',
      name: 'strSubstringStart',
      fallbackValue: '1900',
      params: [
        {
          type: 'propertyname',
          value: 'timestamp',
          typeHint: 'string',
        },
        '-4',
      ],
    });
  });

  it('Functions without fallback value get null as fallback value', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <Function name="strSubstringStart">
          <PropertyName>timestamp</PropertyName>
          <Literal>-4</Literal>
        </Function>
        <Literal>2023</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);
    expect(filter.expression1.fallbackValue).to.be.null;
  });

  it('Function with 1 parameter', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <Function name="dimension" fallbackValue="0">
          <PropertyName>the_geom</PropertyName>
        </Function>
        <Literal>2</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);
    expect(filter.expression1).to.deep.equal({
      type: 'function',
      name: 'dimension',
      fallbackValue: '0',
      params: [
        {
          type: 'propertyname',
          value: 'the_geom',
          typeHint: 'string',
        },
      ],
    });
  });

  it('Function with 0 parameters', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <Function name="random_number" fallbackValue="4">
        </Function>
        <Literal>4</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;
    const { filter } = Reader(filterXml);
    expect(filter.expression1).to.deep.equal({
      type: 'function',
      name: 'random_number',
      fallbackValue: '4',
      params: [],
    });
  });

  it('Function as svg style parameter', () => {
    const result = Reader(dynamicSld);
    const [featureTypeStyle] = result.layers[0].styles[0].featuretypestyles;
    const rule = featureTypeStyle.rules[1];
    expect(
      rule.pointsymbolizer[0].graphic.mark.fill.styling.fill
    ).to.deep.equal({
      type: 'function',
      name: 'random_color',
      fallbackValue: null,
      params: [],
    });
  });
});
