export const emptySvgParametersSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
  xmlns:se="http://www.opengis.net/se">
  <NamedLayer>
    <UserStyle>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:PolygonSymbolizer>
            <se:Fill>
              <se:SvgParameter name="fill"></se:SvgParameter>
              <se:SvgParameter name="fill-opacity"></se:SvgParameter>
            </se:Fill>
            <se:Stroke>
              <se:SvgParameter name="stroke"></se:SvgParameter>
              <se:SvgParameter name="stroke-opacity"></se:SvgParameter>
              <se:SvgParameter name="stroke-width"></se:SvgParameter>
              <se:SvgParameter name="stroke-linejoin"></se:SvgParameter>
              <se:SvgParameter name="stroke-linecap"></se:SvgParameter>
              <se:SvgParameter name="stroke-dasharray"></se:SvgParameter>
              <se:SvgParameter name="stroke-dashoffset"></se:SvgParameter>
            </se:Stroke>
          </se:PolygonSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default emptySvgParametersSld;
