/* global describe  it expect */
import categorizeSymbolizers from '../src/categorizeSymbolizers';

describe('create geometrystyles from rules array', () => {
  const rules = [
    {
      polygonsymbolizer: {
        fill: {
          styling: {
            fill: 'blue',
            fillOpacity: '1.0',
          },
        },
        stroke: {
          styling: {
            stroke: '#C0C0C0',
            strokeLinecap: 'butt',
            strokeLinejoin: 'miter',
            strokeOpacity: '1',
            strokeWidth: '1',
            strokeDashoffset: '0',
          },
        },
      },
      pointsymbolizer: {
        graphic: {
          externalgraphic: {
            onlineresource: 'img.png',
          },
        },
      },
    },
  ];

  it('creates props for symbolizers', () => {
    const symbolizers = categorizeSymbolizers(rules);
    expect(symbolizers).to.have.property('polygonSymbolizers');
    expect(symbolizers).to.have.property('lineSymbolizers');
    expect(symbolizers).to.have.property('pointSymbolizers');
    expect(symbolizers).to.have.property('textSymbolizers');
  });

  it('polygon prop has css params', () => {
    const symbolizers = categorizeSymbolizers(rules);
    const polygon = symbolizers.polygonSymbolizers[0];
    expect(polygon).to.have.property('fill');
    expect(polygon).to.have.property('stroke');
    expect(polygon.fill.styling).to.have.property('fill');
    expect(polygon.fill.styling).to.have.property('fillOpacity');
    expect(polygon.stroke.styling).to.have.property('stroke');
    expect(polygon.stroke.styling).to.have.property('strokeLinecap');
    expect(polygon.stroke.styling).to.have.property('strokeLinejoin');
    expect(polygon.stroke.styling).to.have.property('strokeOpacity');
    expect(polygon.stroke.styling).to.have.property('strokeWidth');
    expect(polygon.stroke.styling).to.have.property('strokeDashoffset');
  });

  it('point prop receives graphic ', () => {
    const symbolizers = categorizeSymbolizers(rules);
    const point = symbolizers.pointSymbolizers[0];
    expect(point).to.have.property('graphic');
    expect(point.graphic).to.have.property('externalgraphic');
    expect(point.graphic.externalgraphic).to.have.property('onlineresource');
    expect(point.graphic.externalgraphic.onlineresource).to.equal('img.png');
  });
});
