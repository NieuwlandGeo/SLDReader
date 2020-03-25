## Modules

<dl>
<dt><a href="#module_Reader/filter">Reader/filter</a></dt>
<dd><p>Factory methods for filterelements</p>
</dd>
<dt><a href="#module_Reader/index">Reader/index</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#getGeometryStyles">getGeometryStyles(rules)</a> ⇒ <code><a href="#GeometryStyles">GeometryStyles</a></code></dt>
<dd><p>Get styling from rules per geometry type</p>
</dd>
<dt><a href="#createOlStyleFunction">createOlStyleFunction(featureTypeStyle, options)</a> ⇒ <code>function</code></dt>
<dd><p>Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.</p>
<p><strong>Important!</strong> When using externalGraphics for point styling, make sure to call .changed() on the layer
inside options.imageLoadedCallback to immediately see the loaded image. If you do not do this, the
image icon will only become visible the next time OpenLayers draws the layer (after pan or zoom).</p>
</dd>
<dt><a href="#getLayerNames">getLayerNames(sld)</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>get all layer names in sld</p>
</dd>
<dt><a href="#getLayer">getLayer(sld, [layername])</a> ⇒ <code><a href="#Layer">Layer</a></code></dt>
<dd><p>Get layer definition from sld</p>
</dd>
<dt><a href="#getStyleNames">getStyleNames(layer)</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>getStyleNames, notice name is not required for userstyle, you might get undefined</p>
</dd>
<dt><a href="#getStyle">getStyle(layer, [name])</a> ⇒ <code>object</code></dt>
<dd><p>get style from array layer.styles, if name is undefined it returns default style.
null is no style found</p>
</dd>
<dt><a href="#getRules">getRules(featureTypeStyle, feature, resolution)</a> ⇒ <code><a href="#Rule">Array.&lt;Rule&gt;</a></code></dt>
<dd><p>get rules for specific feature after applying filters</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#GeometryStyles">GeometryStyles</a></dt>
<dd><p>contains for each geometry type the symbolizer from an array of rules</p>
</dd>
<dt><a href="#Filter">Filter</a></dt>
<dd><p><a href="http://schemas.opengis.net/filter/1.1.0/filter.xsd">filter operators</a>, see also
<a href="http://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html">geoserver</a></p>
</dd>
<dt><a href="#StyledLayerDescriptor">StyledLayerDescriptor</a></dt>
<dd><p>a typedef for StyledLayerDescriptor <a href="http://schemas.opengis.net/sld/1.1/StyledLayerDescriptor.xsd">xsd</a></p>
</dd>
<dt><a href="#Layer">Layer</a></dt>
<dd><p>a typedef for Layer, the actual style object for a single layer</p>
</dd>
<dt><a href="#FeatureTypeStyle">FeatureTypeStyle</a></dt>
<dd><p>a typedef for FeatureTypeStyle: <a href="http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd">xsd</a></p>
</dd>
<dt><a href="#Rule">Rule</a></dt>
<dd><p>a typedef for Rule to match a feature: <a href="http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd">xsd</a></p>
</dd>
<dt><a href="#PolygonSymbolizer">PolygonSymbolizer</a></dt>
<dd><p>a typedef for <a href="http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd">PolygonSymbolizer</a>, see also
<a href="http://docs.geoserver.org/stable/en/user/styling/sld/reference/polygonsymbolizer.html">geoserver docs</a></p>
</dd>
<dt><a href="#LineSymbolizer">LineSymbolizer</a></dt>
<dd><p>a typedef for <a href="http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd">LineSymbolizer</a>, see also
<a href="http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#sld-reference-linesymbolizer">geoserver docs</a></p>
</dd>
<dt><a href="#PointSymbolizer">PointSymbolizer</a></dt>
<dd><p>a typedef for PointSymbolizer <a href="http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd">xsd</a>
&amp; <a href="http://docs.geoserver.org/latest/en/user/styling/sld/reference/pointsymbolizer.html">geoserver docs</a></p>
</dd>
</dl>

<a name="module_Reader/filter"></a>

## Reader/filter
Factory methods for filterelements

**See**: http://schemas.opengis.net/filter/1.0.0/filter.xsd  
<a name="exp_module_Reader/filter--module.exports"></a>

### module.exports(element) ⇒ [<code>Filter</code>](#Filter) ⏏
Factory root filter element

**Kind**: Exported function  

| Param | Type |
| --- | --- |
| element | <code>Element</code> | 

<a name="module_Reader/index"></a>

## Reader/index
<a name="exp_module_Reader/index--module.exports"></a>

### module.exports(sld) ⇒ [<code>StyledLayerDescriptor</code>](#StyledLayerDescriptor) ⏏
Creates a object from an sld xml string,

**Kind**: Exported function  
**Returns**: [<code>StyledLayerDescriptor</code>](#StyledLayerDescriptor) - object representing sld style  

| Param | Type | Description |
| --- | --- | --- |
| sld | <code>string</code> | xml string |

<a name="getGeometryStyles"></a>

## getGeometryStyles(rules) ⇒ [<code>GeometryStyles</code>](#GeometryStyles)
Get styling from rules per geometry type

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| rules | [<code>Array.&lt;Rule&gt;</code>](#Rule) | [description] |

<a name="createOlStyleFunction"></a>

## createOlStyleFunction(featureTypeStyle, options) ⇒ <code>function</code>
Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.

**Important!** When using externalGraphics for point styling, make sure to call .changed() on the layer
inside options.imageLoadedCallback to immediately see the loaded image. If you do not do this, the
image icon will only become visible the next time OpenLayers draws the layer (after pan or zoom).

**Kind**: global function  
**Returns**: <code>function</code> - A function that can be set as style function on an OpenLayers vector style layer.  

| Param | Type | Description |
| --- | --- | --- |
| featureTypeStyle | [<code>FeatureTypeStyle</code>](#FeatureTypeStyle) | Feature Type Style object. |
| options | <code>object</code> | Options |
| options.convertResolution | <code>function</code> | An optional function to convert the resolution in map units/pixel to resolution in meters/pixel. When not given, the map resolution is used as-is. |
| options.imageLoadedCallback | <code>function</code> | Optional callback that will be called with the url of an externalGraphic when an image has been loaded (successfully or not). Call .changed() inside the callback on the layer to see the loaded image. |

**Example**  
```js
myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
  imageLoadedCallback: () => { myOlVectorLayer.changed(); }
}));
```
<a name="getLayerNames"></a>

## getLayerNames(sld) ⇒ <code>Array.&lt;string&gt;</code>
get all layer names in sld

**Kind**: global function  
**Returns**: <code>Array.&lt;string&gt;</code> - registered layernames  

| Param | Type |
| --- | --- |
| sld | [<code>StyledLayerDescriptor</code>](#StyledLayerDescriptor) | 

<a name="getLayer"></a>

## getLayer(sld, [layername]) ⇒ [<code>Layer</code>](#Layer)
Get layer definition from sld

**Kind**: global function  
**Returns**: [<code>Layer</code>](#Layer) - [description]  

| Param | Type | Description |
| --- | --- | --- |
| sld | [<code>StyledLayerDescriptor</code>](#StyledLayerDescriptor) | [description] |
| [layername] | <code>string</code> | optional layername |

<a name="getStyleNames"></a>

## getStyleNames(layer) ⇒ <code>Array.&lt;string&gt;</code>
getStyleNames, notice name is not required for userstyle, you might get undefined

**Kind**: global function  
**Returns**: <code>Array.&lt;string&gt;</code> - [description]  

| Param | Type | Description |
| --- | --- | --- |
| layer | [<code>Layer</code>](#Layer) | [description] |

<a name="getStyle"></a>

## getStyle(layer, [name]) ⇒ <code>object</code>
get style from array layer.styles, if name is undefined it returns default style.
null is no style found

**Kind**: global function  
**Returns**: <code>object</code> - the style from layer.styles matching the name  

| Param | Type | Description |
| --- | --- | --- |
| layer | [<code>Layer</code>](#Layer) | [description] |
| [name] | <code>string</code> | of style |

<a name="getRules"></a>

## getRules(featureTypeStyle, feature, resolution) ⇒ [<code>Array.&lt;Rule&gt;</code>](#Rule)
get rules for specific feature after applying filters

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| featureTypeStyle | [<code>FeatureTypeStyle</code>](#FeatureTypeStyle) |  |
| feature | <code>object</code> | geojson |
| resolution | <code>number</code> | m/px |
| options.getProperty | <code>function</code> | An optional function with parameters (feature, propertyName) that can be used to extract a property value from a feature. When not given, properties are read from feature.properties directly.Error |
| options.getFeatureId | <code>function</code> | An optional function to extract the feature id from a feature.Error When not given, feature id is read from feature.id. |

**Example**  
```js
const style = getStyle(sldLayer, stylename);
getRules(style.featuretypestyles['0'], geojson, resolution);
```
<a name="GeometryStyles"></a>

## GeometryStyles
contains for each geometry type the symbolizer from an array of rules

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| polygon | [<code>Array.&lt;PolygonSymbolizer&gt;</code>](#PolygonSymbolizer) | polygonsymbolizers |
| line | [<code>Array.&lt;LineSymbolizer&gt;</code>](#LineSymbolizer) | linesymbolizers |
| point | [<code>Array.&lt;PointSymbolizer&gt;</code>](#PointSymbolizer) | pointsymbolizers, same as graphic prop from PointSymbolizer |

<a name="Filter"></a>

## Filter
[filter operators](http://schemas.opengis.net/filter/1.1.0/filter.xsd), see also
[geoserver](http://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | Can be 'comparison', 'and', 'or', 'not', or 'featureid'. |
| [fids] | <code>Array.&lt;string&gt;</code> | An array of feature id's. Required for type='featureid'. |
| [operator] | <code>string</code> | Required for type='comparison'. Can be one of 'propertyisequalto', 'propertyisnotequalto', 'propertyislessthan', 'propertyislessthanorequalto', 'propertyisgreaterthan', 'propertyisgreaterthanorequalto', 'propertyislike', 'propertyisbetween' |
| [predicates] | [<code>Array.&lt;Filter&gt;</code>](#Filter) | Required for type='and' or type='or'. An array of filter predicates that must all evaluate to true for 'and', or for which at least one must evaluate to true for 'or'. |
| [predicate] | [<code>Filter</code>](#Filter) | Required for type='not'. A single predicate to negate. |
| [propertyname] | <code>string</code> | Required for type='comparison'. |
| [literal] | <code>string</code> | A literal value to use in a comparison, required for type='comparison'. |
| [lowerboundary] | <code>string</code> | Lower boundary, required for operator='propertyisbetween'. |
| [upperboundary] | <code>string</code> | Upper boundary, required for operator='propertyisbetween'. |
| [wildcard] | <code>string</code> | Required wildcard character for operator='propertyislike'. |
| [singlechar] | <code>string</code> | Required single char match character, required for operator='propertyislike'. |
| [escapechar] | <code>string</code> | Required escape character for operator='propertyislike'. |

<a name="StyledLayerDescriptor"></a>

## StyledLayerDescriptor
a typedef for StyledLayerDescriptor [xsd](http://schemas.opengis.net/sld/1.1/StyledLayerDescriptor.xsd)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| version | <code>string</code> | sld version |
| layers | [<code>Array.&lt;Layer&gt;</code>](#Layer) | info extracted from NamedLayer element |

<a name="Layer"></a>

## Layer
a typedef for Layer, the actual style object for a single layer

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | layer name |
| styles | <code>Array.&lt;Object&gt;</code> | See explanation at [Geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/styles.html) |
| styles[].default | <code>Boolean</code> |  |
| [styles[].name] | <code>String</code> |  |
| styles[].featuretypestyles | [<code>Array.&lt;FeatureTypeStyle&gt;</code>](#FeatureTypeStyle) | Geoserver will draw multiple, libraries as openlayers can only use one definition! |

<a name="FeatureTypeStyle"></a>

## FeatureTypeStyle
a typedef for FeatureTypeStyle: [xsd](http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd)

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| rules | [<code>Array.&lt;Rule&gt;</code>](#Rule) | 

<a name="Rule"></a>

## Rule
a typedef for Rule to match a feature: [xsd](http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | rule name |
| [filter] | [<code>Array.&lt;Filter&gt;</code>](#Filter) |  |
| [elsefilter] | <code>boolean</code> |  |
| [minscaledenominator] | <code>integer</code> |  |
| [maxscaledenominator] | <code>integer</code> |  |
| [polygonsymbolizer] | [<code>PolygonSymbolizer</code>](#PolygonSymbolizer) |  |
| [linesymbolizer] | [<code>LineSymbolizer</code>](#LineSymbolizer) |  |
| [pointsymbolizer] | [<code>PointSymbolizer</code>](#PointSymbolizer) |  |

<a name="PolygonSymbolizer"></a>

## PolygonSymbolizer
a typedef for [PolygonSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also
[geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/polygonsymbolizer.html)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| fill | <code>Object</code> |  |
| fill.css | <code>array</code> | one object per CssParameter with props name (camelcased) & value |
| stroke | <code>Object</code> |  |
| stroke.css | <code>Array.&lt;Object&gt;</code> | with camelcased name & value |

<a name="LineSymbolizer"></a>

## LineSymbolizer
a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also
[geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#sld-reference-linesymbolizer)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| stroke | <code>Object</code> |  |
| stroke.css | <code>Array.&lt;Object&gt;</code> | one object per CssParameter with props name (camelcased) & value |

<a name="PointSymbolizer"></a>

## PointSymbolizer
a typedef for PointSymbolizer [xsd](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
& [geoserver docs](http://docs.geoserver.org/latest/en/user/styling/sld/reference/pointsymbolizer.html)

**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| graphic | <code>Object</code> | 
| graphic.externalgraphic | <code>Object</code> | 
| graphic.externalgraphic.onlineresource | <code>string</code> | 
| graphic.mark | <code>Object</code> | 
| graphic.mark.wellknownname | <code>string</code> | 
| graphic.mark.fill | <code>Object</code> | 
| graphic.mark.stroke | <code>Object</code> | 
| graphic.opacity | <code>Number</code> | 
| graphic.size | <code>Number</code> | 
| graphic.rotation | <code>Number</code> | 

