import { getRules } from './Utils';
import getGeometryStyles from './GeometryStyles';
import { processExternalGraphicSymbolizers } from './imageCache';
import { defaultPointStyle } from './styles/static';
import getPointStyle from './styles/pointStyle';
import getLineStyle from './styles/lineStyle';
import getPolygonStyle from './styles/polygonStyle';
import getTextStyle from './styles/textStyle';
import getLinePointStyle from './styles/linePointStyle';
import getPolygonPointStyle from './styles/polygonPointStyle';

const defaultStyles = [defaultPointStyle];

/**
 * @private
 * Convert symbolizers together with the feature to OL style objects and append them to the OL styles array.
 * @example appendStyles(styles, point[j], feature, getPointStyle);
 * @param {Array<ol/style>} styles Array of OL styles.
 * @param {Array<object>} symbolizers Array of feature symbolizers.
 * @param {ol/feature} feature OpenLayers feature.
 * @param {Function} styleFunction Function for getting the OL style object. Signature (symbolizer, feature) => OL style.
 * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
 */
function appendStyles(
  styles,
  symbolizers,
  feature,
  styleFunction,
  getProperty
) {
  (symbolizers || []).forEach(symbolizer => {
    const olStyle = styleFunction(symbolizer, feature, getProperty);
    if (olStyle) {
      styles.push(olStyle);
    }
  });
}

/**
 * Create openlayers style
 * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
 * @param {GeometryStyles} GeometryStyles rulesconverter
 * @param {object|Feature} feature {@link http://geojson.org|geojson}
 *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
 * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
 * @param {object} [options] Optional options object.
 * @param {boolean} [options.strictGeometryMatch] Default false. When true, only apply symbolizers to the corresponding geometry type.
 * E.g. point symbolizers will not be applied to lines and polygons. Default false (according to SLD spec).
 * @param {boolean} [options.useFallbackStyles] Default true. When true, provides default OL styles as fallback for unknown geometry types.
 * @return ol.style.Style or array of it
 */
export default function OlStyler(
  GeometryStyles,
  feature,
  getProperty,
  options = {}
) {
  const { polygon, line, point, text } = GeometryStyles;

  const defaultOptions = {
    strictGeometryMatch: false,
    useFallbackStyles: true,
  };

  const styleOptions = { ...defaultOptions, ...options };

  const geometry = feature.getGeometry
    ? feature.getGeometry()
    : feature.geometry;
  const geometryType = geometry.getType ? geometry.getType() : geometry.type;

  let styles = [];
  switch (geometryType) {
    case 'Point':
    case 'MultiPoint':
      appendStyles(styles, point, feature, getPointStyle, getProperty);
      appendStyles(styles, text, feature, getTextStyle, getProperty);
      break;

    case 'LineString':
    case 'MultiLineString':
      appendStyles(styles, line, feature, getLineStyle, getProperty);
      if (!styleOptions.strictGeometryMatch) {
        appendStyles(styles, point, feature, getLinePointStyle, getProperty);
      }
      appendStyles(styles, text, feature, getTextStyle, getProperty);
      break;

    case 'Polygon':
    case 'MultiPolygon':
      appendStyles(styles, polygon, feature, getPolygonStyle, getProperty);
      if (!styleOptions.strictGeometryMatch) {
        appendStyles(styles, line, feature, getLineStyle, getProperty);
      }
      appendStyles(styles, point, feature, getPolygonPointStyle, getProperty);
      appendStyles(styles, text, feature, getTextStyle, getProperty);
      break;

    default:
      if (styleOptions.useFallbackStyles) {
        styles = defaultStyles;
      }
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

  return (feature, mapResolution) => {
    // Determine resolution in meters/pixel.
    const resolution =
      typeof options.convertResolution === 'function'
        ? options.convertResolution(mapResolution)
        : mapResolution;

    const getProperty =
      typeof options.getProperty === 'function'
        ? options.getProperty
        : getOlFeatureProperty;

    // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
    const rules = getRules(featureTypeStyle, feature, resolution, {
      getProperty,
      getFeatureId: getOlFeatureId,
    });

    // Start loading images for external graphic symbolizers and when loaded:
    // * update symbolizers to use the cached image.
    // * call imageLoadedCallback with the image url.
    processExternalGraphicSymbolizers(
      rules,
      featureTypeStyle,
      imageLoadedCallback,
      callbackRef
    );

    // Convert style rules to style rule lookup categorized by geometry type.
    const geometryStyles = getGeometryStyles(rules);

    // Determine style rule array.
    const olStyles = OlStyler(geometryStyles, feature, getProperty);

    return olStyles;
  };
}

/**
 * Create an array of OpenLayers style instances for features with the chosen geometry type from a style rule.
 * Since this function creates a static OpenLayers style and not a style function,
 * usage of this function is only suitable for simple symbolizers that do not depend on feature properties
 * and do not contain external graphics. External graphic marks will be shown as a grey circle instead.
 * @param {StyleRule} styleRule Feature Type Style Rule object.
 * @param {string} geometryType One of 'Point', 'LineString' or 'Polygon'
 * @returns {Array<ol.Style>} An array of OpenLayers style instances.
 * @example
 * myOlVectorLayer.setStyle(SLDReader.createOlStyle(featureTypeStyle.rules[0], 'Point');
 */
export function createOlStyle(styleRule, geometryType) {
  const geometryStyles = getGeometryStyles([styleRule]);

  const olStyles = OlStyler(
    geometryStyles,
    { geometry: { type: geometryType } },
    () => null,
    { strictGeometryMatch: true, useFallbackStyles: false }
  );

  return olStyles.filter(style => style !== null);
}
