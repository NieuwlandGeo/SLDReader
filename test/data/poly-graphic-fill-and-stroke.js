export const polyGraphicFillAndStrokeSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <Name>Test SLD</Name>
    <UserStyle>
      <Name>Test style</Name>
      <FeatureTypeStyle>
        <Rule>
          <Name>Polygon with GraphicFill and Stroke</Name>
          <PolygonSymbolizer>
            <Fill>
              <GraphicFill>
                <Graphic>
                  <ExternalGraphic>
                    <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="simple" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAH0lEQVQYlWNgIAL8x8JHF8OqGK9C0gG6cf/RJcm3FwAhPAv1L5FuyAAAAABJRU5ErkJggg=="></OnlineResource>
                    <Format>image/png</Format>
                  </ExternalGraphic>
                  <Opacity>1.0</Opacity>
                  <Size>8</Size>
                </Graphic>
              </GraphicFill>
            </Fill>
            <Stroke>
              <SvgParameter name="stroke">#000000</SvgParameter>
              <SvgParameter name="stroke-width">3</SvgParameter>
              <SvgParameter name="stroke-linejoin">bevel</SvgParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default polyGraphicFillAndStrokeSld;
