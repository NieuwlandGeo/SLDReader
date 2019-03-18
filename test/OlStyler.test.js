/* global describe it expect before */
import Style from 'ol/style/style';
import OLFormatGeoJSON from 'ol/format/geojson';

import Reader from '../src/Reader';
import OlStyler, { createOlStyleFunction } from '../src/OlStyler';

import { sld11 } from './data/test11.sld';

const getFeature = type => ({
  properties: {},
  geometry: {
    type,
  },
});

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
    text: [],
  };

  it('returns array', () => {
    const style = OlStyler(styleDescription, getFeature('Polygon'));
    expect(style).to.be.an.array;
  });
  it('returns object with polygon style', () => {
    const style = OlStyler(styleDescription, getFeature('Polygon'));
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object with polygon fill', () => {
    const style = OlStyler(styleDescription, getFeature('Polygon'));
    expect(style['0'].getFill().getColor()).to.equal('blue');
  });
  it('returns object linestring style', () => {
    const style = OlStyler(styleDescription, getFeature('LineString'));
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object with polygon fill', () => {
    const style = OlStyler(styleDescription, getFeature('LineString'));
    expect(style['0'].getStroke().getColor()).to.equal('red');
  });
});

describe('creates point style', () => {
  const styleDescription = {
    polygon: [],
    line: [],
    text: [],
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
    const style = OlStyler(styleDescription, getFeature('Point'));
    expect(style).to.be.an.array;
  });
  it('returns style', () => {
    const style = OlStyler(styleDescription, getFeature('Point'));
    expect(style['0']).to.be.an.instanceOf(Style);
  });
});

describe('Create OL Style function from SLD feature type style', () => {
  let sldObject;
  let featureTypeStyle;
  before(() => {
    sldObject = Reader(sld11);
    [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
  });

  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
    },
    properties: {
      provincienaam: 'Gelderland',
    },
  };

  it('Style function applied to OpenLayers feature', () => {
    const fmtGeoJSON = new OLFormatGeoJSON();
    const olFeature = fmtGeoJSON.readFeature(geojson);

    const styleFunction = createOlStyleFunction(featureTypeStyle);

    const featureStyle = styleFunction(olFeature, null)[0];

    expect(featureStyle.getStroke().getColor()).to.equal('#000000');
    expect(featureStyle.getStroke().getWidth()).to.equal('4');
  });
});
