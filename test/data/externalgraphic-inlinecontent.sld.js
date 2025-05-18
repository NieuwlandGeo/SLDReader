export const externalGraphicInlineContentSld = `<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" 
  xmlns:sld="http://www.opengis.net/sld" 
  xmlns:ogc="http://www.opengis.net/ogc" 
  xmlns:gml="http://www.opengis.net/gml" 
  xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
  <NamedLayer>
    <sld:Name>icons_puntenlaag</sld:Name>
    <UserStyle>
      <sld:Name>icons_puntenlaag</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:Name>Inline base64</sld:Name>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:InlineContent encoding="base64">R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==</sld:InlineContent>
                <sld:Format>image/png</sld:Format>
              </sld:ExternalGraphic>
              <sld:Size>24</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>Inline svg</sld:Name>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:InlineContent encoding="xml">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,3l12,36h38l-30,22l11,36l-31-21l-31,21l11-36l-30-22h38z" fill="#FF0" stroke="#FC0" stroke-width="2"/></svg>
                </sld:InlineContent>
                <sld:Format>image/svg+xml</sld:Format>
              </sld:ExternalGraphic>
              <sld:Size>24</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</sld:StyledLayerDescriptor>`;

export default externalGraphicInlineContentSld;
