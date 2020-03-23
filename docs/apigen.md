## Modules

<dl>
<dt><a href="#module_Reader/filter">Reader/filter</a></dt>
<dd><p>Factory methods for filterelements</p>
</dd>
<dt><a href="#module_Reader/index">Reader/index</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
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

