/* global describe  it expect */
import StyleDescription from '../src/StyleDescription';

describe('create styledescription from rules array', () => {
  const rules = [
    {
      polygonsymbolizer: {
        fill: {
          css: [
            {
              name: 'fill',
              value: 'blue',
            },
            {
              name: 'fill-opacity',
              value: '1.0',
            },
          ],
        },
        stroke: {
          css: [
            {
              name: 'stroke',
              value: '#C0C0C0',
            },
            {
              name: 'stroke-linecap',
              value: 'butt',
            },
            {
              name: 'stroke-linejoin',
              value: 'miter',
            },
            {
              name: 'stroke-opacity',
              value: '1',
            },
            {
              name: 'stroke-width',
              value: '1',
            },
            {
              name: 'stroke-dashoffset',
              value: '0',
            },
          ],
        },
      },
    },
  ];

  it('creates props for symbolizers', () => {
    const description = StyleDescription(rules);
    expect(description).to.have.property('polygon');
    expect(description).to.have.property('line');
    expect(description).to.have.property('point');
  });

  it('polygon symbolizer has css params', () => {
    const description = StyleDescription(rules);
    expect(description.polygon).to.have.property('fill');
    expect(description.polygon).to.have.property('fillOpacity');
    expect(description.polygon).to.have.property('stroke');
    expect(description.polygon).to.have.property('strokeLinecap');
    expect(description.polygon).to.have.property('strokeLinejoin');
    expect(description.polygon).to.have.property('strokeOpacity');
    expect(description.polygon).to.have.property('strokeWidth');
    expect(description.polygon).to.have.property('strokeDashoffset');
  });
});
