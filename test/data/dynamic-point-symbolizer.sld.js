export const dynamicPointSymbolizerSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
  xmlns:se="http://www.opengis.net/se">
  <NamedLayer>
    <UserStyle>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:PointSymbolizer>
            <se:Graphic>
              <se:Mark>
                <se:WellKnownName>square</se:WellKnownName>
                <se:Fill>
                  <se:SvgParameter name="fill">
                    <ogc:PropertyName>myFillColor</ogc:PropertyName>
                  </se:SvgParameter>
                  <se:SvgParameter name="fill-opacity">
                    <ogc:PropertyName>myFillOpacity</ogc:PropertyName>
                  </se:SvgParameter>
                </se:Fill>
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
              </se:Mark>
              <se:Size>
                <ogc:PropertyName>mySize</ogc:PropertyName>
              </se:Size>
              <se:Rotation>
                <ogc:PropertyName>myAngle</ogc:PropertyName>
              </se:Rotation>
              <se:Displacement>
                <se:DisplacementX>
                  <ogc:PropertyName>myDisplacementX</ogc:PropertyName>
                </se:DisplacementX>
                <se:DisplacementY>
                  <ogc:PropertyName>myDisplacementY</ogc:PropertyName>
                </se:DisplacementY>
              </se:Displacement>
            </se:Graphic>
          </se:PointSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default dynamicPointSymbolizerSld;
