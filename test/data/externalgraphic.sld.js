export const externalGraphicSld = `<?xml version="1.0" encoding="UTF-8"?>
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
          <sld:Name>Type 1</sld:Name>
          <sld:Description>
            <sld:Title>Type 1</sld:Title>
          </sld:Description>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>type</ogc:PropertyName>
              <ogc:Literal>1</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:OnlineResource xlink:type="simple" xlink:href="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="/>
                <sld:Format>image/png</sld:Format>
              </sld:ExternalGraphic>
              <sld:Size>24</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>Type 2</sld:Name>
          <sld:Description>
            <sld:Title>Type 2</sld:Title>
          </sld:Description>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>type</ogc:PropertyName>
              <ogc:Literal>2</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:OnlineResource xlink:type="simple" xlink:href="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>
                <sld:Format>image/png</sld:Format>
              </sld:ExternalGraphic>
              <sld:Size>24</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>Type 3</sld:Name>
          <sld:Description>
            <sld:Title>Type 3</sld:Title>
          </sld:Description>
          <ogc:Filter xmlns:ogc="http://www.opengis.net/ogc">
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>type</ogc:PropertyName>
              <ogc:Literal>3</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:OnlineResource xlink:type="simple" xlink:href="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="/>
                <sld:Format>image/png</sld:Format>
              </sld:ExternalGraphic>
              <sld:Size>24</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <ogc:ElseFilter />
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:OnlineResource xlink:type="simple" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="/>
                <sld:Format>image/png</sld:Format>
              </sld:ExternalGraphic>
              <sld:Size>24</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</sld:StyledLayerDescriptor>`;

export default externalGraphicSld;
