export const dynamicTextSymbolizerSld = `<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
  xmlns:se="http://www.opengis.net/se">
  <NamedLayer>
    <UserStyle>
      <se:FeatureTypeStyle>
        <se:Rule>
          <se:TextSymbolizer>
            <se:Label>
              <ogc:PropertyName>myLabel</ogc:PropertyName>
            </se:Label>
            <se:Font>
              <se:SvgParameter name="font-family">
                <ogc:PropertyName>myFontFamily</ogc:PropertyName>
              </se:SvgParameter>
              <se:SvgParameter name="font-style">
                <ogc:PropertyName>myFontStyle</ogc:PropertyName>
              </se:SvgParameter>
              <se:SvgParameter name="font-weight">
                <ogc:PropertyName>myFontWeight</ogc:PropertyName>
              </se:SvgParameter>
              <se:SvgParameter name="font-size">
                <ogc:PropertyName>myFontSize</ogc:PropertyName>
              </se:SvgParameter>
            </se:Font>
            <se:LabelPlacement>
              <se:PointPlacement>
                <se:AnchorPoint>
                  <se:AnchorPointX>0.5</se:AnchorPointX>
                  <se:AnchorPointY>0.5</se:AnchorPointY>
                </se:AnchorPoint>
              </se:PointPlacement>
            </se:LabelPlacement>
            <se:Halo>
              <se:Radius>
                <ogc:PropertyName>myHaloRadius</ogc:PropertyName>
              </se:Radius>
              <se:Fill>
                <se:SvgParameter name="fill">
                  <ogc:PropertyName>myHaloColor</ogc:PropertyName>
                </se:SvgParameter>
                <se:SvgParameter name="fill-opacity">
                  <ogc:PropertyName>myHaloOpacity</ogc:PropertyName>
                </se:SvgParameter>
              </se:Fill>
            </se:Halo>
            <se:Fill>
              <se:SvgParameter name="fill">
                <ogc:PropertyName>myTextColor</ogc:PropertyName>
              </se:SvgParameter>
              <se:SvgParameter name="fill-opacity">
                <ogc:PropertyName>myTextOpacity</ogc:PropertyName>
              </se:SvgParameter>
            </se:Fill>
          </se:TextSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default dynamicTextSymbolizerSld;
