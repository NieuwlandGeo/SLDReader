/* global describe it expect */
import Style from 'ol/style/style';
import OlStyler from '../src/OlStyler';

describe('create ol style object from styledescription', () => {
  const styleDescription = {
    polygon: [
      {
        fill: {
          css: {
            fill: 'blue',
          },
        },
      },
    ],
    line: [
      {
        stroke: {
          css: {
            stroke: 'red',
          },
        },
      },
    ],
    point: [],
  };
  it('returns array', () => {
    const style = OlStyler(styleDescription);
    expect(style).to.be.an.array;
  });
  it('returns object with polygon style', () => {
    const style = OlStyler(styleDescription, 'Polygon');
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object with polygon fill', () => {
    const style = OlStyler(styleDescription, 'Polygon');
    expect(style['0'].getFill().getColor()).to.equal('blue');
  });
  it('returns object linestring style', () => {
    const style = OlStyler(styleDescription, 'LineString');
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object with polygon fill', () => {
    const style = OlStyler(styleDescription, 'LineString');
    expect(style['0'].getStroke().getColor()).to.equal('red');
  });
});

describe('creates point style', () => {
  const styleDescription = {
    polygon: [],
    line: [],
    point: [
      {
        graphic: {
          mark: {
            wellknownname: 'circle',
            fill: {},
            strok: {},
          },
          opactity: 20,
          size: 10,
          rotation: 0,
        },
      },
    ],
  };
  it('returns array', () => {
    const style = OlStyler(styleDescription);
    expect(style).to.be.an.array;
  });
  it('returns style', () => {
    const style = OlStyler(styleDescription, 'Point');
    expect(style['0']).to.be.an.instanceOf(Style);
  });
});
