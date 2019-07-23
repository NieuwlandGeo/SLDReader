/* eslint-disable no-underscore-dangle */
import { IMAGE_LOADED, IMAGE_ERROR } from './constants';
import { scaleSelector, filterSelector } from './Filter';
/**
 * get all layer names in sld
 * @param {StyledLayerDescriptor} sld
 * @return {string[]} registered layernames
 */
export function getLayerNames(sld) {
  return sld.layers.map(l => l.name);
}

/**
 * Get layer definition from sld
 * @param  {StyledLayerDescriptor} sld       [description]
 * @param  {string} [layername] optional layername
 * @return {Layer}           [description]
 */
export function getLayer(sld, layername) {
  if (!layername) {
    return sld.layers['0'];
  }
  return sld.layers.find(l => l.name === layername);
}

/**
 * getStyleNames, notice name is not required for userstyle, you might get undefined
 * @param  {Layer} layer [description]
 * @return {string[]}       [description]
 */
export function getStyleNames(layer) {
  return layer.styles.map(s => s.name);
}
/**
 * get style from array layer.styles, if name is undefined it returns default style.
 * null is no style found
 * @param  {Layer} layer [description]
 * @param {string} [name] of style
 * @return {object} the style from layer.styles matching the name
 */
export function getStyle(layer, name) {
  if (name) {
    return layer.styles.find(s => s.name === name);
  }
  return layer.styles.find(s => s.default);
}

/**
 * get rules for specific feature after applying filters
 * @example
 * const style = getStyle(sldLayer, stylename);
 * getRules(style.featuretypestyles['0'], geojson, resolution);
 * @param  {FeatureTypeStyle} featureTypeStyle
 * @param  {object} feature geojson
 * @param  {number} resolution m/px
 * @param  {Function} options.getProperty An optional function with parameters (feature, propertyName)
 * that can be used to extract a property value from a feature.
 * When not given, properties are read from feature.properties directly.Error
 * @param  {Function} options.getFeatureId An optional function to extract the feature id from a feature.Error
 * When not given, feature id is read from feature.id.
 * @return {Rule[]}
 */
export function getRules(featureTypeStyle, feature, resolution, options = {}) {
  const result = [];
  for (let j = 0; j < featureTypeStyle.rules.length; j += 1) {
    const rule = featureTypeStyle.rules[j];
    if (scaleSelector(rule, resolution)) {
      if (rule.filter && filterSelector(rule.filter, feature, options)) {
        result.push(rule);
      } else if (rule.elsefilter && result.length === 0) {
        result.push(rule);
      } else if (!rule.elsefilter && !rule.filter) {
        result.push(rule);
      }
    }
  }
  return result;
}

/**
 * Go through all rules with an external graphic matching the image url
 * and update the __loadingState metadata for the symbolizers with the new imageLoadState.
 * This action replaces symbolizers with new symbolizers if they get a new __loadingState.
 * @param {object} featureTypeStyle A feature type style object.
 * @param {string} imageUrl The image url.
 * @param {string} imageLoadState One of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'.
 */
function updateExternalGraphicRules(
  featureTypeStyle,
  imageUrl,
  imageLoadState
) {
  // Go through all rules with an external graphic matching the image url
  // and update the __loadingState metadata for the symbolizers with the new imageLoadState.
  if (!featureTypeStyle.rules) {
    return;
  }

  featureTypeStyle.rules.forEach(rule => {
    if (!(rule.pointsymbolizer && rule.pointsymbolizer.graphic)) {
      return;
    }

    const { graphic } = rule.pointsymbolizer;
    const { externalgraphic } = graphic;
    if (
      externalgraphic &&
      externalgraphic.onlineresource === imageUrl &&
      rule.pointsymbolizer.__loadingState !== imageLoadState
    ) {
      rule.pointsymbolizer = Object.assign({}, rule.pointsymbolizer, {
        __loadingState: imageLoadState,
      });
    }
  });
}

export function loadExternalGraphic(
  imageUrl,
  imageCache,
  imageLoadState,
  featureTypeStyle,
  imageLoadedCallback
) {
  const image = new Image();

  image.onload = () => {
    imageCache[imageUrl] = {
      url: imageUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_LOADED);
    imageLoadState[imageUrl] = IMAGE_LOADED;
    if (typeof imageLoadedCallback === 'function') {
      imageLoadedCallback(imageUrl);
    }
  };

  image.onerror = () => {
    updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_ERROR);
    imageLoadState[imageUrl] = IMAGE_ERROR;
    if (typeof imageLoadedCallback === 'function') {
      imageLoadedCallback();
    }
  };

  image.src = imageUrl;
}
