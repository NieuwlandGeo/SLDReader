/* global describe it expect beforeEach */
import Reader from '../src/Reader';
import { sld } from './data/test.sld';

let result;
beforeEach(() => {
  result = Reader(sld);
});

describe('Reads xml', () => {
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
  it('rules have filter for featureid', () => {
    const filter = result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'].filter;
    expect(filter).to.be.an.instanceof(Object);
    expect(filter.featureid).to.be.an.instanceof(Array);
    expect(filter.featureid).to.include('tasmania_water_bodies.2');
  });
  it('rules have props', () => {
    const rule = result.layers['0'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule.maxscaledenominator).to.equal('3000000');
    expect(rule.polygonsymbolizer).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.css['0']).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.fill.css['0'].name).to.equal('fill');
    expect(rule.polygonsymbolizer.fill.css['0'].value).to.equal('blue');
    expect(rule.polygonsymbolizer.fill.css['1'].name).to.equal('fill-opacity');
    expect(rule.polygonsymbolizer.fill.css['1'].value).to.equal('1.0');
    expect(rule.polygonsymbolizer.stroke.css['0']).to.be.an.instanceof(Object);
    expect(rule.polygonsymbolizer.stroke.css['0'].name).to.equal('stroke');
  });
  it('cities layer has PointSymbolizer with external graphic', () => {
    const rule = result.layers['2'].styles['0'].featuretypestyles['0'].rules['0'];
    expect(rule).to.have.property('pointsymbolizer');
    expect(rule.pointsymbolizer).to.have.property('graphic');
    expect(rule.pointsymbolizer.graphic).to.have.property('externalgraphic');
    expect(rule.pointsymbolizer.graphic.externalgraphic).to.have.property('onlineresource');
    expect(rule.pointsymbolizer.graphic.externalgraphic.onlineresource).to.equal(
      '../img/marker.png'
    );
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
