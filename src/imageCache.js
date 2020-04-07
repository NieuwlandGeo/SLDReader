/* eslint-disable no-continue */
import { Style, Icon } from 'ol/style';

import { IMAGE_LOADING, IMAGE_LOADED, IMAGE_ERROR } from './constants';
import { getRuleSymbolizers, getByPath } from './Utils';

// These are possible locations for an external graphic inside a symbolizer.
const externalGraphicPaths = [
  'graphic.externalgraphic',
  'stroke.graphicstroke.graphic.externalgraphic',
  'fill.graphicfill.graphic.externalgraphic',
];

/**
 * Global image cache. A map of image Url -> {
 *   url: image url,
 *   image: an Image instance containing image data,
 *   width: image width in pixels,
 *   height: image height in pixels
 * }
 */
const imageCache = {};
export function setCachedImage(url, imageData) {
  imageCache[url] = imageData;
}
export function getCachedImage(url) {
  return imageCache[url];
}
export function getCachedImageUrls() {
  return Object.keys(imageCache);
}
export function clearImageCache() {
  Object.keys(imageCache).forEach(key => {
    imageCache[key] = null;
    delete imageCache[key];
  });
}

/**
 * Global image loading state cache.
 * A map of image Url -> one of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'
 */
const imageLoadingStateCache = {};
export function setImageLoadingState(url, loadingState) {
  imageLoadingStateCache[url] = loadingState;
}
export function getImageLoadingState(url) {
  return imageLoadingStateCache[url];
}
export function clearImageLoadingStateCache() {
  Object.keys(imageLoadingStateCache).forEach(key => {
    imageLoadingStateCache[key] = null;
    delete imageLoadingStateCache[key];
  });
}

function checkSymbolizerExternalGraphics(symbolizer, imageUrl, loadingState) {
  // Look at all possible paths where an externalgraphic may be present within a symbolizer.
  // When such an externalgraphic has been found, and its url equals imageUrl,
  // and its load state is different from loadingState, then return an updated copy of the symbolizer.
  // In all other cases, return the same (unchanged) symbolizer.
  for (let k = 0; k < externalGraphicPaths.length; k += 1) {
    // Note: this process assumes that each symbolizer has at most one external graphic element.
    const path = externalGraphicPaths[k];
    const externalgraphic = getByPath(symbolizer, path);
    if (
      externalgraphic &&
      externalgraphic.onlineresource === imageUrl &&
      symbolizer.__loadingState !== loadingState
    ) {
      symbolizer.__invalidated = true;
      symbolizer.__loadingState = loadingState;
      // If the symbolizer contains a graphic stroke symbolizer,
      // also update the nested graphicstroke symbolizer object.
      if (path.indexOf('graphicstroke') > -1) {
        symbolizer.stroke.graphicstroke.__invalidated = true;
        symbolizer.stroke.graphicstroke.__loadingState = loadingState;
      }
    }
  }
}

function updateSymbolizerInvalidatedState(
  rule,
  symbolizerName,
  imageUrl,
  loadingState
) {
  // Watch out! Symbolizer may be a symbolizer, or an array of symbolizers.
  // Todo: refactor so rule.symbolizers property is always an array with 0..n symbolizer objects.
  if (!Array.isArray(rule[symbolizerName])) {
    checkSymbolizerExternalGraphics(
      rule[symbolizerName],
      imageUrl,
      loadingState
    );
  } else {
    for (let k = 0; k < rule[symbolizerName].length; k += 1) {
      checkSymbolizerExternalGraphics(
        rule[symbolizerName][k],
        imageUrl,
        loadingState
      );
    }
  }
}

/**
 * @private
 * Updates the __loadingState metadata for the symbolizers with the new loadingState, if
 * the external graphic is matching the image url.
 * This action replaces symbolizers with new symbolizers if they get a new __loadingState.
 * @param {object} featureTypeStyle A feature type style object.
 * @param {string} imageUrl The image url.
 * @param {string} loadingState One of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'.
 */
export function updateExternalGraphicRule(rule, imageUrl, loadingState) {
  updateSymbolizerInvalidatedState(
    rule,
    'pointsymbolizer',
    imageUrl,
    loadingState
  );

  updateSymbolizerInvalidatedState(
    rule,
    'linesymbolizer',
    imageUrl,
    loadingState
  );

  updateSymbolizerInvalidatedState(
    rule,
    'polygonsymbolizer',
    imageUrl,
    loadingState
  );
}

/**
 * @private
 * Go through all rules with an external graphic matching the image url
 * and update the __loadingState metadata for the symbolizers with the new loadingState.
 * This action replaces symbolizers with new symbolizers if they get a new __loadingState.
 * @param {object} featureTypeStyle A feature type style object.
 * @param {string} imageUrl The image url.
 * @param {string} loadingState One of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'.
 */
function updateExternalGraphicRules(featureTypeStyle, imageUrl, loadingState) {
  // Go through all rules with an external graphic matching the image url
  // and update the __loadingState metadata for the symbolizers with the new loadingState.
  if (!featureTypeStyle.rules) {
    return;
  }

  featureTypeStyle.rules.forEach(rule => {
    updateExternalGraphicRule(rule, imageUrl, loadingState);
  });
}

/**
 * @private
 * Load and cache an image that's used as externalGraphic inside one or more symbolizers inside a feature type style object.
 * When the image is loaded, it's put into the cache, the __loadingStaet inside the featureTypeStyle symbolizers are updated,
 * and the imageLoadedCallback is called with the loaded image url.
 * @param {url} imageUrl Image url.
 * @param {object} featureTypeStyle Feature type style object.
 * @param {Function} imageLoadedCallback Will be called with the image url when image
 * has loaded. Will be called with undefined if the loading the image resulted in an error.
 */
export function loadExternalGraphic(
  imageUrl,
  featureTypeStyle,
  imageLoadedCallback
) {
  const image = new Image();

  image.onload = () => {
    setCachedImage(imageUrl, {
      url: imageUrl,
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    setImageLoadingState(imageUrl, IMAGE_LOADED);
    updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_LOADED);
    if (typeof imageLoadedCallback === 'function') {
      imageLoadedCallback(imageUrl);
    }
  };

  image.onerror = () => {
    setImageLoadingState(imageUrl, IMAGE_ERROR);
    updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_ERROR);
    if (typeof imageLoadedCallback === 'function') {
      imageLoadedCallback();
    }
  };

  image.src = imageUrl;
  updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_LOADING);
}

/**
 * @private
 * Start loading images used in rules that have a pointsymbolizer with an externalgraphic.
 * On image load start or load end, update __loadingState metadata of the symbolizers for that image url.
 * @param {Array<object>} rules Array of SLD rule objects that pass the filter for a single feature.
 * @param {FeatureTypeStyle} featureTypeStyle The feature type style object for a layer.
 * @param {Function} imageLoadedCallback Function to call when an image has loaded.
 */
export function processExternalGraphicSymbolizers(
  rules,
  featureTypeStyle,
  imageLoadedCallback
) {
  // If a feature has an external graphic point or polygon symbolizer, the external image may
  // * have never been requested before.
  //   --> set __loadingState IMAGE_LOADING on the symbolizer and start loading the image.
  //       When loading is complete, replace all symbolizers using that image inside the featureTypeStyle
  //       with new symbolizers with a new __loadingState. Also call options.imageLoadCallback if one has been provided.
  // * be loading.
  //   --> set __loadingState IMAGE_LOADING on the symbolizer if not already so.
  // * be loaded and therefore present in the image cache.
  //   --> set __loadingState IMAGE_LOADED on the symbolizer if not already so.
  // * be in error. Error is a kind of loaded, but with an error icon style.
  //   --> set __loadingState IMAGE_ERROR on the symbolizer if not already so.
  rules.forEach(rule => {
    const allSymbolizers = getRuleSymbolizers(rule);
    allSymbolizers.forEach(symbolizer => {
      externalGraphicPaths.forEach(path => {
        const exgraphic = getByPath(symbolizer, path);
        if (!exgraphic) {
          return;
        }

        // When an external graphic has been found inside a symbolizer,
        // either start loading the image, or check if the load state of the image has changed.
        const imageUrl = exgraphic.onlineresource;
        const imageLoadingState = getImageLoadingState(imageUrl);
        if (!imageLoadingState) {
          // Start loading the image and set image load state on the symbolizer.
          setImageLoadingState(imageUrl, IMAGE_LOADING);
          loadExternalGraphic(imageUrl, featureTypeStyle, imageLoadedCallback);
        } else if (
          // Change image load state on the symbolizer if it has changed in the meantime.
          symbolizer.__loadingState !== imageLoadingState
        ) {
          updateExternalGraphicRule(rule, imageUrl, imageLoadingState);
        }
      });
    });
  });
}

/**
 * @private
 * Create an OL Icon style for an external graphic.
 * The Graphic must be already loaded and present in the global imageCache.
 * @param {string} imageUrl Url of the external graphic.
 * @param {number} size Requested size in pixels.
 * @param {number} [rotationDegrees] Image rotation in degrees (clockwise). Default 0.
 */
export function createCachedImageStyle(imageUrl, size, rotationDegrees = 0.0) {
  const { image, width, height } = getCachedImage(imageUrl);
  return new Style({
    image: new Icon({
      img: image,
      imgSize: [width, height],
      // According to SLD spec, if size is given, image height should equal the given size.
      scale: size / height || 1,
      rotation: (Math.PI * rotationDegrees) / 180.0,
    }),
  });
}
