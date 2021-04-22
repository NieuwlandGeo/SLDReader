export const simpleLineSymbolizerSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" 
  xmlns:ogc="http://www.opengis.net/ogc" 
  xmlns:xlink="http://www.w3.org/1999/xlink" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <Name>Line</Name>
    <UserStyle>
      <FeatureTypeStyle>
        <Name>Simple line style</Name>
        <Rule>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#FF0000</CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
`;

export default simpleLineSymbolizerSld;
