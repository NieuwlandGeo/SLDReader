const graphicStrokeVendorOption = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  version="1.0.0"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <Name>LinearDimension</Name>
    <UserStyle>
      <Name>LinearDimension</Name>
      <FeatureTypeStyle>
        <Rule>
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#000000</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </LineSymbolizer>
          <LineSymbolizer>
            <VendorOption name="placement">lastPoint</VendorOption>
            <Stroke>
              <GraphicStroke>
                <Graphic>
                  <Mark>
                    <WellKnownName>triangle</WellKnownName>
                    <Fill>
                      <CssParameter name="fill">#000000</CssParameter>
                    </Fill>
                    <Stroke/>
                  </Mark>
                  <Size>13</Size>
                  <Rotation>
                    <ogc:Literal>90</ogc:Literal>
                  </Rotation>
                </Graphic>
              </GraphicStroke>
            </Stroke>
          </LineSymbolizer>
          <LineSymbolizer>
            <VendorOption name="placement">firstPoint</VendorOption>
            <Stroke>
              <GraphicStroke>
                <Graphic>
                  <Mark>
                    <WellKnownName>triangle</WellKnownName>
                    <Fill>
                      <CssParameter name="fill">#000000</CssParameter>
                    </Fill>
                    <Stroke/>
                  </Mark>
                  <Size>13</Size>
                  <Rotation>
                    <ogc:Literal>270</ogc:Literal>
                  </Rotation>
                </Graphic>
              </GraphicStroke>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default graphicStrokeVendorOption;
