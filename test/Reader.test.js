/* global describe it expect before beforeEach */
import { sld } from './data/test.sld';
import { sld11 } from './data/test11.sld';
import { dynamicSld } from './data/dynamic.sld';
import { externalGraphicInlineContentSld } from './data/externalgraphic-inlinecontent.sld';
import { graphicstrokeSymbolizerSld } from './data/graphicstrokeSymbolizer.sld';
import { graphicStrokeWithGap } from './data/graphicstroke-with-gap.sld';
import { graphicStrokeWithComments } from './data/graphicstroke-with-comments.sld';
import { multipleSymbolizersSld } from './data/multiple-symbolizers.sld';
import { staticPolygonSymbolizerSld } from './data/static-polygon-symbolizer.sld';
import { dynamicPolygonSymbolizerSld } from './data/dynamic-polygon-symbolizer.sld';
import { graphicStrokeVendorOption } from './data/graphicstroke-vendoroption.sld';
import { qgisParametricSvg } from './data/qgis-parametric-svg.sld';
import { sldWithUom } from './data/sld-with-uom';

import { UOM_METRE } from '../src/constants';

import Reader from '../src/Reader';
import { validateObjectProperties } from './test-helpers';

let result;

describe('Reads xml', () => {
  before(() => {
    result = Reader(sld);
  });
  it('returns object', () => {
    expect(result).to.be.an.instanceof(Object);
    expect(result.version).to.equal('1.0.0');
    expect(result.layers).to.be.an.instanceof(Array);
  });
  it('returns object for the layers', () => {
    const layernames = ['WaterBodies', 'Roads', 'Cities', 'Land', 'Hexagons'];
    expect(result.layers).to.have.length(5);
    for (let i = 0; i < result.layers.length; i += 1) {
      expect(result.layers[i].name).to.equal(layernames[i]);
    }
  });
  it('has style for waterbodies', () => {
    const wbstyles = result.layers['0'].styles;
    expect(wbstyles).to.be.an.instanceof(Array);
    expect(wbstyles).to.have.length(12);
  });
  it('style has props', () => {
    const style = result.layers['0'].styles['0'];
    expect(style.featuretypestyles).to.be.an.instanceof(Array);
    expect(style.default).to.be.true;
  });
  it('featuretypestyles has rules', () => {
    const featuretypestyle =
      result.layers['0'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
  });
  it('rules have props', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    const [symbolizer] = rule.polygonsymbolizer;
    expect(symbolizer).to.be.an.instanceof(Object);
    expect(symbolizer.fill).to.be.an.instanceof(Object);
    expect(symbolizer.fill.styling).to.be.an.instanceof(Object);
    expect(symbolizer.fill.styling.fill).to.equal('blue');
    expect(symbolizer.fill.styling.fillOpacity).to.equal(1.0);
    expect(symbolizer.stroke.styling.stroke).to.equal('#C0C0C0');
  });
  it('Scale denominators are numeric', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule.maxscaledenominator).to.equal(3000000);
    expect(rule.minscaledenominator).to.equal(1000);
  });
  it('cities layer has PointSymbolizer with external graphic', () => {
    const rule =
      result.layers['2'].styles['0'].featuretypestyles['0'].rules['0'];
    const [symbolizer] = rule.pointsymbolizer;
    expect(rule).to.have.property('pointsymbolizer');
    expect(symbolizer).to.have.property('graphic');
    expect(symbolizer.graphic).to.have.property('externalgraphic');
    expect(symbolizer.graphic.externalgraphic).to.have.property(
      'onlineresource'
    );
    expect(symbolizer.graphic.externalgraphic.onlineresource).to.equal(
      '../img/marker.png'
    );
  });
  it('cities layer has pointsymbolizer with graphic mark', () => {
    const rule =
      result.layers['2'].styles['0'].featuretypestyles['0'].rules['1'];
    expect(rule).to.have.property('pointsymbolizer');
    const [symbolizer] = rule.pointsymbolizer;
    expect(symbolizer).to.have.property('graphic');
    expect(symbolizer.graphic).to.have.property('mark');
    expect(symbolizer.graphic).to.have.property('size');
    expect(symbolizer.graphic.mark).to.have.property('wellknownname');
    expect(symbolizer.graphic.mark.wellknownname).to.equal('cross');
  });
  it('reads multiple pointsymbolizers', () => {
    const rule =
      result.layers['4'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule).to.have.property('pointsymbolizer');
    const pointSymbolizers = rule.pointsymbolizer;
    expect(pointSymbolizers).to.be.an('array');
    expect(pointSymbolizers.length).to.equal(2);
    expect(pointSymbolizers[0]).to.have.property('graphic');
    expect(pointSymbolizers[0].graphic).to.have.property('mark');
    expect(pointSymbolizers[0].graphic).to.have.property('size');
    expect(pointSymbolizers[0].graphic.mark).to.have.property('wellknownname');
    expect(pointSymbolizers[0].graphic.mark.wellknownname).to.equal('hexagon');
  });

  it('Parses Title elements', () => {
    const layer = result.layers[0];
    expect(layer.title).to.be.undefined;

    const userStyle = layer.styles[0];
    expect(userStyle.title).to.equal(
      'Default Styler (zoom in to see more objects)'
    );

    const featureTypeStyle = userStyle.featuretypestyles[0];
    expect(featureTypeStyle.title).to.equal('Test style');

    const rule = featureTypeStyle.rules[0];
    expect(rule.title).to.equal('title');
  });

  it('Parses Abstract elements', () => {
    const layer = result.layers[0];
    expect(layer.abstract).to.be.undefined;

    const userStyle = layer.styles[0];
    expect(userStyle.abstract).to.equal('');

    const featureTypeStyle = userStyle.featuretypestyles[0];
    expect(featureTypeStyle.abstract).to.equal('abstract');

    const rule = featureTypeStyle.rules[0];
    expect(rule.abstract).to.equal('Abstract');
  });
});

describe('Reads xml sld 11', () => {
  before(() => {
    result = Reader(sld11);
  });
  it('returns object', () => {
    expect(result).to.be.an.instanceof(Object);
    expect(result.version).to.equal('1.1.0');
    expect(result.layers).to.be.an.instanceof(Array);
  });
  it('returns object for the layers', () => {
    expect(result.layers).to.have.length(1);
    expect(result.layers['0'].name).to.equal('bestuurlijkegrenzen:provincies');
  });
  it('has styles', () => {
    const { styles } = result.layers['0'];
    expect(styles).to.be.an.instanceof(Array);
    expect(styles).to.have.length(1);
  });
  it('style has props', () => {
    const style = result.layers['0'].styles['0'];
    expect(style.featuretypestyles).to.be.an.instanceof(Array);
  });
  it('featuretypestyles has rules', () => {
    const featuretypestyle =
      result.layers['0'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
    expect(featuretypestyle.rules).to.have.length(4);
  });
  it('rule polygonsymbolizer has props from svg', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    const [symbolizer] = rule.polygonsymbolizer;
    expect(symbolizer).to.be.an.instanceof(Object);
    expect(symbolizer.fill).to.be.an.instanceof(Object);
    expect(symbolizer.fill.styling).to.be.an.instanceof(Object);
    expect(symbolizer.fill.styling.fill).to.equal('#CCCCCC');
  });
  it('rule textsymbolizer label', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['3'];
    const [symbolizer] = rule.textsymbolizer;
    expect(symbolizer).to.be.an.instanceof(Object);
    expect(symbolizer.label).to.deep.equal({
      type: 'propertyname',
      typeHint: 'string',
      value: 'provincienaam',
    });
  });
  it('rule textsymbolizer has font', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['3'];
    const [symbolizer] = rule.textsymbolizer;
    expect(symbolizer).to.be.an.instanceof(Object);
    expect(symbolizer.font).to.be.an.instanceof(Object);
    expect(symbolizer.font.styling).to.be.an.instanceof(Object);
    expect(symbolizer.font.styling.fontFamily).to.equal('Noto Sans');
  });
  it('rule textsymbolizer has fill', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['3'];
    const [symbolizer] = rule.textsymbolizer;
    expect(symbolizer).to.be.an.instanceof(Object);
    expect(symbolizer.fill).to.be.an.instanceof(Object);
  });
  describe('Metadata', () => {
    let rule;
    beforeEach(() => {
      rule = result.layers[0].styles[0].featuretypestyles[0].rules[0];
    });

    it('Rule name', () => {
      expect(rule.name).to.equal('Other');
    });

    it('Takes Rule title from description', () => {
      expect(rule.title).to.equal('Other provinces');
    });

    it('Takes Rule abstract from description', () => {
      expect(rule.abstract).to.equal('This rule matches all other provinces');
    });
  });
});

describe('Other reader tests', () => {
  it('Reader ignores comments', () => {
    const resultWithComments = Reader(graphicStrokeWithComments);
    expect(resultWithComments).to.be.ok;
  });
});

describe('Dynamic filter expressions', () => {
  let featureTypeStyle;
  before(() => {
    result = Reader(dynamicSld);
    [featureTypeStyle] = result.layers[0].styles[0].featuretypestyles;
  });

  it('Has propertyname expression for size', () => {
    const rule = featureTypeStyle.rules[0];
    expect(rule.pointsymbolizer[0].graphic.size).to.deep.equal({
      type: 'propertyname',
      typeHint: 'number',
      value: 'size',
    });
  });
});

describe('Graphicstroke symbolizer', () => {
  before(() => {
    result = Reader(graphicstrokeSymbolizerSld);
  });
  it('returns object', () => {
    expect(result).to.be.an.instanceof(Object);
    expect(result.layers).to.be.an.instanceof(Array);
  });
  it('returns object for the layers', () => {
    expect(result.layers).to.have.length(1);
    expect(result.layers['0'].name).to.equal('spoorwegen-trace');
  });
  it('has styles', () => {
    const { styles } = result.layers['0'];
    expect(styles).to.be.an.instanceof(Array);
    expect(styles).to.have.length(1);
  });
  it('style has props', () => {
    const style = result.layers['0'].styles['0'];
    expect(style.featuretypestyles).to.be.an.instanceof(Array);
  });
  it('featuretypestyles has rules', () => {
    const featuretypestyle =
      result.layers['0'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
    expect(featuretypestyle.rules).to.have.length(1);
  });
  it('rules has linesymbolizers', () => {
    const rule =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule.linesymbolizer).to.be.an.instanceof(Array);
    expect(rule.linesymbolizer).to.have.length(2);
  });
  it('rule linesymbolizer has props from svg 1', () => {
    const linesymbolizer1 =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0']
        .linesymbolizer['0'];
    expect(linesymbolizer1.stroke).to.be.an.instanceof(Object);
    expect(linesymbolizer1.stroke.styling).to.be.an.instanceof(Object);
    expect(linesymbolizer1.stroke.styling.stroke).to.equal('#FF0000');
    expect(linesymbolizer1.stroke.styling.strokeWidth).to.equal(1);
  });
  it('rule linesymbolizer has props from svg 2', () => {
    const linesymbolizer2 =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0']
        .linesymbolizer['1'];
    expect(linesymbolizer2.stroke).to.be.an.instanceof(Object);
    expect(linesymbolizer2.stroke.styling).to.be.an.instanceof(Object);
    expect(linesymbolizer2.stroke.styling.strokeDasharray).to.equal('2 6');
  });
  it('rule linesymbolizer has graphicstroke', () => {
    const { stroke } =
      result.layers['0'].styles['0'].featuretypestyles['0'].rules['0']
        .linesymbolizer['1'];
    expect(stroke.graphicstroke).to.be.an.instanceof(Object);
    expect(stroke.graphicstroke.graphic).to.be.an.instanceof(Object);
    expect(stroke.graphicstroke.graphic).to.have.property('mark');
    expect(stroke.graphicstroke.graphic).to.have.property('size');
    expect(stroke.graphicstroke.graphic.size).to.equal(4);
    expect(stroke.graphicstroke.graphic).to.have.property('rotation');
    expect(stroke.graphicstroke.graphic.rotation).to.equal(45);
    expect(stroke.graphicstroke.graphic.mark).to.have.property('wellknownname');
    expect(stroke.graphicstroke.graphic.mark.wellknownname).to.equal('square');
    expect(stroke.graphicstroke.graphic.mark).to.have.property('fill');
    expect(stroke.graphicstroke.graphic.mark.fill).to.have.property('styling');
    expect(stroke.graphicstroke.graphic.mark.fill.styling).to.have.property(
      'fill'
    );
    expect(stroke.graphicstroke.graphic.mark.fill.styling.fill).to.equal(
      '#FF0000'
    );
    expect(stroke.graphicstroke.graphic.mark.fill.styling).to.have.property(
      'fillOpacity'
    );
    expect(stroke.graphicstroke.graphic.mark.fill.styling.fillOpacity).to.equal(
      1.0
    );
    expect(stroke.graphicstroke.graphic.mark).to.have.property('stroke');
    expect(stroke.graphicstroke.graphic.mark.stroke).to.have.property(
      'styling'
    );
    expect(stroke.graphicstroke.graphic.mark.stroke.styling).to.have.property(
      'stroke'
    );
    expect(stroke.graphicstroke.graphic.mark.stroke.styling.stroke).to.equal(
      '#000000'
    );
    expect(stroke.graphicstroke.graphic.mark.stroke.styling).to.have.property(
      'strokeWidth'
    );
    expect(
      stroke.graphicstroke.graphic.mark.stroke.styling.strokeWidth
    ).to.equal(1);
    expect(stroke.graphicstroke.graphic.mark.stroke.styling).to.have.property(
      'strokeOpacity'
    );
    expect(
      stroke.graphicstroke.graphic.mark.stroke.styling.strokeOpacity
    ).to.equal(1.0);
  });
});

describe('SLD v1.1.0 GraphicStroke properties', () => {
  let parsedSld;
  let graphicStroke;
  before(() => {
    parsedSld = Reader(graphicStrokeWithGap);
    graphicStroke = getGraphicStroke(parsedSld);
  });

  function getGraphicStroke(sldObject) {
    const rule = sldObject.layers[0].styles[0].featuretypestyles[0].rules[0];
    const { graphicstroke } = rule.linesymbolizer[0].stroke;
    return graphicstroke;
  }

  it('Has graphicStroke symbolizer', () => {
    expect(graphicStroke).to.be.ok;
  });

  it('Has mark', () => {
    const { mark } = graphicStroke.graphic;
    expect(mark).to.be.ok;
  });

  it('Mark stroke style', () => {
    const { stroke } = graphicStroke.graphic.mark;
    expect(stroke.styling).to.deep.equal({
      stroke: '#232323',
      strokeWidth: 0.5,
    });
  });

  it('Mark fill style', () => {
    const { fill } = graphicStroke.graphic.mark;
    expect(fill.styling).to.deep.equal({ fill: '#ff8000' });
  });

  it('Has gap', () => {
    expect(graphicStroke.gap).to.equal(14);
  });

  it('Has intialgap', () => {
    expect(graphicStroke.initialgap).to.equal(6);
  });
});

describe('Parse vendor options', () => {
  let style;
  beforeEach(() => {
    const parsedSld = Reader(graphicStrokeVendorOption);
    [style] = parsedSld.layers[0].styles[0].featuretypestyles;
  });

  it('Sections without vendor options have no .vendoroptions prop', () => {
    const symbolizer = style.rules[0].linesymbolizer[0];
    expect(symbolizer.vendoroptions).to.be.undefined;
  });

  it('Parse vendor options into a .vendoroptions prop', () => {
    const symbolizer = style.rules[0].linesymbolizer[1];
    expect(symbolizer.vendoroptions).to.deep.equal({
      placement: 'lastPoint',
    });
  });
});

describe('Symbolizers are always an array', () => {
  let style = null;
  beforeEach(() => {
    const parsedSld = Reader(multipleSymbolizersSld);
    [style] = parsedSld.layers[0].styles[0].featuretypestyles;
  });

  it('Single Point symbolizer --> array', () => {
    expect(Array.isArray(style.rules[0].pointsymbolizer)).to.be.true;
  });

  it('Multiple Point symbolizers --> array', () => {
    expect(Array.isArray(style.rules[1].pointsymbolizer)).to.be.true;
  });

  it('Single Text symbolizer --> array', () => {
    expect(Array.isArray(style.rules[2].textsymbolizer)).to.be.true;
  });

  it('Multiple Text symbolizers --> array', () => {
    expect(Array.isArray(style.rules[3].textsymbolizer)).to.be.true;
  });

  it('Single Line symbolizer --> array', () => {
    expect(Array.isArray(style.rules[4].linesymbolizer)).to.be.true;
  });

  it('Multiple Line symbolizers --> array', () => {
    expect(Array.isArray(style.rules[5].linesymbolizer)).to.be.true;
  });

  it('Single Polygon symbolizer --> array', () => {
    expect(Array.isArray(style.rules[6].polygonsymbolizer)).to.be.true;
  });

  it('Multiple Polygon symbolizers --> array', () => {
    expect(Array.isArray(style.rules[7].polygonsymbolizer)).to.be.true;
  });
});

describe('SVG style parameters', () => {
  describe('Static SVG parameters', () => {
    let style;
    let fillStyle;
    let strokeStyle;
    beforeEach(() => {
      const parsedSld = Reader(staticPolygonSymbolizerSld);
      [style] = parsedSld.layers[0].styles[0].featuretypestyles;
      const stroke = style.rules[0].polygonsymbolizer[0].stroke;
      strokeStyle = stroke.styling;
      const fill = style.rules[0].polygonsymbolizer[0].fill;
      fillStyle = fill.styling;
    });

    it('Fill color should be string', () => {
      expect(fillStyle.fill).to.equal('#FF0000');
    });
    it('Fill opacity should be number', () => {
      expect(fillStyle.fillOpacity).to.equal(0.5);
    });
    it('Stroke color should be string', () => {
      expect(strokeStyle.stroke).to.equal('#00FF00');
    });
    it('Stroke opacity should be number', () => {
      expect(strokeStyle.strokeOpacity).to.equal(1.0);
    });
    it('Stroke width should be number', () => {
      expect(strokeStyle.strokeWidth).to.equal(4);
    });
    it('Stroke linejoin should be string', () => {
      expect(strokeStyle.strokeLinejoin).to.equal('bevel');
    });
    it('Stroke linecap should be string', () => {
      expect(strokeStyle.strokeLinecap).to.equal('square');
    });
    it('Stroke dasharray should be string', () => {
      expect(strokeStyle.strokeDasharray).to.equal('6 10');
    });
    it('Stroke dashoffset should be number', () => {
      expect(strokeStyle.strokeDashoffset).to.equal(4);
    });
  });

  describe('Dynamic SVG parameters', () => {
    let style;
    let fillStyle;
    let strokeStyle;
    beforeEach(() => {
      const parsedSld = Reader(dynamicPolygonSymbolizerSld);
      [style] = parsedSld.layers[0].styles[0].featuretypestyles;
      const stroke = style.rules[0].polygonsymbolizer[0].stroke;
      strokeStyle = stroke.styling;
      const fill = style.rules[0].polygonsymbolizer[0].fill;
      fillStyle = fill.styling;
    });

    // Check stroke width dynamic style value.
    it('Dynamic style property should be a propertyname expression', () => {
      expect(strokeStyle.strokeWidth).to.deep.equal({
        type: 'propertyname',
        value: 'myStrokeWidth',
        typeHint: 'number',
      });
    });

    // Check types of possible SVG parameters.
    it('Fill color should be string', () => {
      expect(fillStyle.fill.typeHint).to.equal('string');
    });
    it('Fill opacity should be number', () => {
      expect(fillStyle.fillOpacity.typeHint).to.equal('number');
    });
    it('Stroke color should be string', () => {
      expect(strokeStyle.stroke.typeHint).to.equal('string');
    });
    it('Stroke opacity should be number', () => {
      expect(strokeStyle.strokeOpacity.typeHint).to.equal('number');
    });
    it('Stroke width should be number', () => {
      expect(strokeStyle.strokeWidth.typeHint).to.equal('number');
    });
  });

  describe('Parse QGIS export with parametric SVG', () => {
    let style;
    let graphic;
    beforeEach(() => {
      const parsedSld = Reader(qgisParametricSvg);
      [style] = parsedSld.layers[0].styles[0].featuretypestyles;
      graphic = style.rules[0].pointsymbolizer[0].graphic;
    });

    it('Skip mark element when ExternalGraphic has already been encountered', () => {
      // Mark element should be skipped.
      expect(graphic.mark).to.be.undefined;
    });

    it('Parse ExternalGraphic format', () => {
      // Mark element should be skipped.
      expect(graphic.externalgraphic.format).to.equal('image/svg+xml');
    });

    it('Turn base64: prefix into a full data url prefix with format', () => {
      expect(
        graphic.externalgraphic.onlineresource.indexOf(
          'data:image/svg+xml;base64,'
        )
      ).to.equal(0);
    });

    it('Removes query string from encoded image url', () => {
      const base64String = graphic.externalgraphic.onlineresource.replace(
        'data:image/svg+xml;base64,',
        ''
      );
      // URL should not contain a parameter array anymore.
      expect(/\?/.test(base64String)).to.be.false;
    });

    it('Replace param(...) expressions in svg', () => {
      const base64String = graphic.externalgraphic.onlineresource.replace(
        'data:image/svg+xml;base64,',
        ''
      );
      const svg = window.atob(base64String);
      // Parameters (param(...) expressions) should have been replaced.
      expect(/param\(([^)]*)\)/.test(svg)).to.be.false;
    });
  });

  describe('ExternalGraphic with InlineContent', () => {
    let style;
    beforeEach(() => {
      const parsedSld = Reader(externalGraphicInlineContentSld);
      [style] = parsedSld.layers[0].styles[0].featuretypestyles;
    });

    it('Base64 inline content is converted to base64 onlineresource', () => {
      const externalgraphic =
        style.rules[0].pointsymbolizer[0].graphic.externalgraphic;
      expect(externalgraphic.onlineresource).to.equal(
        'data:image/png;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
      );
    });

    it('SVG xml inline content is converted to base64 onlineresource', () => {
      const externalgraphic =
        style.rules[1].pointsymbolizer[0].graphic.externalgraphic;
      console.log(externalgraphic.onlineresource);
      expect(externalgraphic.onlineresource).to.equal(
        'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20100%20100%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Cpath%20d%3D%22M50%2C3l12%2C36h38l-30%2C22l11%2C36l-31-21l-31%2C21l11-36l-30-22h38z%22%20fill%3D%22%23FF0%22%20stroke%3D%22%23FC0%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E'
      );
    });
  });

  describe('Parse units of measure', () => {
    let parsedSld;
    let pointSymbolizer;
    let lineSymbolizer;
    let polygonSymbolizer;
    let textSymbolizer;
    beforeEach(() => {
      parsedSld = Reader(sldWithUom);
      const fts = parsedSld.layers[0].styles[0].featuretypestyles[0];
      pointSymbolizer = fts.rules[0].pointsymbolizer[0];
      textSymbolizer = fts.rules[0].textsymbolizer[0];
      lineSymbolizer = fts.rules[1].linesymbolizer[0];
      polygonSymbolizer = fts.rules[2].polygonsymbolizer[0];
    });

    it('Parse uom attribute for symbolizer elements', () => {
      expect(pointSymbolizer.uom).to.equal(UOM_METRE);
      expect(textSymbolizer.uom).to.equal(UOM_METRE);
      expect(lineSymbolizer.uom).to.equal(UOM_METRE);
      expect(polygonSymbolizer.uom).to.equal(UOM_METRE);
    });

    it('Has no unnecessary uom attributes', () => {
      const invalidUoms = validateObjectProperties(
        parsedSld,
        'parsedSld',
        (node, nodeName) => {
          if (node && typeof node === 'object') {
            if (
              node.uom &&
              (node.type === 'literal' || node.type === 'propertyname')
            ) {
              if (node.typeHint !== 'number') {
                throw new Error(
                  `Found uom on non-numeric literal [${nodeName}].`
                );
              }
            } else if (node.uom && node.type !== 'symbolizer') {
              throw new Error(
                `Found uom on non-symbolizer object [${nodeName}].`
              );
            }
          }
        }
      );
      expect(invalidUoms).to.deep.equal([]);
    });

    it('PointSymbolizer size in metres', () => {
      expect(pointSymbolizer.graphic.size).to.deep.equal({
        type: 'literal',
        typeHint: 'number',
        value: 10,
        uom: UOM_METRE,
      });
    });

    it('PointSymbolizer stroke width overrides uom by appending px', () => {
      expect(pointSymbolizer.graphic.mark.stroke.styling.strokeWidth).to.equal(
        2
      );
    });

    it('Opacity is always a dimensionless number', () => {
      expect(pointSymbolizer.graphic.mark.fill.styling.fillOpacity).to.equal(
        0.8
      );
    });

    it('LineSymbolizer stroke width as PropertyName inherits uom', () => {
      expect(lineSymbolizer.stroke.styling.strokeWidth).to.deep.equal({
        type: 'propertyname',
        typeHint: 'number',
        value: 'width_m',
        uom: UOM_METRE,
      });
    });

    it('LineSymbolizer graphic stroke gap inherits uom', () => {
      expect(lineSymbolizer.graphicstroke.gap).to.deep.equal({
        type: 'literal',
        typeHint: 'number',
        value: 12,
        uom: UOM_METRE,
      });
    });

    it('LineSymbolizer graphic stroke mark size inherits uom', () => {
      const { graphic } = lineSymbolizer.graphicstroke;
      expect(graphic.size).to.deep.equal({
        type: 'literal',
        typeHint: 'number',
        value: 4,
        uom: UOM_METRE,
      });
    });

    it('LineSymbolizer graphic stroke mark stroke width inherits uom', () => {
      const { mark } = lineSymbolizer.graphicstroke.graphic;
      expect(mark.stroke.styling.strokeWidth).to.deep.equal({
        type: 'literal',
        typeHint: 'number',
        value: 2,
        uom: UOM_METRE,
      });
    });

    it('Text symbolizer font size uom', () => {
      expect(textSymbolizer.font.styling.fontSize).to.deep.equal({
        type: 'literal',
        typeHint: 'number',
        value: 13,
        uom: UOM_METRE,
      });
    });

    it('Text symbolizer halo radius uom', () => {
      expect(textSymbolizer.halo.radius).to.deep.equal({
        type: 'literal',
        typeHint: 'number',
        value: 2,
        uom: 'metre',
      });
    });

    it('Text symbolizer anchor point X/Y always a dimensionless number', () => {
      const { anchorpoint } = textSymbolizer.labelplacement.pointplacement;
      expect(anchorpoint.anchorpointx).to.equal(0.5);
      expect(anchorpoint.anchorpointy).to.equal(0.5);
    });

    it('Polygon graphic fill mark size always pixel', () => {
      expect(polygonSymbolizer.fill.graphicfill.graphic.size).to.equal(8);
    });

    it('Polygon graphic fill stroke width always pixel', () => {
      const graphicFillMark = polygonSymbolizer.fill.graphicfill.graphic.mark;
      expect(graphicFillMark.stroke.styling.strokeWidth).to.equal(1);
    });
  });
});
