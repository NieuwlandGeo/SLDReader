/* global it describe expect beforeEach */
import Reader from '../src/Reader';

describe.only('Function parsing', () => {
  it('Parse function inside filter expression', () => {
    const filterXml = `<StyledLayerDescriptor  xmlns="http://www.opengis.net/ogc"><Filter>
      <PropertyIsEqualTo>
        <Function name="strSubstringStart">
          <PropertyName>timestamp</PropertyName>
          <Literal>-4</Literal>
        </Function>
        <Literal>2023</Literal>
      </PropertyIsEqualTo>
    </Filter></StyledLayerDescriptor>`;

    // Todo: test this.
  });
});
