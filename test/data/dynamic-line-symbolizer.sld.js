export const dynamicLineSymbolizerSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
  xmlns:se="http://www.opengis.net/se">
  <NamedLayer>
    <UserStyle>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:LineSymbolizer>
            <se:Stroke>
              <se:SvgParameter name="stroke">
                <ogc:PropertyName>myStrokeColor</ogc:PropertyName>
              </se:SvgParameter>
              <se:SvgParameter name="stroke-opacity">
                <ogc:PropertyName>myStrokeOpacity</ogc:PropertyName>
              </se:SvgParameter>
              <se:SvgParameter name="stroke-width">
                <ogc:PropertyName>myStrokeWidth</ogc:PropertyName>
              </se:SvgParameter>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default dynamicLineSymbolizerSld;
