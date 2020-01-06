export const dynamicSld = `<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" 
  xmlns:sld="http://www.opengis.net/sld" 
  xmlns:ogc="http://www.opengis.net/ogc" 
  xmlns:gml="http://www.opengis.net/gml" 
  xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
  <NamedLayer>
    <sld:Name>dynamic_style</sld:Name>
    <UserStyle>
      <sld:Name>dynamic_style</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:Mark>
                <sld:WellKnownName>circle</sld:WellKnownName>
                <sld:Fill>
                  <sld:SvgParameter name="fill">#ffffff</sld:SvgParameter>
                </sld:Fill>
                <sld:Stroke>
                  <sld:SvgParameter name="stroke">#ff0000</sld:SvgParameter>
                  <sld:SvgParameter name="stroke-width">2</sld:SvgParameter>
                </sld:Stroke>
              </sld:Mark>
              <sld:Size>
                <ogc:PropertyName>size</ogc:PropertyName>
              </sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</sld:StyledLayerDescriptor>`;

export default dynamicSld;
