export const sld = `<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor version="1.0.0"
    xmlns:sld="http://www.opengis.net/sld"
    xmlns:ogc="http://www.opengis.net/ogc"
    xmlns:gml="http://www.opengis.net/gml"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <sld:NamedLayer>
    <sld:Name>WaterBodies</sld:Name>
    <sld:UserStyle>
      <sld:Name>Default Styler</sld:Name>
      <sld:Title>Default Styler (zoom in to see more objects)</sld:Title>
      <sld:Abstract></sld:Abstract>
      <sld:IsDefault>1</sld:IsDefault>
      <sld:FeatureTypeStyle>
        <sld:Name>testStyleName</sld:Name>
        <sld:Title>Test style</sld:Title>
        <sld:Abstract>abstract</sld:Abstract>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <sld:Rule>
          <sld:Name>testRuleName</sld:Name>
          <sld:Title>title</sld:Title>
          <sld:Abstract>Abstract</sld:Abstract>
          <ogc:Filter>
            <ogc:FeatureId fid="tasmania_water_bodies.2" />
            <ogc:FeatureId fid="tasmania_water_bodies.3" />
          </ogc:Filter>
          <sld:MaxScaleDenominator>3000000</sld:MaxScaleDenominator>
          <sld:MinScaleDenominator>1000</sld:MinScaleDenominator>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">blue</sld:CssParameter>
              <sld:CssParameter name="fill-opacity">
                <ogc:Literal>1.0</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
            <sld:Stroke>
              <sld:CssParameter name="stroke">
                <ogc:Literal>#C0C0C0</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-linecap">
                <ogc:Literal>butt</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-linejoin">
                <ogc:Literal>miter</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-opacity">
                <ogc:Literal>1</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-width">
                <ogc:Literal>1</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-dashoffset">
                <ogc:Literal>0</ogc:Literal>
              </sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>testRuleNameElse</sld:Name>
          <sld:Title>title</sld:Title>
          <sld:Abstract>Abstract</sld:Abstract>
          <sld:ElseFilter/>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">#aaaaff</sld:CssParameter>
              <sld:CssParameter name="fill-opacity">
                <ogc:Literal>0.5</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
            <sld:Stroke>
              <sld:CssParameter name="stroke">
                <ogc:Literal>#C0C0C0</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-opacity">
                <ogc:Literal>1</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-width">
                <ogc:Literal>1</ogc:Literal>
              </sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Hover Styler</sld:Name>
      <sld:Title>Hover Styler</sld:Title>
      <sld:Abstract></sld:Abstract>
      <sld:FeatureTypeStyle>
        <sld:Name>testStyleHover</sld:Name>
        <sld:Title>title</sld:Title>
        <sld:Abstract>abstract</sld:Abstract>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <sld:Rule>
          <sld:Name>testRuleNameHover</sld:Name>
          <sld:Title>title</sld:Title>
          <sld:Abstract>Abstract</sld:Abstract>
          <ogc:Filter>
            <ogc:Not>
              <ogc:Or>
                <ogc:PropertyIsEqualTo>
                  <ogc:PropertyName>PERIMETER</ogc:PropertyName>
                  <ogc:Literal>1071304933</ogc:Literal>
                </ogc:PropertyIsEqualTo>
                <ogc:PropertyIsLessThan>
                  <ogc:PropertyName>AREA</ogc:PropertyName>
                  <ogc:Literal>1065512599</ogc:Literal>
                </ogc:PropertyIsLessThan>
              </ogc:Or>
            </ogc:Not>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>black</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="fill-opacity">
                <ogc:Literal>0.5</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
            <sld:Stroke>
              <sld:CssParameter name="stroke">
                <ogc:Literal>green</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-linecap">
                <ogc:Literal>butt</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-linejoin">
                <ogc:Literal>miter</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-opacity">
                <ogc:Literal>0.5</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-width">
                <ogc:Literal>5</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-dashoffset">
                <ogc:Literal>0</ogc:Literal>
              </sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:Name>testRuleNameHoverElse</sld:Name>
          <sld:Title>title</sld:Title>
          <sld:Abstract>Abstract</sld:Abstract>
          <sld:ElseFilter/>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>black</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="fill-opacity">
                <ogc:Literal>0.5</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
            <sld:Stroke>
              <sld:CssParameter name="stroke">
                <ogc:Literal>fuchsia</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-opacity">
                <ogc:Literal>0.5</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-width">
                <ogc:Literal>5</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-dashoffset">
                <ogc:Literal>0</ogc:Literal>
              </sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Attribute Filter Styler</sld:Name>
      <sld:Title>Attribute Filter Styler</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>rulePropertyIsEqualTo</sld:Name>
          <sld:Title>rulePropertyIsEqualTo</sld:Title>
          <sld:Abstract>rulePropertyIsEqualTo</sld:Abstract>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>name</ogc:PropertyName>
              <ogc:Literal>My simple Polygon</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>#000033</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsEqualTo</sld:Name>
      <sld:Title>Styler Test PropertyIsEqualTo</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>rulePropertyIsEqualTo</sld:Name>
          <sld:Title>rulePropertyIsEqualTo</sld:Title>
          <sld:Abstract>rulePropertyIsEqualTo</sld:Abstract>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>AREA</ogc:PropertyName>
              <ogc:Literal>1067743969</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>red</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Styler Test WATER_TYPE</sld:Name>
      <sld:Title>Styler Test WATER_TYPE</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>rulePropertyIsEqualTo</sld:Name>
          <sld:Title>rulePropertyIsEqualTo</sld:Title>
          <sld:Abstract>rulePropertyIsEqualTo</sld:Abstract>
          <ogc:Filter>
            <ogc:PropertyIsEqualTo>
              <ogc:PropertyName>WATER_TYPE</ogc:PropertyName>
              <ogc:Literal>Lake</ogc:Literal>
            </ogc:PropertyIsEqualTo>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>red</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsGreaterThanOrEqualTo</sld:Name>
      <sld:Title>Styler Test PropertyIsGreaterThanOrEqualTo</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>PropertyIsGreaterThanOrEqualTo</sld:Name>
          <sld:Title>PropertyIsGreaterThanOrEqualTo</sld:Title>
          <sld:Abstract>PropertyIsGreaterThanOrEqualTo</sld:Abstract>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>WATER_TYPE</ogc:PropertyName>
                <ogc:Literal>Lake</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThanOrEqualTo>
                <ogc:PropertyName>AREA</ogc:PropertyName>
                <ogc:Literal>1067509088</ogc:Literal>
              </ogc:PropertyIsGreaterThanOrEqualTo>
            </ogc:And>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>yellow</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>


    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsLessThanOrEqualTo</sld:Name>
      <sld:Title>Styler Test PropertyIsLessThanOrEqualTo</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>PropertyIsLessThanOrEqualTo</sld:Name>
          <sld:Title>PropertyIsLessThanOrEqualTo</sld:Title>
          <sld:Abstract>PropertyIsLessThanOrEqualTo</sld:Abstract>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>WATER_TYPE</ogc:PropertyName>
                <ogc:Literal>Lake</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsLessThanOrEqualTo>
                <ogc:PropertyName>AREA</ogc:PropertyName>
                <ogc:Literal>1067509088</ogc:Literal>
              </ogc:PropertyIsLessThanOrEqualTo>
            </ogc:And>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>yellow</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>



    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsGreaterThan</sld:Name>
      <sld:Title>Styler Test PropertyIsGreaterThan</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>PropertyIsGreaterThan</sld:Name>
          <sld:Title>PropertyIsGreaterThan</sld:Title>
          <sld:Abstract>PropertyIsGreaterThan</sld:Abstract>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>WATER_TYPE</ogc:PropertyName>
                <ogc:Literal>Lake</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsGreaterThan>
                <ogc:PropertyName>AREA</ogc:PropertyName>
                <ogc:Literal>1067000000</ogc:Literal>
              </ogc:PropertyIsGreaterThan>
            </ogc:And>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>yellow</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsLessThan</sld:Name>
      <sld:Title>Styler Test PropertyIsLessThan</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>PropertyIsLessThan</sld:Name>
          <sld:Title>PropertyIsLessThan</sld:Title>
          <sld:Abstract>PropertyIsLessThan</sld:Abstract>
          <ogc:Filter>
            <ogc:And>
              <ogc:PropertyIsEqualTo>
                <ogc:PropertyName>WATER_TYPE</ogc:PropertyName>
                <ogc:Literal>Lake</ogc:Literal>
              </ogc:PropertyIsEqualTo>
              <ogc:PropertyIsLessThan>
                <ogc:PropertyName>AREA</ogc:PropertyName>
                <ogc:Literal>1067000000</ogc:Literal>
              </ogc:PropertyIsLessThan>
            </ogc:And>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>yellow</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsLike</sld:Name>
      <sld:Title>Styler Test PropertyIsLike</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>PropertyIsLike</sld:Name>
          <sld:Title>PropertyIsLike</sld:Title>
          <sld:Abstract>PropertyIsLike</sld:Abstract>
          <ogc:Filter>
            <ogc:PropertyIsLike wildCard='*' singleChar='.' escape='!'>
              <ogc:PropertyName>AREA</ogc:PropertyName>
              <ogc:Literal>106774*</ogc:Literal>
            </ogc:PropertyIsLike>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>green</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>Styler Test PropertyIsBetween</sld:Name>
      <sld:Title>Styler Test PropertyIsBetween</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Name>attribute filter type</sld:Name>
        <sld:Title>attribute filter type</sld:Title>
        <sld:FeatureTypeName>Feature</sld:FeatureTypeName>
        <sld:SemanticTypeIdentifier>generic:geometry</sld:SemanticTypeIdentifier>
        <!-- Attribute filters -->
        <sld:Rule>
          <sld:Name>PropertyIsBetween</sld:Name>
          <sld:Title>PropertyIsBetween</sld:Title>
          <sld:Abstract>PropertyIsBetween</sld:Abstract>
          <ogc:Filter>
            <ogc:PropertyIsBetween>
              <ogc:PropertyName>AREA</ogc:PropertyName>
              <ogc:LowerBoundary>
                <ogc:Literal>1064866676</ogc:Literal>
              </ogc:LowerBoundary>
              <ogc:UpperBoundary>
                <ogc:Literal>1065512599</ogc:Literal>
              </ogc:UpperBoundary>
            </ogc:PropertyIsBetween>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">
                <ogc:Literal>blue</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

    <sld:UserStyle>
      <sld:Name>FeatureId</sld:Name>
      <sld:Title>Styler Test FeatureId</sld:Title>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <ogc:Filter>
            <ogc:FeatureId fid="tasmania_water_bodies.4"/>
          </ogc:Filter>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">blue</sld:CssParameter>
            </sld:Fill>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>

  </sld:NamedLayer>

  <sld:NamedLayer>
    <sld:Name>Roads</sld:Name>
    <sld:UserStyle>
      <sld:Name>RoadsDefault</sld:Name>
      <sld:IsDefault>1</sld:IsDefault>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:Name>justAStyler</sld:Name>
          <sld:LineSymbolizer>
            <sld:Stroke>
              <sld:CssParameter name="stroke">
                <ogc:Literal>red</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-width">
                <ogc:Literal>2</ogc:Literal>
              </sld:CssParameter>
            </sld:Stroke>
          </sld:LineSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>

  <sld:NamedLayer>
    <sld:Name>Cities</sld:Name>
    <sld:UserStyle>
      <sld:Name>DefaultCities</sld:Name>
      <sld:IsDefault>1</sld:IsDefault>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <ogc:Filter>
            <ogc:FeatureId fid="tasmania_cities.1"/>
          </ogc:Filter>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:ExternalGraphic>
                <sld:OnlineResource xlink:href="../img/marker.png" />
                <sld:Format>image/png</sld:Format>
              </sld:ExternalGraphic>
              <sld:Opacity>0.7</sld:Opacity>
              <sld:Size>14</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:ElseFilter/>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:Mark>
                <sld:WellKnownName>cross</sld:WellKnownName>
              </sld:Mark>
              <sld:Size>10</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>

  <sld:NamedLayer>
    <sld:Name>Land</sld:Name>
    <sld:UserStyle>
      <sld:Name>Land Style</sld:Name>
      <sld:IsDefault>1</sld:IsDefault>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:PolygonSymbolizer>
            <sld:Fill>
              <sld:CssParameter name="fill">#ccffaa</sld:CssParameter>
              <sld:CssParameter name="fill-opacity">
                <ogc:Literal>0.5</ogc:Literal>
              </sld:CssParameter>
            </sld:Fill>
            <sld:Stroke>
              <sld:CssParameter name="stroke">
                <ogc:Literal>#C0C0C0</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-opacity">
                <ogc:Literal>1</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-width">
                <ogc:Literal>1</ogc:Literal>
              </sld:CssParameter>
              <sld:CssParameter name="stroke-dasharray">
                <ogc:Literal>3 5 1 5</ogc:Literal>
              </sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>

  <sld:NamedLayer>
    <sld:Name>Hexagons</sld:Name>
    <sld:UserStyle>
      <sld:Name>Hexagons Style</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:Mark>
                <sld:WellKnownName>hexagon</sld:WellKnownName>
                <sld:Fill>
                  <sld:SvgParameter name="fill">#ffffff</sld:SvgParameter>
                </sld:Fill>
                <sld:Stroke>
                  <sld:SvgParameter name="stroke">#ff0000</sld:SvgParameter>
                  <sld:SvgParameter name="stroke-width">2</sld:SvgParameter>
                </sld:Stroke>
              </sld:Mark>
              <sld:Size>14</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
          <sld:PointSymbolizer>
            <sld:Graphic>
              <sld:Mark>
                <sld:WellKnownName>hexagon</sld:WellKnownName>
                <sld:Fill>
                  <sld:SvgParameter name="fill">#ff0000</sld:SvgParameter>
                </sld:Fill>
                <sld:Stroke>
                  <sld:SvgParameter name="stroke">#ff0000</sld:SvgParameter>
                  <sld:SvgParameter name="stroke-width">1</sld:SvgParameter>
                </sld:Stroke>
              </sld:Mark>
              <sld:Size>4</sld:Size>
            </sld:Graphic>
          </sld:PointSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>

</sld:StyledLayerDescriptor>

`;

export default sld;
