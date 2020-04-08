# SLDReader

[![npm version](https://badge.fury.io/js/%40nieuwlandgeo%2Fsldreader.svg)](https://badge.fury.io/js/%40nieuwlandgeo%2Fsldreader)

[![Build Status](https://travis-ci.org/NieuwlandGeo/SLDReader.svg?branch=master)](https://travis-ci.org/NieuwlandGeo/SLDReader)

A javascript package that aims to bring styling from a [sld document](http://www.opengeospatial.org/standards/sld) to popular mapping
tools. The project consists of two parts:
* An SLDReader that parses an SLD document into a style object.
* A function createOlStyleFunction that converts the parsed style object into a function that you can use in OpenLayers to style features.

The OpenLayers style converter tries to be as efficient as possible by recycling OpenLayers Style instances whenever possible.

**CONTRIBUTIONS WELCOME!**

More information about the standards:

* [Symbology](http://www.opengeospatial.org/standards/symbol/)
* [SLD](http://www.opengeospatial.org/standards/sld)

## Examples

[Live example](https://nieuwlandgeo.github.io/SLDReader)

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
Wellknown names that reference a symbol library, like ```ttf://CustomFont#42``` are not supported. The Size and Rotation elements may be dynamic by using the PropertyName element.

#### LineSymbolizer
Only these static css-parameters are supported:
* stroke
* stroke-width
* stroke-opacity
* stroke-linejoin
* stroke-linecap
* stroke-dasharray
* stroke-dashoffset

GraphicStroke with Mark or ExternalGraphic is supported.
GraphicFill and PerpendicularOffset are not supported.

#### PolygonSymbolizer
Polygons with static fill and stroke style parameters are supported. See LineSymbolizer above for supported stroke css-parameters. GraphicFill is also supported.
GraphicStroke with Mark or ExternalGraphic is supported.

#### TextSymbolizer
Dynamic Labels (with PropertyName elements), Font and Halo are supported. No vendor-specific options are supported. LabelPlacement or PointPlacement are supported. Graphic elements to display behind the label text are not supported.
* For PointPlacement, Displacement is supported<sup>1</sup>.
* For PointPlacement, Rotation is supported<sup>1</sup>. PropertyName as rotation value is supported.
* For PointPlacement, AnchorPoint is not supported.
* For LinePlacement, PerpendicularOffset is not supported.

[1]: according to the SLD-spec, label rotation takes place before displacement, but OpenLayers applies displacement before rotation. Beware when combining rotation and displacement inside a single text symbolizer.

### Dynamic parameter values
According to the SLD spec, most values can be mixed type (a combination ofplain text and [Filter expressions](https://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html#sld-filter-expression)). This means that most values can depend on a feature's properties. The SLDReader only supports dynamic values with PropertyName elements in these cases:

* PointSymbolizer Size
* PointSymbolizer Rotation
* TextSymbolizer Label

Also there is currently no support for arithmetic operators (Add,Sub,Mul,Div).

### Units of measure
Only pixels are supported as unit of measure.

### Geometry element
The use of a Geometry element to point to a different geometry property on a feature to use for styling is not supported.

### Function elements
The use of Function expressions is not supported.

### Filter comparisons
The SLDReader library supports the following operators inside Filter elements:

* PropertyIsEqualTo
* PropertyIsNotEqualTo
* PropertyIsLessThan
* PropertyIsLessThanOrEqualTo
* PropertyIsGreaterThan
* PropertyIsGreaterThanOrEqualTo
* PropertyIsNull
* PropertyIsLike
* PropertyIsBetween
* And
* Or
* Not
* FeatureId

## Supported OpenLayers version
The SLDReader has a peer dependency on OpenLayers version 5.3.0. Because there are no backwards incompatible changes between v6+ and v5.3, it is possible to use this library in a project that uses a later (v6+) version of OpenLayers.

This may change in the future if the newest version of OpenLayers stops being backwards compatible with this library, or when a juicy new must-have feature is introduced. When that happens, SLDReader will be based on that OpenLayers version.

## Old Browsers

Some older browsers need polyfills to use this library. E.g. [es6.array.find](https://www.npmjs.com/package/core-js#ecmascript-6-array). When using the OpenLayers style converter, OpenLayers' own [browser restrictions](https://openlayers.org/en/latest/doc/tutorials/background.html) have to be taken into account as well.

## Contributing

### Creating an issue

Please include an example sld and if possible an example feature as GeoJSON.

### Development dependencies

* node & npm 
* git
* docker (optional, for running the live examples yourself)

### Pull requests

Before starting on a pull request, please raise a Github issue first to prevent starting work on something we're already planning/working on.

When making a pull request, please:
* Address only a single issue or add a single item of functionality.
* Create a test for your functionality.
* Follow eslint rules and apply prettier.
* Update or add an example.

### Commands

To install dependencies, test, build and document

```
npm install
npm test
npm run build
npm run docs
docker-compose up (runs doc website on :4000)
```
