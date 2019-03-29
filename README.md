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

[Api docs](https://nieuwlandgeo.github.io/SLDReader/api.html)

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

## Contributing

### Creating an issue

Please include an example sld

### Development dependencies

* node & npm 
* git
* docker (optional)

### Pull requests

* Address a single issue or add a single item of functionality.
* Create a test for your functionality
* Follow eslint rules and apply prettier
* Update or add an example

### Commands

To, install dependencies, test, build and document

```
npm install
npm test
npm run build
npm run docs
docker-compose up (runs doc website on :4000)
```


