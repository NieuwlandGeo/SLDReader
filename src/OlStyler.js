import { getSymbolizersForFeature } from './Utils';
import { defaultPointStyle } from './styles/static';
import getPointStyle from './styles/pointStyle';
import getLineStyle from './styles/lineStyle';
import getPolygonStyle from './styles/polygonStyle';
import getTextStyle from './styles/textStyle';
import getLinePointStyle from './styles/linePointStyle';
import getPolygonPointStyle from './styles/polygonPointStyle';

const defaultStyles = [defaultPointStyle];

/**
 * Evaluation context for style functions.
 * @private
 * @typedef {object} EvaluationContext
 * @property {Function} getProperty A function (feature, propertyName) -> value that returns the value of the property of a feature.
 * @property {Function} getId A function feature -> any that gets the id of a feature.
 * @property {number} resolution The current resolution in ground units in meters / pixel.
 */

/**
 * @private
 * Convert symbolizer together with the feature to an OL style instance and append it to the OL styles array.
 * @example appendStyles(styles, pointsymbolizer, feature, getPointStyle, context);
 * @param {Array<ol/style>} styles Array of OL styles.
 * @param {Array<object>} symbolizers Array of feature symbolizers.
 * @param {ol/feature} feature OpenLayers feature.
 * @param {Function} styleFunction Function for getting the OL style object. Signature (symbolizer, feature) => OL style.
 * @param {EvaluationContext} context Evaluation context.
 */
function appendStyle(styles, symbolizer, feature, styleFunction, context) {
  if (!symbolizer) {
    return;
  }

  const olStyle = styleFunction(symbolizer, feature, context);
  if (olStyle) {
    styles.push(olStyle);
  }
}

/**
 * Create openlayers style
 * @private
 * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
 * @param {Array<object>} symbolizers Array of symbolizers.
 * @param {object|Feature} feature {@link http://geojson.org|geojson}
 *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
 * @param {EvaluationContext} context Evaluation context.
 * @param {object} [options] Optional options object.
 * @param {boolean} [options.strictGeometryMatch] Default false. When true, only apply symbolizers to the corresponding geometry type.
 * E.g. point symbolizers will not be applied to lines and polygons. Default false (according to SLD spec).
 * @param {boolean} [options.useFallbackStyles] Default true. When true, provides default OL styles as fallback for unknown geometry types.
 * @return ol.style.Style or array of it
 */
export default function OlStyler(symbolizers, feature, context, options = {}) {
  const defaultOptions = {
    strictGeometryMatch: false,
    useFallbackStyles: true,
  };

  const styleOptions = { ...defaultOptions, ...options };

  if (!(Array.isArray(symbolizers) && symbolizers.length > 0)) {
    return [];
  }

  const geometry = feature.getGeometry
    ? feature.getGeometry()
    : feature.geometry;
  const geometryType = geometry.getType ? geometry.getType() : geometry.type;
  let unknownGeometryType = false;

  let styles = [];
  symbolizers.forEach(symbolizer => {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        if (symbolizer.type === 'pointsymbolizer') {
          appendStyle(styles, symbolizer, feature, getPointStyle, context);
        }
        if (symbolizer.type === 'textsymbolizer') {
          appendStyle(styles, symbolizer, feature, getTextStyle, context);
        }
        break;

      case 'LineString':
      case 'MultiLineString':
        if (symbolizer.type === 'linesymbolizer') {
          appendStyle(styles, symbolizer, feature, getLineStyle, context);
        }
        if (!styleOptions.strictGeometryMatch) {
          if (symbolizer.type === 'pointsymbolizer') {
            appendStyle(
              styles,
              symbolizer,
              feature,
              getLinePointStyle,
              context
            );
          }
        }
        if (symbolizer.type === 'textsymbolizer') {
          appendStyle(styles, symbolizer, feature, getTextStyle, context);
        }
        break;

      case 'Polygon':
      case 'MultiPolygon':
        if (symbolizer.type === 'polygonsymbolizer') {
          appendStyle(styles, symbolizer, feature, getPolygonStyle, context);
        }
        if (!styleOptions.strictGeometryMatch) {
          if (symbolizer.type === 'linesymbolizer') {
            appendStyle(styles, symbolizer, feature, getLineStyle, context);
          }
        }
        if (symbolizer.type === 'pointsymbolizer') {
          appendStyle(
            styles,
            symbolizer,
            feature,
            getPolygonPointStyle,
            context
          );
        }
        if (symbolizer.type === 'textsymbolizer') {
          appendStyle(styles, symbolizer, feature, getTextStyle, context);
        }
        break;

      default:
        unknownGeometryType = true;
        break;
    }
  });

  if (unknownGeometryType && styleOptions.useFallbackStyles) {
    styles = defaultStyles;
  }

  // Set z-index of styles explicitly to fix a bug where GraphicStroke is always rendered above a line symbolizer.
  styles.forEach((style, index) => style.setZIndex(index));

  return styles;
}

/**
 * @private
 * Extract feature id from an OpenLayers Feature.
 * @param {Feature} feature {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
 * @returns {string} Feature id.
 */
function getOlFeatureId(feature) {
  return feature.getId();
}

/**
 * @private
 * Extract a property value from an OpenLayers Feature.
 * @param {Feature} feature {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
 * @param {string} propertyName The name of the feature property to read.
 * @returns {object} Property value.
 */
function getOlFeatureProperty(feature, propertyName) {
  return feature.get(propertyName);
}

/**
 * Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.
 *
 * **Important!** When using externalGraphics for point styling, make sure to call .changed() on the layer
 * inside options.imageLoadedCallback to immediately see the loaded image. If you do not do this, the
 * image icon will only become visible the next time OpenLayers draws the layer (after pan or zoom).
 * @public
 * @param {FeatureTypeStyle} featureTypeStyle Feature Type Style object.
 * @param {object} options Options
 * @param {function} options.convertResolution An optional function to convert the resolution in map units/pixel to resolution in meters/pixel.
 * When not given, the map resolution is used as-is.
 * @param {function} options.imageLoadedCallback Optional callback that will be called with the url of an externalGraphic when
 * an image has been loaded (successfully or not). Call .changed() inside the callback on the layer to see the loaded image.
 * @param {function} options.getProperty Optional custom property getter: (feature, propertyName) => property value.
 * @returns {Function} A function that can be set as style function on an OpenLayers vector style layer.
 * @example
 * myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
 *   imageLoadedCallback: () => { myOlVectorLayer.changed(); }
 * }));
 */
export function createOlStyleFunction(featureTypeStyle, options = {}) {
  const imageLoadedCallback = options.imageLoadedCallback || (() => {});

  // Keep track of whether a callback has been registered per image url.
  const callbackRef = {};

  // Evaluation context.
  const context = { imageLoadedCallback, callbackRef };

  context.getProperty =
    typeof options.getProperty === 'function'
      ? options.getProperty
      : getOlFeatureProperty;

  context.getId = getOlFeatureId;

  return (feature, mapResolution) => {
    // Determine resolution in meters/pixel.
    const groundResolution =
      typeof options.convertResolution === 'function'
        ? options.convertResolution(mapResolution)
        : mapResolution;

    context.resolution = groundResolution;

    // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
    const symbolizers = getSymbolizersForFeature(
      featureTypeStyle,
      feature,
      context
    );

    if (!(symbolizers && symbolizers.length > 0)) {
      return [];
    }

    // Determine style rule array.
    const olStyles = OlStyler(symbolizers, feature, context);

    return olStyles;
  };
}

/**
 * Create an array of OpenLayers style instances for features with the chosen geometry type from a style rule.
 * Since this function creates a static OpenLayers style and not a style function,
 * usage of this function is only suitable for simple symbolizers that do not depend on feature properties
 * and do not contain external graphics. External graphic marks will be shown as a grey circle instead.
 * @public
 * @param {StyleRule} styleRule Feature Type Style Rule object.
 * @param {string} geometryType One of 'Point', 'LineString' or 'Polygon'
 * @returns {Array<ol.Style>} An array of OpenLayers style instances.
 * @example
 * myOlVectorLayer.setStyle(SLDReader.createOlStyle(featureTypeStyle.rules[0], 'Point');
 */
export function createOlStyle(styleRule, geometryType) {
  const olStyles = OlStyler(
    styleRule.symbolizers,
    { geometry: { type: geometryType } },
    () => null,
    { strictGeometryMatch: true, useFallbackStyles: false }
  );

  return olStyles.filter(style => style !== null);
}
