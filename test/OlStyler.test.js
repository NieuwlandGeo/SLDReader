/* global describe it expect before beforeEach */
import { Style, Circle } from 'ol/style';
import OLFormatGeoJSON from 'ol/format/GeoJSON';

import Reader from '../src/Reader';
import OlStyler, { createOlStyleFunction } from '../src/OlStyler';

import { sld } from './data/test.sld';
import { sld11 } from './data/test11.sld';
import { externalGraphicSld } from './data/externalgraphic.sld';
import { dynamicSld } from './data/dynamic.sld';
import { textSymbolizerSld } from './data/textSymbolizer.sld';
import { textSymbolizerDynamicSld } from './data/textSymbolizer-dynamic.sld';
import { textSymbolizerCDataSld } from './data/textSymbolizer-cdata.sld';
import { externalGraphicStrokeSld } from './data/external-graphicstroke.sld';
import { IMAGE_LOADING, IMAGE_LOADED } from '../src/constants';
import {
  clearImageCache,
  clearImageLoadingStateCache,
  getImageLoadingState,
} from '../src/imageCache';

const getMockOLFeature = geometryType => ({
  properties: {},
  geometry: {
    type: geometryType,
  },
});

describe('create ol style object from styledescription', () => {
  const styleDescription = {
    polygon: [
      {
        fill: {
          styling: {
            fill: 'blue',
          },
        },
      },
    ],
    line: [
      {
        stroke: {
          styling: {
            stroke: 'red',
          },
        },
      },
    ],
    point: [],
    text: [],
  };

  it('returns array', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('Polygon'));
    expect(style).to.be.an('array');
  });
  it('returns object with polygon style', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('Polygon'));
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object with polygon fill', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('Polygon'));
    expect(style['0'].getFill().getColor()).to.equal('blue');
  });
  it('returns object linestring style', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('LineString'));
    expect(style['0']).to.be.an.instanceof(Style);
  });
  it('returns object with polygon fill', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('LineString'));
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
            stroke: {},
          },
          opactity: 20,
          size: 10,
          rotation: 0,
        },
      },
    ],
  };
  it('returns array', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('Point'));
    expect(style).to.be.an('array');
  });
  it('returns style', () => {
    const style = OlStyler(styleDescription, getMockOLFeature('Point'));
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
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
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
    expect(featureStyle.getStroke().getWidth()).to.equal(4);
  });
});

describe('Create OL Style function from SLD feature type style 1', () => {
  let sldObject;
  let featureTypeStyle;
  before(() => {
    sldObject = Reader(sld);
    [featureTypeStyle] = sldObject.layers[4].styles[0].featuretypestyles;
  });

  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [0, 0],
    },
  };

  it('Multiple styles with the same shape on one feature', () => {
    const fmtGeoJSON = new OLFormatGeoJSON();
    const olFeature = fmtGeoJSON.readFeature(geojson);

    const styleFunction = createOlStyleFunction(featureTypeStyle);

    const featureStyle = styleFunction(olFeature, null);
    expect(featureStyle).to.be.an('array');
    expect(featureStyle.length).to.be.equal(2);
    expect(() => featureStyle[0].getImage().getRadius())
      .to.not.throw()
      .and.be.equal(7);
    expect(() => featureStyle[1].getImage().getRadius())
      .to.not.throw()
      .and.be.equal(2);
  });
});

describe('SLD with external graphics', () => {
  let featureTypeStyle;
  beforeEach(() => {
    clearImageCache();
    clearImageLoadingStateCache();
    const sldObject = Reader(externalGraphicSld);
    [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
  });

  it('Only requests images for matching rules', () => {
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [175135, 441200],
      },
      properties: {
        type: '2',
      },
    };

    const fmtGeoJSON = new OLFormatGeoJSON();
    const olFeature = fmtGeoJSON.readFeature(geojson);

    const styleFunction = createOlStyleFunction(featureTypeStyle);

    const featureStyle = styleFunction(olFeature, null)[0];

    // Requesting feature style for a feature with type 2 should only update the loading state for the corresponding image.
    expect(
      getImageLoadingState(
        featureTypeStyle.rules[1].pointsymbolizer.graphic.externalgraphic
          .onlineresource
      )
    ).to.equal(IMAGE_LOADING);

    // But other symbolizers should be left alone.
    expect(
      getImageLoadingState(
        featureTypeStyle.rules[0].pointsymbolizer.graphic.externalgraphic
          .onlineresource
      )
    ).to.be.undefined;
    expect(
      getImageLoadingState(
        featureTypeStyle.rules[2].pointsymbolizer.graphic.externalgraphic
          .onlineresource
      )
    ).to.be.undefined;
    expect(
      getImageLoadingState(
        featureTypeStyle.rules[3].pointsymbolizer.graphic.externalgraphic
          .onlineresource
      )
    ).to.be.undefined;

    // The feature style should be a loading indicator (simple circle style), since the image hasn't loaded yet.
    expect(featureStyle.getImage() instanceof Circle).to.be.true;
  });

  it('Calls imageLoadedCallback when image finishes loading', done => {
    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [175135, 441200],
      },
      properties: {
        type: '2',
      },
    };

    const fmtGeoJSON = new OLFormatGeoJSON();
    const olFeature = fmtGeoJSON.readFeature(geojson);

    const styleFunction = createOlStyleFunction(featureTypeStyle, {
      imageLoadedCallback: () => {
        // When this function is called, the loading state should be either loaded or error.
        const symbolizer = featureTypeStyle.rules[1].pointsymbolizer;
        const imageUrl = symbolizer.graphic.externalgraphic.onlineresource;
        expect(getImageLoadingState(imageUrl)).to.equal(IMAGE_LOADED);
        done();
      },
    });

    // Just call the style function to trigger image load.
    styleFunction(olFeature, null);
  });
});

describe('SLD with stacked line symbolizer', () => {
  let featureTypeStyle;
  beforeEach(() => {
    clearImageCache();
    clearImageLoadingStateCache();
    const sldObject = Reader(externalGraphicStrokeSld);
    [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
  });

  it('Updates graphicstroke symbolizer when stacked on top of a simple symbolizer', () => {
    expect(featureTypeStyle).to.be.ok;

    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [123456, 456789],
          [234567, 567890],
        ],
      },
      properties: {},
    };

    const fmtGeoJSON = new OLFormatGeoJSON();
    const olFeature = fmtGeoJSON.readFeature(geojson);
    const styleFunction = createOlStyleFunction(featureTypeStyle);

    // Calling the style function when using a style with external graphic stroke should update loading state
    // for the graphicstroke sub-symbolizer in the second LineSymbolizer inside the rule.
    styleFunction(olFeature, null)[0];
    const graphicStrokeSymbolizer =
      featureTypeStyle.rules[0].linesymbolizer[1].stroke.graphicstroke;
    // Symbolizer should have IMAGE_LOADING metadata flag set.
    expect(
      getImageLoadingState(
        graphicStrokeSymbolizer.graphic.externalgraphic.onlineresource
      )
    ).to.equal(IMAGE_LOADING);
    // Symbolizer should have invalidated metadata flag set.
    expect(graphicStrokeSymbolizer.__invalidated).to.be.true;
  });
});

describe('Dynamic style properties', () => {
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [175135, 441200],
    },
    properties: {
      size: 100,
      angle: 42,
      title: 'This is a test',
    },
  };

  let pointFeature;
  let featureTypeStyle;
  let styleFunction;
  before(() => {
    const fmtGeoJSON = new OLFormatGeoJSON();
    pointFeature = fmtGeoJSON.readFeature(geojson);
    const sldObject = Reader(dynamicSld);
    [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
    styleFunction = createOlStyleFunction(featureTypeStyle);
  });

  it('Reads size from feature', () => {
    const style = styleFunction(pointFeature)[0];
    expect(style.getImage().getRadius()).to.equal(50); // Radius should equal half SLD size.
  });

  it('Reads rotation from feature', () => {
    const style = styleFunction(pointFeature)[0];
    // OL rotation is in radians.
    expect(style.getImage().getRotation()).to.equal((Math.PI * 42.0) / 180.0);
  });

  it('Reads text for label from feature', () => {
    const textStyle = styleFunction(pointFeature)[1];
    expect(textStyle.getText().getText()).to.equal('This is a test');
  });

  it('Reads label rotation from feature', () => {
    const textStyle = styleFunction(pointFeature)[1];
    // OL rotation is in radians.
    expect(textStyle.getText().getRotation()).to.equal(
      (Math.PI * 42.0) / 180.0
    );
  });

  it('Sets label placement according to feature geometry type', () => {
    const textStyle = styleFunction(pointFeature)[1];
    expect(textStyle.getText().getPlacement()).to.equal('point');
  });
});

describe('Text symbolizer', () => {
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [175135, 441200],
    },
    properties: {
      size: 100,
      angle: 42,
      title: 'This is a test',
    },
  };

  let pointFeature;
  before(() => {
    const fmtGeoJSON = new OLFormatGeoJSON();
    pointFeature = fmtGeoJSON.readFeature(geojson);
  });

  it('Handles TextSymbolizer with only a Label', () => {
    const sldObject = Reader(textSymbolizerSld);
    const [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
    const styleFunction = createOlStyleFunction(featureTypeStyle);
    const textStyle = styleFunction(pointFeature)[0];
    expect(textStyle.getText().getText()).to.equal('TEST');
  });

  it('Text symbolizer with dynamic label containing a number', () => {
    const sldObject = Reader(textSymbolizerDynamicSld);
    const [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
    const styleFunction = createOlStyleFunction(featureTypeStyle);
    const textStyle = styleFunction(pointFeature)[0];
    // Important: for formatting longer text, OL expects that the text property is always a string.
    expect(textStyle.getText().getText()).to.equal('100');
  });

  it('Text symbolizer with CDATA sections', () => {
    const sldObject = Reader(textSymbolizerCDataSld);
    const [featureTypeStyle] = sldObject.layers[0].styles[0].featuretypestyles;
    const styleFunction = createOlStyleFunction(featureTypeStyle);
    const textStyle = styleFunction(pointFeature)[0];
    // CDATA whitespace should be kept intact.
    expect(textStyle.getText().getText()).to.equal('Size: 100\nAngle: 42');
  });
});
