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

## Restrictions on supported SLD Features

The SLDReader library can read both SLD v1.0 and SLD v1.1 documents, but not every part of the SLD standard is (or can be) implemented by the SLDReader and OpenLayers style converter (yet).

### Symbolizers

#### PointSymbolizer

Marks with well known symbol names are supported: circle, square, triangle, star, cross, x, hexagon, octagon. ExternalGraphic icons are supported.

Two custom marks are also supported: `horline` for a horizontal line through the center and `backslash` for a line from the top left to the bottom right. Use backslash instead of horline if you want to have diagonal hashing as a polygon graphic fill.

Wellknown names that reference a symbol library, like `ttf://CustomFont#42` are not supported. The Size and Rotation elements may be dynamic by using the PropertyName element.

Only one Graphic per PointSymbolizer is supported. Each Graphic can only have one Mark or one ExternalGraphic.

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

GraphicFill and PerpendicularOffset are not supported.

#### Note about GraphicStroke

ExternalGraphic is mostly supported with these caveats:

- Always add a Size-element, even if using an ExternalGraphic instead of a Mark.
- SLD V1.0.0 does not officially support the Gap property. For this, SLDReader implements the same workaround that Geoserver uses. You can use the `stroke-dasharray` parameter to add a gap between stroke marks. To do this, use a dash array with two parameters: the first parameter being the size of the graphic and the second being the gap size. See the " GraphicStroke: ExternalGraphic" example.

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

#### TextSymbolizer

Dynamic Labels (with PropertyName elements), Font and Halo are supported. No vendor-specific options are supported. LabelPlacement or PointPlacement are supported. Graphic elements to display behind the label text are not supported.

- For PointPlacement, Displacement is supported<sup>1</sup>.
- For PointPlacement, Rotation is supported<sup>1</sup>. PropertyName as rotation value is supported.
- For PointPlacement, AnchorPoint is partially supported. Since OpenLayers does not support fractional anchor points, the label anchor is snapped to the alignment closest to left/right/top/bottom/center alignment. For instance: an `AnchorPointX` of 0.1 is snapped to 0, corresponding to left alignment in OpenLayers.
- For LinePlacement, PerpendicularOffset is not supported.

[1]: according to the SLD-spec, label rotation takes place before displacement, but OpenLayers applies displacement before rotation. Beware when combining rotation and displacement inside a single text symbolizer.

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

Only pixels are supported as unit of measure.

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
  - Returns 0 for a GeometryCollection.
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

## Supported OpenLayers version

The SLDReader has a peer dependency on OpenLayers version 5.3.0. Because there are no backwards incompatible changes between v7+ and v5.3, it is possible to use this library in a project that uses a later (v8+) version of OpenLayers.

This may change in the future if the newest version of OpenLayers stops being backwards compatible with this library, or when a juicy new must-have feature is introduced. When that happens, SLDReader will be based on that OpenLayers version.

## Old Browsers

Some older browsers need polyfills to use this library. E.g. [es6.array.find](https://www.npmjs.com/package/core-js#ecmascript-6-array). When using the OpenLayers style converter, OpenLayers' own [browser restrictions](https://openlayers.org/en/latest/doc/tutorials/background.html) have to be taken into account as well.

## Contributing

### Creating an issue

Please include an example sld and if possible an example feature as GeoJSON.

### Development dependencies

- node (v14.18+) & npm
- git
- docker (optional, for running the live examples yourself)

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
