/* global describe it expect before */
import Reader from '../src/Reader';
import { sld } from './data/test.sld';
import { sld11 } from './data/test11.sld';

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
    const layernames = ['WaterBodies', 'Roads', 'Cities', 'Land'];
    expect(result.layers).to.have.length(4);
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
    const featuretypestyle = result.layers['0'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
  });
  it('rules have props', () => {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule.maxscaledenominator).to.equal('3000000');
    expect(rule.polygonsymbolizer).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.styling).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.styling.fill).to.equal('blue');
    expect(rule.polygonsymbolizer.fill.styling.fillOpacity).to.equal('1.0');
    expect(rule.polygonsymbolizer.stroke.styling.stroke).to.equal('#C0C0C0');
  });
  it('cities layer has PointSymbolizer with external graphic', () => {
    const rule = result.layers['2'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule).to.have.property('pointsymbolizer');
    expect(rule.pointsymbolizer).to.have.property('graphic');
    expect(rule.pointsymbolizer.graphic).to.have.property('externalgraphic');
    expect(rule.pointsymbolizer.graphic.externalgraphic).to.have.property('onlineresource');
    expect(rule.pointsymbolizer.graphic.externalgraphic.onlineresource).to.equal('../img/marker.png');
  });
  it('cities layer has pointsymbolizer with graphic mark', () => {
    const rule = result.layers['2'].styles['0'].featuretypestyles['0'].rules['1'];
    expect(rule).to.have.property('pointsymbolizer');
    expect(rule.pointsymbolizer).to.have.property('graphic');
    expect(rule.pointsymbolizer.graphic).to.have.property('mark');
    expect(rule.pointsymbolizer.graphic).to.have.property('size');
    expect(rule.pointsymbolizer.graphic.mark).to.have.property('wellknownname');
    expect(rule.pointsymbolizer.graphic.mark.wellknownname).to.equal('cross');
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
    const featuretypestyle = result.layers['0'].styles['0'].featuretypestyles['0'];
    expect(featuretypestyle.rules).to.be.an.instanceof(Array);
    expect(featuretypestyle.rules).to.have.length(4);
  });
  it('rule polygonsymbolizer has props from svg', () => {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule.polygonsymbolizer).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.styling).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.styling.fill).to.equal('#CCCCCC');
  });
  it('rule textsymbolizer label', () => {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['3'];
    expect(rule.textsymbolizer).to.be.an.instanceof(Object);
    expect(rule.textsymbolizer.label).to.be.an.instanceof(Object);
    expect(rule.textsymbolizer.label.some(l => l.propertyname === 'provincienaam')).to.be.true;
  });
  it('rule textsymbolizer has font', () => {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['3'];
    expect(rule.textsymbolizer).to.be.an.instanceof(Object);
    expect(rule.textsymbolizer.font).to.be.an.instanceof(Object);
    expect(rule.textsymbolizer.font.styling).to.be.an.instanceof(Object);
    expect(rule.textsymbolizer.font.styling.fontFamily).to.equal('Noto Sans');
  });
  it('rule textsymbolizer has fill', () => {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['3'];
    expect(rule.textsymbolizer).to.be.an.instanceof(Object);
    expect(rule.textsymbolizer.fill).to.be.an.instanceof(Object);
  });
});
