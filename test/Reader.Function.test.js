/* global it describe expect */
import Reader from '../src/Reader';

describe('Filter tests', () => {
  it('dimension with property name', () => {
    const filterXml = `<Filter>
      <PropertyIsEqualTo>
        <Function name="dimension">
          <PropertyName>geom</PropertyName>
        </Function>
        <Literal>2</Literal>
      </PropertyIsEqualTo>
    </Filter>`;

    const filter = Reader(filterXml);
    expect(filter.type).to.equal('comparison');
    expect(filter.function.name).to.equal('dimension');
    expect(filter.function.propertyname).to.equal('geom');
    expect(filter.literal).to.equal('2');
  });
});
