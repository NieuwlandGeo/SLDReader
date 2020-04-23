export const textSymbolizerCDataSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" 
  xmlns:sld="http://www.opengis.net/sld" 
  xmlns:ogc="http://www.opengis.net/ogc" 
  xmlns:gml="http://www.opengis.net/gml" 
  xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
  <NamedLayer>
    <Name>test_minimal_symbolizers</Name>
    <UserStyle>
      <Name>test_minimal_symbolizers</Name>
      <FeatureTypeStyle>
        <Rule>
          <TextSymbolizer>
            <Label>Size:<![CDATA[ ]]><ogc:PropertyName>size</ogc:PropertyName><![CDATA[
]]>Angle:<![CDATA[ ]]><ogc:PropertyName>angle</ogc:PropertyName>
            </Label>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default textSymbolizerCDataSld;
