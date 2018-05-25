/* global it describe expect before */
import Reader from '../src/Reader';
import { sld } from './data/test.sld';

describe('Filter tests', () => {
  let result;

  before(() => {
    result = Reader(sld);
  });

  it('PropertyIsEqualTo', () => {
    const filterXml = `<Filter>
      <PropertyIsBetween>
        <PropertyName>PERIMETER</PropertyName>
        <LowerBoundary>0.001</LowerBoundary>
        <UpperBoundary>1000</UpperBoundary>
      </PropertyIsBetween>
    </Filter>`;

    const filter = Reader(filterXml);
    expect(filter.type).to.equal('comparison');
    expect(filter.propertyname).to.equal('PERIMETER');
    expect(filter.lowerboundary).to.equal('0.001');
    expect(filter.upperboundary).to.equal('1000');
  });

  it('PropertyIsLike', () => {
    const filterXml = `<Filter>
      <PropertyIsLike wildCard="%" singleChar="?" escapeChar="\\">
        <PropertyName>name</PropertyName>
        <Literal>j?ns%</Literal>
      </PropertyIsLike>
    </Filter>`;

    const filter = Reader(filterXml);
    expect(filter.type).to.equal('comparison');
    expect(filter.operator).to.equal('propertyislike');
    expect(filter.wildcard).to.equal('%');
    expect(filter.singlechar).to.equal('?');
    expect(filter.escapechar).to.equal('\\');
    expect(filter.propertyname).to.equal('name');
    expect(filter.literal).to.equal('j?ns%');
  });

  it('NOT filter', () => {
    const filterXml = `<Filter>
      <Not>
        <PropertyIsEqualTo>
          <PropertyName>PERIMETER</PropertyName>
          <Literal>1071304933</Literal>
        </PropertyIsEqualTo>
      </Not>
    </Filter>`;

    const filter = Reader(filterXml);
    expect(filter.type).to.equal('not');
    expect(filter.predicate).to.be.ok;
    expect(filter.predicate.type).to.equal('comparison');
    expect(filter.predicate.operator).to.equal('propertyisequalto');
    expect(filter.predicate.propertyname).to.equal('PERIMETER');
    expect(filter.predicate.literal).to.equal('1071304933');
  });

  describe('From SLD', () => {
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
  });

  it('rules have filter for Hover Styler not_or', () => {
    const { filter } = result.layers['0'].styles['1'].featuretypestyles[
      '0'
    ].rules['0'];

    /*
    <ogc:Not>
      <ogc:Or>
        <ogc:PropertyIsEqualTo>
          <ogc:PropertyName>PERIMETER</ogc:PropertyName>
          <ogc:Literal>1071304933</ogc:Literal>
        </ogc:PropertyIsEqualTo>
        <ogc:PropertyIsLessThan>
          <ogc:PropertyName>AREA</ogc:PropertyName>
          <ogc:Literal>1065512599</ogc:Literal>
        </ogc:PropertyIsLessThan>
      </ogc:Or>
    </ogc:Not>
    */

    expect(filter.type).to.equal('not');

    const predicate = filter.predicate;
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
