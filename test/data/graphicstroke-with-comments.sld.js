export const graphicStrokeWithComments = `<?xml version="1.0" encoding="UTF-8"?>
<!--hello--><StyledLayerDescriptor xmlns="http://www.opengis.net/sld"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.1.0/StyledLayerDescriptor.xsd"
  xmlns:se="http://www.opengis.net/se" version="1.1.0"
  xmlns:ogc="http://www.opengis.net/ogc">
  <!--hello--><NamedLayer>
    <!--hello--><se:Name>test_layer</se:Name>
    <!--hello--><UserStyle>
      <!--hello--><se:Name>test_style</se:Name>
      <!--hello--><se:FeatureTypeStyle>
        <!--hello--><se:Rule>
          <!--hello--><se:Name>Single symbol</se:Name>
          <!--hello--><se:LineSymbolizer>
            <!--hello--><se:Stroke>
              <!--hello--><se:GraphicStroke>
                <!--hello--><se:Graphic>
                  <!--hello--><se:Mark>
                    <!--hello--><se:WellKnownName>circle</se:WellKnownName>
                    <!--hello--><se:Fill>
                      <!--hello--><se:SvgParameter name="fill">#ff8000</se:SvgParameter>
                    </se:Fill>
                    <!--hello--><se:Stroke>
                      <!--hello--><se:SvgParameter name="stroke">#232323</se:SvgParameter>
                      <!--hello--><se:SvgParameter name="stroke-width">0.5</se:SvgParameter>
                    </se:Stroke>
                  </se:Mark>
                  <!--hello--><se:Size>6</se:Size>
                </se:Graphic>
                <!--hello--><se:Gap>
                  <!--hello--><ogc:Literal>14</ogc:Literal>
                </se:Gap>
                <!--hello--><se:InitialGap>
                  <!--hello--><ogc:Literal>6</ogc:Literal>
                </se:InitialGap>
              </se:GraphicStroke>
            </se:Stroke>
          </se:LineSymbolizer>
        </se:Rule>
      </se:FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;

export default graphicStrokeWithComments;
