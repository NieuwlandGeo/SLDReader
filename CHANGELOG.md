# Changelog

## Version 0.1.0

### Breaking change
SLDReader is built upon OpenLayers 5 now. It now requires OpenLayers 5.3.0 as a peer dependency. If you still use OpenLayers 4, please stay with the 0.0.x versions.

### Bugfix
The handing of the Size parameter within a Graphic did not conform to the OpenGIS Symbology Encoding Implementation Specification. This has been fixed. More specifically:
* When using a Mark, the Size parameter now correctly sets the diameter (or height in case of a square).
* When using an ExternalGraphic, the image is scaled so the height equals the given Size. When no Size parameter is given, the image is displayed at its native size.

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
