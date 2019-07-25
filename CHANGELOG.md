# Changelog

## Version 0.0.8

### Bugfix
* SvgParameter can be used in all symbolizer types now. This fixes an issue where SvgParameter could not be used inside a Mark Graphic.

### New
* Images loaded by PointSymbolizers using an ExternalGraphic are now correctly scaled according to the Size parameter.
* **Note:** use the new {{options.imageLoadCallback}} to update the vector layer when an image finishes loading. See the [Flags of the Benelux](https://nieuwlandgeo.github.io/SLDReader/benelux.html) example.

## Version 0.0.7

* Another performance boost by optimizing reading feature attributes.
https://github.com/NieuwlandGeo/SLDReader/pull/42

## Version 0.0.6

* Peformance boost by caching OpenLayers style instances.
https://github.com/NieuwlandGeo/SLDReader/pull/39

## Version 0.0.5

### New
* Added a new utility method createOlStyleFunction to simplify applying a featureTypeStyle to an OpenLayers vector layer.
https://github.com/NieuwlandGeo/SLDReader/pull/33

## Version 0.0.4

### Breaking API Change

Olstyler now expects a geojson feature instead of a string with geometry type.
