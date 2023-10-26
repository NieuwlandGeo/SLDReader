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
<dt><a href="#categorizeSymbolizers">categorizeSymbolizers(rules)</a> ⇒ <code><a href="#CategorizedSymbolizers">CategorizedSymbolizers</a></code></dt>
<dd><p>Get styling from rules per geometry type</p>
</dd>
<dt><a href="#registerFunction">registerFunction(functionName, implementation)</a></dt>
<dd><p>Register a function implementation by name. When evaluating the function, it will be called
with the values of the parameter elements evaluated for a single feature.
If the function returns null, the fallback value given in the SLD function element will be used instead.</p>
<p>Note: take care of these possible gotcha&#39;s in the function implementation.</p>
<ul>
<li>The function will be called with the number of parameters given in the SLD function element.
This number can be different from the expected number of arguments.</li>
<li>Try to avoid throwing errors from the function implementation and return null if possible.</li>
<li>Literal values will always be provided as strings. Convert numeric parameters to numbers yourself.</li>
<li>Geometry valued parameters will be provided as OpenLayers geometry instances. Do not mutate these!</li>
</ul>
</dd>
<dt><a href="#getFunction">getFunction(functionName)</a> ⇒ <code>function</code></dt>
<dd><p>Get a function implementation by name.</p>
</dd>
<dt><a href="#clearFunctionCache">clearFunctionCache()</a></dt>
<dd><p>Clear the function cache.</p>
</dd>
<dt><a href="#createOlStyleFunction">createOlStyleFunction(featureTypeStyle, options)</a> ⇒ <code>function</code></dt>
<dd><p>Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.</p>
<p><strong>Important!</strong> When using externalGraphics for point styling, make sure to call .changed() on the layer
inside options.imageLoadedCallback to immediately see the loaded image. If you do not do this, the
image icon will only become visible the next time OpenLayers draws the layer (after pan or zoom).</p>
</dd>
<dt><a href="#createOlStyle">createOlStyle(styleRule, geometryType)</a> ⇒ <code>Array.&lt;ol.Style&gt;</code></dt>
<dd><p>Create an array of OpenLayers style instances for features with the chosen geometry type from a style rule.
Since this function creates a static OpenLayers style and not a style function,
usage of this function is only suitable for simple symbolizers that do not depend on feature properties
and do not contain external graphics. External graphic marks will be shown as a grey circle instead.</p>
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
<dt><a href="#getRuleSymbolizers">getRuleSymbolizers(rule)</a> ⇒ <code>Array.&lt;object&gt;</code></dt>
<dd><p>Get all symbolizers inside a given rule.
Note: this will be a mix of Point/Line/Polygon/Text symbolizers.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#CategorizedSymbolizers">CategorizedSymbolizers</a></dt>
<dd><p>contains for each geometry type the symbolizer from an array of rules</p>
</dd>
<dt><a href="#Expression">Expression</a></dt>
<dd><p>Modeled after <a href="https://schemas.opengis.net/se/1.1.0/Symbolizer.xsd">SvgParameterType</a>.
Can be either a primitive value (string,integer,boolean), or an object with these properties:</p>
</dd>
<dt><a href="#Filter">Filter</a></dt>
<dd><p><a href="https://schemas.opengis.net/filter/2.0/filter.xsd">filter operators</a>, see also
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

<a name="categorizeSymbolizers"></a>

## categorizeSymbolizers(rules) ⇒ [<code>CategorizedSymbolizers</code>](#CategorizedSymbolizers)
Get styling from rules per geometry type

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| rules | [<code>Array.&lt;Rule&gt;</code>](#Rule) | [description] |

<a name="registerFunction"></a>

## registerFunction(functionName, implementation)
Register a function implementation by name. When evaluating the function, it will be calledwith the values of the parameter elements evaluated for a single feature.If the function returns null, the fallback value given in the SLD function element will be used instead.Note: take care of these possible gotcha's in the function implementation.* The function will be called with the number of parameters given in the SLD function element.  This number can be different from the expected number of arguments.* Try to avoid throwing errors from the function implementation and return null if possible.* Literal values will always be provided as strings. Convert numeric parameters to numbers yourself.* Geometry valued parameters will be provided as OpenLayers geometry instances. Do not mutate these!

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| functionName | <code>string</code> | Function name. |
| implementation | <code>function</code> | The function implementation. |

<a name="getFunction"></a>

## getFunction(functionName) ⇒ <code>function</code>
Get a function implementation by name.

**Kind**: global function  
**Returns**: <code>function</code> - The function implementation, or null if no function with the givenname has been registered yet.  

| Param | Type | Description |
| --- | --- | --- |
| functionName | <code>string</code> | Function name. |

<a name="clearFunctionCache"></a>

## clearFunctionCache()
Clear the function cache.

**Kind**: global function  
<a name="createOlStyleFunction"></a>

## createOlStyleFunction(featureTypeStyle, options) ⇒ <code>function</code>
Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.**Important!** When using externalGraphics for point styling, make sure to call .changed() on the layerinside options.imageLoadedCallback to immediately see the loaded image. If you do not do this, theimage icon will only become visible the next time OpenLayers draws the layer (after pan or zoom).

**Kind**: global function  
**Returns**: <code>function</code> - A function that can be set as style function on an OpenLayers vector style layer.  

| Param | Type | Description |
| --- | --- | --- |
| featureTypeStyle | [<code>FeatureTypeStyle</code>](#FeatureTypeStyle) | Feature Type Style object. |
| options | <code>object</code> | Options |
| options.convertResolution | <code>function</code> | An optional function to convert the resolution in map units/pixel to resolution in meters/pixel. When not given, the map resolution is used as-is. |
| options.imageLoadedCallback | <code>function</code> | Optional callback that will be called with the url of an externalGraphic when an image has been loaded (successfully or not). Call .changed() inside the callback on the layer to see the loaded image. |
| options.getProperty | <code>function</code> | Optional custom property getter: (feature, propertyName) => property value. |

**Example**  
```js
myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {  imageLoadedCallback: () => { myOlVectorLayer.changed(); }}));
```
<a name="createOlStyle"></a>

## createOlStyle(styleRule, geometryType) ⇒ <code>Array.&lt;ol.Style&gt;</code>
Create an array of OpenLayers style instances for features with the chosen geometry type from a style rule.Since this function creates a static OpenLayers style and not a style function,usage of this function is only suitable for simple symbolizers that do not depend on feature propertiesand do not contain external graphics. External graphic marks will be shown as a grey circle instead.

**Kind**: global function  
**Returns**: <code>Array.&lt;ol.Style&gt;</code> - An array of OpenLayers style instances.  

| Param | Type | Description |
| --- | --- | --- |
| styleRule | <code>StyleRule</code> | Feature Type Style Rule object. |
| geometryType | <code>string</code> | One of 'Point', 'LineString' or 'Polygon' |

**Example**  
```js
myOlVectorLayer.setStyle(SLDReader.createOlStyle(featureTypeStyle.rules[0], 'Point');
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
get style from array layer.styles, if name is undefined it returns default style.null is no style found

**Kind**: global function  
**Returns**: <code>object</code> - the style from layer.styles matching the name  

| Param | Type | Description |
| --- | --- | --- |
| layer | [<code>Layer</code>](#Layer) | [description] |
| [name] | <code>string</code> | of style. If not given, the style marked as default will be returned. If there is no default style, the first one will be returned. |

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
const style = getStyle(sldLayer, stylename);getRules(style.featuretypestyles['0'], geojson, resolution);
```
<a name="getRuleSymbolizers"></a>

## getRuleSymbolizers(rule) ⇒ <code>Array.&lt;object&gt;</code>
Get all symbolizers inside a given rule.Note: this will be a mix of Point/Line/Polygon/Text symbolizers.

**Kind**: global function  
**Returns**: <code>Array.&lt;object&gt;</code> - Array of all symbolizers in a rule.  

| Param | Type | Description |
| --- | --- | --- |
| rule | <code>object</code> | SLD rule object. |

<a name="CategorizedSymbolizers"></a>

## CategorizedSymbolizers
contains for each geometry type the symbolizer from an array of rules

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| polygonSymbolizers | [<code>Array.&lt;PolygonSymbolizer&gt;</code>](#PolygonSymbolizer) | polygonsymbolizers |
| lineSymbolizers | [<code>Array.&lt;LineSymbolizer&gt;</code>](#LineSymbolizer) | linesymbolizers |
| pointSymbolizers | [<code>Array.&lt;PointSymbolizer&gt;</code>](#PointSymbolizer) | pointsymbolizers, same as graphic prop from PointSymbolizer |
| textSymbolizers | <code>Array.&lt;TextSymbolizer&gt;</code> | textsymbolizers |

<a name="Expression"></a>

## Expression
Modeled after [SvgParameterType](https://schemas.opengis.net/se/1.1.0/Symbolizer.xsd).Can be either a primitive value (string,integer,boolean), or an object with these properties:

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | One of 'literal', 'propertyname', or 'function'. |
| [typeHint] | <code>string</code> | Optional type hint, used when evaluating the expression. Defaults to 'string'. Can be 'number'. |
| [value] | <code>any</code> | The primitive type representing the value of a literal expresion, or a string representing the name of a propertyname expression . |
| [name] | <code>string</code> | Required for function expressions. Contains the function name. |
| [fallbackValue] | <code>any</code> | Optional fallback value when function evaluation returns null. |
| [params] | [<code>Array.&lt;Expression&gt;</code>](#Expression) | Required array of function parameters for function expressions. |

<a name="Filter"></a>

## Filter
[filter operators](https://schemas.opengis.net/filter/2.0/filter.xsd), see also[geoserver](http://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | Can be 'comparison', 'and', 'or', 'not', or 'featureid'. |
| [fids] | <code>Array.&lt;string&gt;</code> | An array of feature id's. Required for type='featureid'. |
| [operator] | <code>string</code> | Required for type='comparison'. Can be one of 'propertyisequalto', 'propertyisnotequalto', 'propertyislessthan', 'propertyislessthanorequalto', 'propertyisgreaterthan', 'propertyisgreaterthanorequalto', 'propertyislike', 'propertyisbetween' 'propertyisnull' |
| [predicates] | [<code>Array.&lt;Filter&gt;</code>](#Filter) | Required for type='and' or type='or'. An array of filter predicates that must all evaluate to true for 'and', or for which at least one must evaluate to true for 'or'. |
| [predicate] | [<code>Filter</code>](#Filter) | Required for type='not'. A single predicate to negate. |
| [expression1] | [<code>Expression</code>](#Expression) | First expression required for boolean comparison filters. |
| [expression2] | [<code>Expression</code>](#Expression) | Second expression required for boolean comparison filters. |
| [expression] | [<code>Expression</code>](#Expression) | Expression required for unary comparison filters. |
| [lowerboundary] | [<code>Expression</code>](#Expression) | Lower boundary expression, required for operator='propertyisbetween'. |
| [upperboundary] | [<code>Expression</code>](#Expression) | Upper boundary expression, required for operator='propertyisbetween'. |
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
| [filter] | [<code>Filter</code>](#Filter) | Optional filter expression for the rule. |
| [elsefilter] | <code>boolean</code> | Set this to true when rule has no filter expression to catch everything not passing any other filter. |
| [minscaledenominator] | <code>integer</code> |  |
| [maxscaledenominator] | <code>integer</code> |  |
| [polygonsymbolizer] | [<code>PolygonSymbolizer</code>](#PolygonSymbolizer) |  |
| [linesymbolizer] | [<code>LineSymbolizer</code>](#LineSymbolizer) |  |
| [pointsymbolizer] | [<code>PointSymbolizer</code>](#PointSymbolizer) |  |

<a name="PolygonSymbolizer"></a>

## PolygonSymbolizer
a typedef for [PolygonSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also[geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/polygonsymbolizer.html)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| fill | <code>Object</code> |  |
| fill.styling | [<code>Object.&lt;Expression&gt;</code>](#Expression) | one object per SvgParameter with props name (camelCased) |
| stroke | <code>Object</code> |  |
| stroke.styling | [<code>Object.&lt;Expression&gt;</code>](#Expression) | with camelcased name & value |

<a name="LineSymbolizer"></a>

## LineSymbolizer
a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also[geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#sld-reference-linesymbolizer)

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| stroke | <code>Object</code> |  |
| stroke.styling | [<code>Object.&lt;Expression&gt;</code>](#Expression) | one object per SvgParameter with props name (camelCased) |
| graphicstroke | <code>Object</code> |  |
| graphicstroke.graphic | <code>Object</code> |  |
| graphicstroke.graphic.mark | <code>Object</code> |  |
| graphicstroke.graphic.mark.wellknownname | <code>string</code> |  |
| graphicstroke.graphic.mark.fill | <code>Object</code> |  |
| graphicstroke.graphic.mark.stroke | <code>Object</code> |  |
| graphicstroke.graphic.opacity | <code>Number</code> |  |
| graphicstroke.graphic.size | <code>Number</code> |  |
| graphicstroke.graphic.rotation | <code>Number</code> |  |

<a name="PointSymbolizer"></a>

## PointSymbolizer
a typedef for PointSymbolizer [xsd](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)& [geoserver docs](http://docs.geoserver.org/latest/en/user/styling/sld/reference/pointsymbolizer.html)

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
| graphic.size | [<code>Expression</code>](#Expression) | 
| graphic.rotation | [<code>Expression</code>](#Expression) | 

