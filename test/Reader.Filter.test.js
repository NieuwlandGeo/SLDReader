/* global it describe expect beforeEach */
import Reader from '../src/Reader';
import { sld } from './data/test.sld';

describe('Filter tests', () => {
  it('PropertyIsBetween', () => {
    const filterXml = `<?xml version="1.0" encoding="UTF-8"?>
    <StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsBetween>
        <PropertyName>AREA</PropertyName>
        <LowerBoundary>
          <Literal>1064866676</Literal>
        </LowerBoundary>
        <UpperBoundary>
          <Literal>1065512599</Literal>
        </UpperBoundary>
      </PropertyIsBetween>
    </Filter></StyledLayerDescriptor>`;

    const { filter } = Reader(filterXml);
    expect(filter.type).to.equal('comparison');
    expect(filter.propertyname).to.equal('AREA');
    expect(filter.lowerboundary).to.equal('1064866676');
    expect(filter.upperboundary).to.equal('1065512599');
  });

  it('PropertyIsNull', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsNull>
        <PropertyName>PERIMETER</PropertyName>
      </PropertyIsNull>
    </Filter></StyledLayerDescriptor>`;

    const { filter } = Reader(filterXml);
    expect(filter.type).to.equal('comparison');
    expect(filter.operator).to.equal('propertyisnull');
    expect(filter.propertyname).to.equal('PERIMETER');
  });

  it('PropertyIsLike', () => {
    const filterXml = `<StyledLayerDescriptor xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsLike wildCard="%" singleChar="?" escapeChar="\\">
        <PropertyName>name</PropertyName>
        <Literal>j?ns%</Literal>
      </PropertyIsLike>
    </Filter></StyledLayerDescriptor>`;

    const { filter } = Reader(filterXml);
    expect(filter.type).to.equal('comparison');
    expect(filter.operator).to.equal('propertyislike');
    expect(filter.wildcard).to.equal('%');
    expect(filter.singlechar).to.equal('?');
    expect(filter.escapechar).to.equal('\\');
    expect(filter.propertyname).to.equal('name');
    expect(filter.literal).to.equal('j?ns%');
  });

  it('NOT filter', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <Not>
        <PropertyIsEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsEqualTo>
      </Not>
    </Filter></StyledLayerDescriptor>`;

    const { filter } = Reader(filterXml);
    expect(filter.type).to.equal('not');
    expect(filter.predicate).to.be.ok;
    expect(filter.predicate.type).to.equal('comparison');
    expect(filter.predicate.operator).to.equal('propertyisequalto');
    expect(filter.predicate.propertyname).to.equal('PERIMETER');
    expect(filter.predicate.literal).to.equal('1071304933');
  });

  describe('From SLD', () => {
    let result;

    beforeEach(() => {
      result = Reader(sld);
    });

    it('rules have filter for featureid', () => {
      const { filter } = result.layers['0'].styles['0'].featuretypestyles[
        '0'
      ].rules['0'];
      expect(filter.type).to.equal('featureid');
      expect(filter.fids).to.be.an.instanceof(Array);
      expect(filter.fids).to.have.length(2);
      expect(filter.fids[0]).to.equal('tasmania_water_bodies.2');
    });

    it('rules have filter for Attribute Filter Styler PropertyIsEqualTo', () => {
      const { filter } = result.layers['0'].styles['2'].featuretypestyles[
        '0'
      ].rules['0'];
      expect(filter.type).to.equal('comparison');
      expect(filter.operator).to.equal('propertyisequalto');
      expect(filter.propertyname).to.equal('name');
      expect(filter.literal).to.equal('My simple Polygon');
    });
    it('rules have filter for Hover Styler not_or', () => {
      const { filter } = result.layers['0'].styles['1'].featuretypestyles[
        '0'
      ].rules['0'];

      expect(filter.type).to.equal('not');

      const { predicate } = filter;
      expect(predicate.type).to.equal('or');

      const orPredicate1 = predicate.predicates[0];
      expect(orPredicate1.type).to.equal('comparison');
      expect(orPredicate1.operator).to.equal('propertyisequalto');
      expect(orPredicate1.propertyname).to.equal('PERIMETER');
      expect(orPredicate1.literal).to.equal('1071304933');

      const orPredicate2 = predicate.predicates[1];
      expect(orPredicate2.type).to.equal('comparison');
      expect(orPredicate2.operator).to.equal('propertyislessthan');
      expect(orPredicate2.propertyname).to.equal('AREA');
      expect(orPredicate2.literal).to.equal('1065512599');
    });
  });
});
