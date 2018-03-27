/* global describe it expect */
import Style from 'ol/style/style';
import OlStyler from '../src/OlStyler';

describe('create ol style object from styledescription', () => {
  const styleDescription = {
    polygon: [
      {
        fill: 'blue',
      },
    ],
    line: [
      {
        stroke: 'red',
      },
    ],
    point: [],
  };
  it('returns object', () => {
    const style = OlStyler(styleDescription);
    expect(style).to.be.an.array;
  });
  it('returns object with polygon style', () => {
    const style = OlStyler(styleDescription, 'Polygon');
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object linestring style', () => {
    const style = OlStyler(styleDescription, 'LineString');
    expect(style['0']).to.be.an.instanceof(Style);
  });
});
