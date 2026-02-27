export const fontSymbolsSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" version="1.1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd" xmlns:se="http://www.opengis.net/se">
  <NamedLayer>
    <se:Name>wgptest:puntenlaag</se:Name>
    <UserStyle>
      <se:Name>wgptest:puntenlaag</se:Name>
      <se:FeatureTypeStyle>
        <!-- Font symbolizer according to Symbology Encoding 1.1.0 spec (as output by QGIS) -->
        <se:Rule>
          <se:Name>Font Symbol SE 1.1.0</se:Name>
          <se:PointSymbolizer>
            <se:Graphic>
              <se:Mark>
                <se:OnlineResource xlink:href="ttf://Wingdings" xlink:type="simple"/>
                <se:Format>ttf</se:Format>
                <se:MarkIndex>77</se:MarkIndex>
                <se:Fill>
                  <se:SvgParameter name="fill">#FF0000</se:SvgParameter>
                  </se:Fill>
                <se:Stroke>
                  <se:SvgParameter name="stroke-width">3</se:SvgParameter>
                  <se:SvgParameter name="stroke">#0000FF</se:SvgParameter>
                </se:Stroke>
              </se:Mark>
              <se:Size>14</se:Size>
            </se:Graphic>
          </se:PointSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Name>Font Symbol Geoserver</se:Name>
          <se:PointSymbolizer>
            <se:Graphic>
              <se:Mark>
                <se:WellKnownName>ttf://Font Awesome 6 Pro Solid#0xef072</se:WellKnownName>
                <se:Fill>
                  <se:SvgParameter name="fill">#880000</se:SvgParameter>
                  </se:Fill>
                <se:Stroke>
                  <se:SvgParameter name="stroke-width">3</se:SvgParameter>
                  <se:SvgParameter name="stroke">#000088</se:SvgParameter>
                </se:Stroke>
              </se:Mark>
              <se:Size>42</se:Size>
            </se:Graphic>
          </se:PointSymbolizer>
        </se:Rule>
        <se:Rule>
          <se:Name>Invalid mark index</se:Name>
          <se:PointSymbolizer>
            <se:Graphic>
              <se:Mark>
                <se:WellKnownName>ttf://Webdings#</se:WellKnownName>
              </se:Mark>
              <se:Size>24</se:Size>
            </se:Graphic>
          </se:PointSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
