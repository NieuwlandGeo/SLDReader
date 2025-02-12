/* global describe it expect before beforeEach */
import Reader from '../src/Reader';
import { sld } from './data/test.sld';
import { sld11 } from './data/test11.sld';
import { dynamicSld } from './data/dynamic.sld';
import { graphicstrokeSymbolizerSld } from './data/graphicstrokeSymbolizer.sld';
import { graphicStrokeWithGap } from './data/graphicstroke-with-gap.sld';
import { graphicStrokeWithComments } from './data/graphicstroke-with-comments.sld';
import { multipleSymbolizersSld } from './data/multiple-symbolizers.sld';
import { staticPolygonSymbolizerSld } from './data/static-polygon-symbolizer.sld';
import { dynamicPolygonSymbolizerSld } from './data/dynamic-polygon-symbolizer.sld';
import { graphicStrokeVendorOption } from './data/graphicstroke-vendoroption.sld';

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
    expect(result.layers['0'].name).to.equal('Hoogspanning');
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
});
