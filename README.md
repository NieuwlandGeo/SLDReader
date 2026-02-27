# SLDReader

[![npm version](https://badge.fury.io/js/%40nieuwlandgeo%2Fsldreader.svg)](https://badge.fury.io/js/%40nieuwlandgeo%2Fsldreader)

[Live demos](https://nieuwlandgeo.github.io/SLDReader)

A javascript package that aims to bring styling from a [sld document](http://www.opengeospatial.org/standards/sld) to popular mapping
tools. The project consists of two parts:

- An SLDReader that parses an SLD document into a style object.
- A function createOlStyleFunction that converts the parsed style object into a function that you can use in OpenLayers to style features.

The OpenLayers style converter tries to be as efficient as possible by recycling OpenLayers Style instances whenever possible.

**CONTRIBUTIONS WELCOME!**

More information about the standards:

- [Symbology](http://www.opengeospatial.org/standards/symbol/)
- [SLD](http://www.opengeospatial.org/standards/sld)

## Examples

See docs/examples folder, to serve them locally

```
npm start
```

## Api docs

[Api docs](https://nieuwlandgeo.github.io/SLDReader/api.html)

## Requirements

- Most SLDReader functions work from OpenLayers v6.15 or higher.
- OpenLayers version 8.3.0 or higher required to use `GraphicStroke` symbolizers without visual artefacts.
- OpenLayers version 10.8.0 is required for custom `Mark` symbols and perpendicular stroke offsets.
- An up-to date browser. If you need to support older browsers, you have to compile SLDReader yourself with a different `browserslist` setting in `package.json`.
  - The browsers supported by SLDReader can be found here: https://browsersl.ist/#q=defaults .
- If you want to build and/or run SLDReader, NodeJS v18.18 or higher is required.

## Restrictions on supported SLD Features

The SLDReader library can read both SLD v1.0 and SLD v1.1 documents, but not every part of the SLD standard is (or can be) implemented by the SLDReader and OpenLayers style converter (yet).

### Symbolizers

#### PointSymbolizer

Marks with well known symbol names are supported: circle, square, triangle, star, cross, x, hexagon, octagon. ExternalGraphic icons are supported.

Two custom marks are also supported: `horline` for a horizontal line through the center and `backslash` for a line from the top left to the bottom right. Use backslash instead of horline if you want to have diagonal hashing as a polygon graphic fill.

Wellknown names that reference a symbol library, like `ttf://CustomFont#42` are not supported. The Size and Rotation elements may be dynamic by using the PropertyName element.

Only one Graphic per PointSymbolizer is supported. Each Graphic can only have one Mark or one ExternalGraphic.

Some vendor-specific marks (GeoServer, QGIS) are also supported, see the [Mark Gallery demo page](https://nieuwlandgeo.github.io/SLDReader/mark-gallery.html). _Note:_ for full custom symbol support you need to use OpenLayers v10.3.0 or higher.

#### ExternalGraphic

External graphics can be used with an `OnlineResource` linking to a valid image url.

```xml
<se:ExternalGraphic>
  <se:OnlineResource xlink:type="simple" xlink:href="assets/img/flag-nl.png"/>
  <se:Format>image/png</se:Format>
</se:ExternalGraphic>
```

A valid image url can also be a base64 url:

```xml
<se:ExternalGraphic>
  <se:OnlineResource xlink:type="simple" xlink:href="data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="/>
  <se:Format>image/jpeg</se:Format>
</se:ExternalGraphic>
```

Instead of using base64 urls inside an `OnlineResource`, external graphics can also be embedded as base64 string using `InlineContent` with `encoding="base64"`.

```xml
<se:ExternalGraphic>
  <se:InlineContent encoding="base64">iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==</se:InlineContent>
  <se:Format>image/jpeg</se:Format>
</se:ExternalGraphic>
```

Inline content can also be SVG with `encoding="xml"`.

```xml
<se:ExternalGraphic>
  <se:InlineContent encoding="xml">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <path d="M50,3l12,36h38l-30,22l11,36l-31-21l-31,21l11-36l-30-22h38z" fill="#0F0" stroke="#040" stroke-width="2"/>
    </svg>
  </se:InlineContent>
  <se:Format>image/svg+xml</se:Format>
</se:ExternalGraphic>
```

**Important notes:**

- SLDReader does not support `ColorReplacement` inside `ExternalGraphic`s.
- Do not include the `<?xml ... ?>` header for inline SVG content.
- Make sure that inline SVG has `width` and `height` attributes. Without it, (most?) browsers cannot properly load the SVG as an image.

#### QGIS parametric SVG support (experimental)

SLD's with parametric embedded SVG's exported by QGIS should be able to be used in SLDReader.

Support for this functionality is quite hacky and experimental, but appears to work for simple examples.

#### Custom mark symbols

It's possible to register your own symbols under your own `WellKnownName`.

Custom symbol coordinates must be entered in counterclockwise order and must all lie within a `[-1, -1, 1, 1]` bounding box.
The coordinates will be scaled by the symbol `<Size>` parameter.

Example (see the [Mark Gallery demo page](https://nieuwlandgeo.github.io/SLDReader/mark-gallery.html)):

```javascript
SLDReader.registerCustomSymbol('crystal', [
  [0.5, 0],
  [0.75, 0.75],
  [0, 0.5],
  [-1, 1],
  [-0.5, 0],
  [-0.75, -0.75],
  [0, -0.5],
  [1, -1],
]);
```

```xml
<se:PointSymbolizer>
  <se:Graphic>
    <se:Mark>
      <se:WellKnownName>crystal</se:WellKnownName>
      <!-- ...etc... -->
```

Note: OpenLayers v10.3.0 or higher is required to use the custom symbol functionality. On lower versions, a square is displayed instead.

#### Font symbols
In SLD, it's possible to use a font symbol by supplying an onlineresource that points to a (TTF) font file, together with an index pointing towards a single character within the font file.

Example (renders a spider on systems that have the Webdings font installed):
```xml
<se:PointSymbolizer>
  <se:Graphic>
    <se:Mark>
      <se:OnlineResource xlink:href="ttf://Webdings" xlink:type="simple"/>
      <se:Format>ttf</se:Format>
      <se:MarkIndex>33</se:MarkIndex>
      <se:Fill>
        <se:SvgParameter name="fill">#FF0000</se:SvgParameter>
      </se:Fill>
      <se:Stroke>
        <se:SvgParameter name="stroke-width">3</se:SvgParameter>
        <se:SvgParameter name="stroke">#0000FF</se:SvgParameter>
      </se:Stroke>
    </se:Mark>
    <se:Size>32</se:Size>
  </se:Graphic>
</se:PointSymbolizer>
```

SLDReader also supports the Geoserver font symbol shorthand, by pointing to a symbol within the wellknownname.

Example (the equivalent of the example above):
```xml
<se:PointSymbolizer>
  <se:Graphic>
    <se:Mark>
      <se:WellKnownName>ttf://Webdings#0x0021</se:WellKnownName>
      <!-- fill,stroke,size etc.. -->
  </se:Graphic>
</se:PointSymbolizer>
```

This is useful for server-side rendering where the font file can be accessed on the file system, but presents a problem when rendering font symbols on the web. SLDReader solves this by ignoring the `ttf://` prefix and/or format, and extracts the font family from the onlineresource or geoserver ttf:// wellknownname.

Upon parsing, marks using a font symbol are converted to textsymbolizers with a single character with a char code corresponding to the font symbol index.

For example, the spider font symbol above will become the following text symbolizer in SLDReader:
```javascript
{
  "label": "!", // Character code 0x21 (or 33 as integer).
  "font": {
    "styling": {
      "fontFamily": "Webdings",
      "fontSize": 32
    }
  },
  // other style props omitted for brevity.
}
```

#### Making the font family accessible in your web page for SLDReader
When using fonts that are globally available, you can just use the font family (like Webdings), and it will work. But since SLDReader cannot access the file system, you must make sure that the font family is declared within css or an (inline) `<style>` element. If you do not do this, the text symbol will just be the single character label in the default system font.

Example: IMKL custom symbols.
IMKL is a dutch information model (IM) for cables ((K)abels) and pipes ((L)eidingen). This uses a custom font that needs to be declared in css as follows:
```css
@font-face {
  font-family: 'IMKLIcons';
  src: url("https://register.geostandaarden.nl/symbool/imkl/3.0.0rc2/font/IMKLIcons-Regular.ttf")format("truetype");
}
```

After declaring this custom font in your css, or inline style, you can use symbols by referring them by the font-family declared above.

Try it out on the 'Custom GeoJSON styling' demo page.

```xml
<se:PointSymbolizer>
  <se:Graphic>
    <se:Mark>
      <se:OnlineResource xlink:href="ttf://IMKLIcons" xlink:type="simple"/>
      <se:Format>ttf</se:Format>
      <se:MarkIndex>120</se:MarkIndex>
      <se:Fill>
        <se:SvgParameter name="fill">#008800</se:SvgParameter>
      </se:Fill>
      <se:Stroke>
        <se:SvgParameter name="stroke-width">2</se:SvgParameter>
        <se:SvgParameter name="stroke">#224422</se:SvgParameter>
      </se:Stroke>
    </se:Mark>
    <se:Size>32</se:Size>
  </se:Graphic>
</se:PointSymbolizer>
```

#### LineSymbolizer

Only these svg-parameters are supported:

- stroke
- stroke-width
- stroke-opacity
- stroke-linejoin
- stroke-linecap
- stroke-dasharray
- stroke-dashoffset

GraphicStroke with Mark or ExternalGraphic is mostly supported.

GraphicFills are not supported on LineSymbolizers.

#### Note about GraphicStroke

- It's not possible to use property-dependent values inside a GraphicStroke symbolizer.
- ExternalGraphic is mostly supported with these caveats:
  - Always add a Size-element, even if using an ExternalGraphic instead of a Mark.
  - SLD V1.0.0 does not officially support the Gap property. For this, SLDReader implements the same workaround that Geoserver uses. You can use the `stroke-dasharray` parameter to add a gap between stroke marks. To do this, use a dash array with two parameters: the first parameter being the size of the graphic and the second being the gap size. See the " GraphicStroke: ExternalGraphic" example.
- It is not possible to combine a GraphicStroke with a PerpendicularOffset.

#### GraphicStroke vendor options

The following QGIS vendor options are supported on line symbolizers with a graphic stroke:

- `<VendorOption name="placement">firstPoint</VendorOption>`
- `<VendorOption name="placement">lastPoint</VendorOption>`

See the demo page for an example.

#### PolygonSymbolizer

Polygons with static fill and stroke style parameters are supported. See LineSymbolizer above for supported properties for the polygon outline.

For polygon graphic fills, both ExternalGraphic and Mark graphic fills are supported. The Marks supported here are the same as for a point symbolizer, with the additional restriction that feature-dependent value cannot be used.

The following WellKnownNames used by QGIS simple fills can be used as well:

- x
- cross
- line
- horline
- slash
- backslash
- brush://dense1 (till dense7)

**Note:** It's not possible to use property-dependent values for inside a GraphicFill element.

#### TextSymbolizer

Dynamic Labels (with PropertyName elements), Font and Halo are supported. No vendor-specific options are supported. LabelPlacement or PointPlacement are supported. Graphic elements to display behind the label text are not supported.

- For PointPlacement, Displacement is supported<sup>1</sup>.
- For PointPlacement, Rotation is supported<sup>1</sup>. PropertyName as rotation value is supported.
- For PointPlacement, AnchorPoint is partially supported. Since OpenLayers does not support fractional anchor points, the label anchor is snapped to the alignment closest to left/right/top/bottom/center alignment. For instance: an `AnchorPointX` of 0.1 is snapped to 0, corresponding to left alignment in OpenLayers.
- For LinePlacement, PerpendicularOffset is not supported.

[1]: according to the SLD-spec, label rotation takes place before displacement, but OpenLayers applies displacement before rotation. Beware when combining rotation and displacement inside a single text symbolizer.

#### Perpendicular Offset

Both LineSymbolizer and PolygonSymbolizer can use a PerpendicularOffset, for example

```xml
<se:LineSymbolizer>
  <se:Stroke>
    <se:SvgParameter name="stroke">#FF0000</se:SvgParameter>
  </se:Stroke>
  <se:PerpendicularOffset>12</se:PerpendicularOffset>
</se:LineSymbolizer>
```

For line symbolizers, a positive offset displaces the stroke towards the left of the line.
For polygon symbolizers, a positive offset displaces the stroke outwards.
Offsets are in pixels by default, but will use the units of measure defined on a symbolizer.

Note: it's unfortunately not possible to apply a perpendicular offset to a symbolizer using a GraphicStroke.

### Dynamic parameter values

According to the SLD spec, most values can be mixed type (a combination of plain text and [Filter expressions](https://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html#sld-filter-expression)). This means that most values can depend on feature properties.

SLDReader supports dynamic values in these cases:

- PointSymbolizer Size
- PointSymbolizer Rotation
- TextSymbolizer Label
- SvgParameters used for styling:
  - `stroke`
  - `stroke-opacity`
  - `stroke-width`
  - `fill`
  - `fill-opacity`
  - `font-family`
  - `font-style`
  - `font-weight`
  - `font-size`

**Note:** dynamic parameter values currently have no effect on Marks used inside GraphicStroke or GraphicFill and will use SLD defaults instead.

### Arithmetic operators

Operators `Add`, `Sub`, `Mul`, and `Div` are implemented by converting them to function expressions.

### Units of measure

The following units of measure are supported on symbolizers, as `uom` attribute:

```
http://www.opengeospatial.org/se/units/pixel
http://www.opengeospatial.org/se/units/metre
http://www.opengeospatial.org/se/units/foot
```

Values can be forced to pixels by appending px:

```xml
<se:PointSymbolizer uom="http://www.opengeospatial.org/se/units/metre">
  <se:Graphic>
    <se:Mark>
      <se:WellKnownName>circle</se:WellKnownName>
      <se:Fill>
        <se:SvgParameter name="fill">#88aa88</se:SvgParameter>
      </se:Fill>
      <se:Stroke>
        <se:SvgParameter name="stroke">#004000</se:SvgParameter>
        <!-- Override symbolizer uom with pixels by appending px to the value. -->
        <se:SvgParameter name="stroke-width">2px</se:SvgParameter>
      </se:Stroke>
    </se:Mark>
    <se:Size>10</se:Size> <!-- in metres, as per uom attribute -->
  </se:Graphic>
</se:PointSymbolizer>
```

**Restrictions:**

- Units of measure are not supported for `GraphicStroke` and `GraphicFill`.
- Units of measure are not supported on `stroke-dasharray`.
- Units of measure are not supported within or as return value of `Function` elements. The return type of `Functions` is always treated as dimensionless or pixels, depending on context.
- Values will always be treated as pixels where units of measure are not supported.

#### Important remark about resolution

When converting metres (or feet) to pixels, SLDReader assumes that the resolution passed to the style function by OpenLayers is in `metres/pixel`. This is only true for some map projections. If you care about (approximately) correct sizes in metres, you have to pass a function that calculate the true point resolution in metres per pixel from the view resolution.

See the `convertResolution` option in the API example [here](https://nieuwlandgeo.github.io/SLDReader/api.html#applying-an-sld-to-a-layer-as-a-style-function).

### Geometry element

The use of a Geometry element to point to a different geometry property on a feature to use for styling is not supported.

### Filter comparisons

The SLDReader library supports the following operators inside Filter elements:

- PropertyIsEqualTo
- PropertyIsNotEqualTo
- PropertyIsLessThan
- PropertyIsLessThanOrEqualTo
- PropertyIsGreaterThan
- PropertyIsGreaterThanOrEqualTo
- PropertyIsNull
- PropertyIsLike
- PropertyIsBetween
- And
- Or
- Not
- FeatureId

## Function support

SLDReader can parse `<Function>` elements, but the support for functions is vendor specific. Geoserver supports different functions than QGIS does. Since it's not feasible to support all possible vendor specific functions, SLDReader only supports a handful of them, listed below.

### Functions supported by SLDReader

- `geometryType(geometry) -> string`

  - Returns OpenLayers geometry type for the input geometry: (Multi)Point, (Multi)LineString, (Multi)Polygon, LinearRing, Circle, or GeometryCollection.

- `dimension(geometry) -> integer`

  - Returns the dimension of the input geometry. 0 for points, 1 for lines and 2 for polygons.
  - Returns -1 for GeometryCollection.
  - Returns -1 for null geometry or unknown geometry type.
  - For a multipart geometry, returns the dimension of the part geometries.
  - See the [dynamic styling](https://nieuwlandgeo.github.io/SLDReader/dynamic-styling.html) demo for an example of dimension-based styling.

```xml
<Filter>
  <PropertyIsEqualTo>
    <Function name="dimension">
      <PropertyName>geometry</PropertyName>
    </Function>
    <Literal>1</Literal>
  </PropertyIsEqualTo>
</Filter>
```

- `substr(string, start, [length]) -> string`

  - Returns part of a string, starting from start index, starting with 1 (!!).
  - Runs until the end if length is not given.
  - A negative start index `-N` means start `N` characters from the end.
  - If length is negative, omit the last `length` characters from the end of the string.
  - See [QGIS docs](https://docs.qgis.org/3.28/en/docs/user_manual/expressions/functions_list.html#substr) for more info.

- `strSubstring(string, begin, end) -> string`

  - Returns a new string that is a substring of this string. The substring begins at the specified begin and extends to the character at index endIndex - 1 (indexes are zero-based).

- `strSubstringStart(string, begin) -> string`

  - Returns a new string that is a substring of this string. The substring begins at the specified begin and extends to the last character of the string.
  - A negative `begin` index means: start at that many characters from the end of the string.

- `in(test, ...candidates) -> boolean`

  - Returns `true` if `test` value is present in the list of `candidates` arguments, using string-based, case sensitive, comparison.
  - Example: `in('fox', 'the', 'quick', 'brown', 'fox') --> true`.
  - Example: `in(2, '1', '2', '3') --> true`.

- `in2..in10`
  - These are aliases for the `in` function, coming from (older) GeoServer versions that required a different function for different parameter counts.

### Implementing your own function

It's possible to add support for a specific function yourself, using `SLDReader.registerFunction(functionName, implementation)`.

Example:

```javascript
SLDReader.registerFunction('strSubstringStart', (text, startIndex) =>
  text.slice(startIndex)
);
```

After registering your function implementation, you can use it for example in a filter expression:

```xml
<Filter>
  <PropertyIsEqualTo>
    <Function name="strSubstringStart">
      <PropertyName>title</PropertyName>
      <Literal>2</Literal>
    </Function>
    <Literal>LLO WORLD</Literal>
  </PropertyIsEqualTo>
</Filter>
```

The registered function will be called with the value of its child expressions as parameters.

**Important notes:**

- `<Literal>` expression parameters are always passed as string. If your function expects numeric parameters, convert accordingly.
- The type of `<PropertyName>` expressions depends on the feature. Typically, when serializing from GeoJSON, integer values are actual integers.
- SLDReader does not check if the functions are called with the correct number of parameters. Make your function robust against receiving fewer parameters than expected.
- Geometry-valued expressions will always be OpenLayers Geometry instances.
- Unless specifically set for your features, the geometry property name is `'geometry'` for OpenLayers features by default.
- Make your functions as lenient as possible regarding possible inputs. Do not throw errors, but try to return a value that makes sense in that case. If you return `null` from a function implementation, the function fallback value will be used if one is specified in the SLD.
  - `<Function name="someFunction" fallbackValue="42">`

## Compatibility mode

Some software packaged implement SLD styling in a way that's slightly different from the SLD specification. Especially when the SLD specification is a bit vague on some points.

When parsing an SLD, it's possible to specify which software was used to create (or render) the SLD. In this case, SLDReader can make some changes to the parsed SLD for a better visual match between the SLD displayed in the software and the output of the SLDReader style function.

To parse an SLD in compatibility mode, add it as an option as follows:

```javascript
const sldObject = SLDReader.Reader(sld, { compatibilityMode: 'QGIS' });
```

For now, only QGIS is available as compatibility mode option, but more can be added in the future.

### Compatibility mode `QGIS`

In QGIS compatibility mode, a rotated `line` symbol inside a `GraphicFill` will be replaced by an unrotated `slash` or `backslash` when the rotation is an odd multiple of 45 degrees. This ensures that lines are unbroken in the graphic fill, because a (back)slash symbol spans the entire diagonal of the tiled square. A rotated line only spans part of the diagonal, causing broken lines in the fill.

## Contributing

### Creating an issue

Please include an example sld and if possible an example feature as GeoJSON.

### Pull requests

Before starting on a pull request, please raise a Github issue first to prevent starting work on something we're already planning/working on.

When making a pull request, please:

- Address only a single issue or add a single item of functionality.
- Create a test for your functionality.
- Follow eslint rules and apply prettier.
- Update or add an example.

### Commands

To install dependencies, test, build and document

```
npm install
npm test
npm run build
npm run docs
docker-compose up (runs doc website on :4000)
```
