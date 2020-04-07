import { getRules } from './Utils';
import getGeometryStyles from './GeometryStyles';
import { processExternalGraphicSymbolizers } from './imageCache';
import { defaultPointStyle } from './styles/static';
import getPointStyle from './styles/pointStyle';
import getLineStyle from './styles/lineStyle';
import getPolygonStyle from './styles/polygonStyle';
import getTextStyle from './styles/textStyle';

const defaultStyles = [defaultPointStyle];

/**
 * @private
 * Convert symbolizers together with the feature to OL style objects and append them to the styles array.
 * @example appendStyle(styles, point[j], feature, getPointStyle);
 * @param {Array<ol/style>} styles Array of OL styles.
 * @param {object|Array<object>} symbolizers Feature symbolizer object, or array of feature symbolizers.
 * @param {ol/feature} feature OpenLayers feature.
 * @param {Function} styleFunction Function for getting the OL style object. Signature (symbolizer, feature) => OL style.
 */
function appendStyle(styles, symbolizers, feature, styleFunction) {
  if (Array.isArray(symbolizers)) {
    for (let k = 0; k < symbolizers.length; k += 1) {
      styles.push(styleFunction(symbolizers[k], feature));
    }
  } else {
    styles.push(styleFunction(symbolizers, feature));
  }
}

/**
 * Create openlayers style
 * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
 * @param {GeometryStyles} GeometryStyles rulesconverter
 * @param {object|Feature} feature {@link http://geojson.org|geojson}
 *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
 * @return ol.style.Style or array of it
 */
export default function OlStyler(GeometryStyles, feature) {
  const { polygon, line, point, text } = GeometryStyles;

  const geometry = feature.getGeometry
    ? feature.getGeometry()
    : feature.geometry;
  const geometryType = geometry.getType ? geometry.getType() : geometry.type;

  let styles = [];
  switch (geometryType) {
    case 'Point':
    case 'MultiPoint':
      for (let j = 0; j < point.length; j += 1) {
        appendStyle(styles, point[j], feature, getPointStyle);
      }
      for (let j = 0; j < text.length; j += 1) {
        styles.push(getTextStyle(text[j], feature));
      }
      break;

    case 'LineString':
    case 'MultiLineString':
      for (let j = 0; j < line.length; j += 1) {
        appendStyle(styles, line[j], feature, getLineStyle);
      }
      for (let j = 0; j < text.length; j += 1) {
        styles.push(getTextStyle(text[j], feature));
      }
      break;

    case 'Polygon':
    case 'MultiPolygon':
      for (let i = 0; i < polygon.length; i += 1) {
        appendStyle(styles, polygon[i], feature, getPolygonStyle);
      }
      for (let j = 0; j < text.length; j += 1) {
        styles.push(getTextStyle(text[j], feature));
      }
      break;

    default:
      styles = defaultStyles;
  }

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
 * @returns {Function} A function that can be set as style function on an OpenLayers vector style layer.
 * @example
 * myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
 *   imageLoadedCallback: () => { myOlVectorLayer.changed(); }
 * }));
 */
export function createOlStyleFunction(featureTypeStyle, options = {}) {
  const imageLoadedCallback = options.imageLoadedCallback || (() => {});

  return (feature, mapResolution) => {
    // Determine resolution in meters/pixel.
    const resolution =
      typeof options.convertResolution === 'function'
        ? options.convertResolution(mapResolution)
        : mapResolution;

    // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
    const rules = getRules(featureTypeStyle, feature, resolution, {
      getProperty: getOlFeatureProperty,
      getFeatureId: getOlFeatureId,
    });

    // Start loading images for external graphic symbolizers and when loaded:
    // * update symbolizers to use the cached image.
    // * call imageLoadedCallback with the image url.
    processExternalGraphicSymbolizers(
      rules,
      featureTypeStyle,
      imageLoadedCallback
    );

    // Convert style rules to style rule lookup categorized by geometry type.
    const geometryStyles = getGeometryStyles(rules);

    // Determine style rule array.
    const olStyles = OlStyler(geometryStyles, feature);

    return olStyles;
  };
}
