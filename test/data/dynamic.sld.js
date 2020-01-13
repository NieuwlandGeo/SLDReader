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
              <sld:Rotation>
                <ogc:PropertyName>angle</ogc:PropertyName>
              </sld:Rotation>
            </sld:Graphic>
          </sld:PointSymbolizer>
          <sld:TextSymbolizer>
            <sld:Label>
              <ogc:PropertyName>title</ogc:PropertyName>
            </sld:Label>
            <sld:Font>
              <sld:SvgParameter name="font-family">Noto Sans</sld:SvgParameter>
              <sld:SvgParameter name="font-size">13</sld:SvgParameter>
            </sld:Font>
            <sld:Halo>
              <sld:Radius>2</sld:Radius>
              <sld:Fill>                
                <sld:SvgParameter name="fill">#FFFFFF</sld:SvgParameter>
              </sld:Fill>
            </sld:Halo>
            <sld:LabelPlacement>
              <sld:PointPlacement>
                <sld:Rotation>
                  <ogc:PropertyName>angle</ogc:PropertyName>
                </sld:Rotation>
                <sld:AnchorPoint>
                  <sld:AnchorPointX>0</sld:AnchorPointX>
                  <sld:AnchorPointY>0.5</sld:AnchorPointY>
                </sld:AnchorPoint>
              </sld:PointPlacement>
            </sld:LabelPlacement>
            <sld:Fill>
              <sld:SvgParameter name="fill">#000000</sld:SvgParameter>
            </sld:Fill>
            <sld:VendorOption name="maxDisplacement">1</sld:VendorOption>
          </sld:TextSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</sld:StyledLayerDescriptor>`;

export default dynamicSld;
