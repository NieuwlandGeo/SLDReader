# SLDReader

[![npm version](https://badge.fury.io/js/%40nieuwlandgeo%2Fsldreader.svg)](https://badge.fury.io/js/%40nieuwlandgeo%2Fsldreader)

[![Build Status](https://travis-ci.org/NieuwlandGeo/SLDReader.svg?branch=master)](https://travis-ci.org/NieuwlandGeo/SLDReader)

A javascript package that aims to bring styling from a [sld document](http://www.opengeospatial.org/standards/sld) to popular mapping
tools.

**CONTRIBUTIONS WELCOME!**

More information about the standards:

- [Symbology](http://www.opengeospatial.org/standards/symbol/)
- [SLD](http://www.opengeospatial.org/standards/sld)

## Examples

[Live example](https://nieuwlandgeo.github.io/SLDReader)

See docs/examples folder, to serve them locally

```
npm start
```

## Api docs

[Api docs](docs/api.md)

## Supported SLD Features

### Symbolizers

- Line
- Polygon
- Point
- Text (since version 0.0.4)

### Filter comparisons

- PropertyIsEqualTo
- PropertyIsNotEqualTo
- PropertyIsLessThan
- PropertyIsLessThanOrEqualTo
- PropertyIsGreaterThan
- PropertyIsGreaterThanOrEqualTo
- PropertyIsLike
- PropertyIsBetween
- And
- Or
- Not
- FeatureId

## Old Browsers

Some older browsers need polyfills to use this library. E.g. [es6.array.find](https://www.npmjs.com/package/core-js#ecmascript-6-array)

## Commands

To, install dependencies, test, build and document

```
npm install
npm test
npm build
npm run docs
docker-compose up (runs doc website on :4000)
```
