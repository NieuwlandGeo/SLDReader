/* global describe  it expect */
import GeometryStyles from '../src/GeometryStyles';

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
    const description = GeometryStyles(rules);
    expect(description).to.have.property('polygon');
    expect(description).to.have.property('line');
    expect(description).to.have.property('point');
  });

  it('polygon prop has css params', () => {
    const description = GeometryStyles(rules);
    const polygon = description.polygon['0'];
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
    const description = GeometryStyles(rules);
    const point = description.point['0'];
    expect(point).to.have.property('graphic');
    expect(point.graphic).to.have.property('externalgraphic');
    expect(point.graphic.externalgraphic).to.have.property('onlineresource');
    expect(point.graphic.externalgraphic.onlineresource).to.equal('img.png');
  });
});
