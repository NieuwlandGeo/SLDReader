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
 * @private
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
 * @private
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

/**
 * @private
 * A cache of image loading promises.
 * A map of image Url -> Promise
 * This used to prevent duplicate loading when a style references an image that's already being loaded.
 */
const _imageLoaderCache = {};
export function getImageLoader(url) {
  return _imageLoaderCache[url];
}
export function setImageLoader(url, loaderPromise) {
  _imageLoaderCache[url] = loaderPromise;
}
export function clearImageLoaderCache() {
  Object.keys(_imageLoaderCache).forEach(key => {
    delete _imageLoaderCache[key];
  });
}

function invalidateExternalGraphicSymbolizers(symbolizer, imageUrl) {
  // Look at all possible paths where an externalgraphic may be present within a symbolizer.
  // When such an externalgraphic has been found, and its url equals imageUrl, invalidate the symbolizer.
  for (let k = 0; k < externalGraphicPaths.length; k += 1) {
    // Note: this process assumes that each symbolizer has at most one external graphic element.
    const path = externalGraphicPaths[k];
    const externalgraphic = getByPath(symbolizer, path);
    if (externalgraphic && externalgraphic.onlineresource === imageUrl) {
      symbolizer.__invalidated = true;
      // If the symbolizer contains a graphic stroke symbolizer,
      // also update the nested graphicstroke symbolizer object.
      if (path.indexOf('graphicstroke') > -1) {
        symbolizer.stroke.graphicstroke.__invalidated = true;
      }
    }
  }
}

function updateSymbolizerInvalidatedState(ruleSymbolizer, imageUrl) {
  if (!ruleSymbolizer) {
    return;
  }

  // Watch out! A symbolizer inside a rule may be a symbolizer, or an array of symbolizers.
  // Todo: refactor so rule.symbolizers property is always an array with 0..n symbolizer objects.
  if (!Array.isArray(ruleSymbolizer)) {
    invalidateExternalGraphicSymbolizers(ruleSymbolizer, imageUrl);
  } else {
    for (let k = 0; k < ruleSymbolizer.length; k += 1) {
      invalidateExternalGraphicSymbolizers(ruleSymbolizer[k], imageUrl);
    }
  }
}

/**
 * @private
 * Invalidate all symbolizers inside a featureTypeStyle's rules having an ExternalGraphic matching the image url
 * @param {object} featureTypeStyle A feature type style object.
 * @param {string} imageUrl The image url.
 */
function invalidateExternalGraphics(featureTypeStyle, imageUrl) {
  if (!featureTypeStyle.rules) {
    return;
  }

  featureTypeStyle.rules.forEach(rule => {
    updateSymbolizerInvalidatedState(rule.pointsymbolizer, imageUrl);
    updateSymbolizerInvalidatedState(rule.linesymbolizer, imageUrl);
    updateSymbolizerInvalidatedState(rule.polygonsymbolizer, imageUrl);
  });
}

/**
 * @private
 * Creates a promise that loads an image and store it in the image cache.
 * Calling this method with the same image url twice will return the loader promise
 * that was created when this method was called the first time for that specific image url.
 * @param {string} imageUrl Image url.
 * @returns {Promise} A promise that resolves when the image is loaded and fails when the
 * image didn't load correctly.
 */
function getCachingImageLoader(imageUrl) {
  // Check of a load is already in progress for an image.
  // If so, return the loader.
  let loader = getImageLoader(imageUrl);
  if (loader) {
    return loader;
  }

  // If no load is in progress, create a new loader and store it in the image loader cache before returning it.
  loader = new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      setCachedImage(imageUrl, {
        url: imageUrl,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setImageLoadingState(imageUrl, IMAGE_LOADED);
      resolve(imageUrl);
    };

    image.onerror = () => {
      setImageLoadingState(imageUrl, IMAGE_ERROR);
      reject();
    };

    image.src = imageUrl;
  });

  // Cache the new image loader and return it.
  setImageLoadingState(imageUrl, IMAGE_LOADING);
  setImageLoader(imageUrl, loader);
  return loader;
}

/**
 * @private
 * Load and cache an image that's used as externalGraphic inside a symbolizer.
 * When the image is loaded, all symbolizers within the feature type style referencing this image are invalidated,
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
  invalidateExternalGraphics(featureTypeStyle, imageUrl);
  getCachingImageLoader(imageUrl)
    .then(() => {
      invalidateExternalGraphics(featureTypeStyle, imageUrl);
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback(imageUrl);
      }
    })
    .catch(() => {
      invalidateExternalGraphics(featureTypeStyle, imageUrl);
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback();
      }
    });
}

/**
 * @private
 * Start loading images used in rules that have a pointsymbolizer with an externalgraphic.
 * @param {Array<object>} rules Array of SLD rule objects that pass the filter for a single feature.
 * @param {FeatureTypeStyle} featureTypeStyle The feature type style object for a layer.
 * @param {Function} imageLoadedCallback Function to call when an image has loaded.
 */
export function processExternalGraphicSymbolizers(
  rules,
  featureTypeStyle,
  imageLoadedCallback,
  callbackRef
) {
  // Walk over all symbolizers inside all given rules.
  // Dive into the symbolizers to find ExternalGraphic elements and for each ExternalGraphic,
  // check if the image url has been encountered before.
  // If not -> start loading the image into the global image cache.
  rules.forEach(rule => {
    const allSymbolizers = getRuleSymbolizers(rule);
    allSymbolizers.forEach(symbolizer => {
      externalGraphicPaths.forEach(path => {
        const exgraphic = getByPath(symbolizer, path);
        if (!exgraphic) {
          return;
        }
        const imageUrl = exgraphic.onlineresource;
        const imageLoadingState = getImageLoadingState(imageUrl);
        if (!imageLoadingState || imageLoadingState === IMAGE_LOADING) {
          // Prevent adding imageLoadedCallback more than once per image per created style function
          // by inspecting the callbackRef object passed by the style function creator function.
          // Each style function has its own callbackRef dictionary.
          if (!callbackRef[imageUrl]) {
            callbackRef[imageUrl] = true;
            // Load image and when loaded, invalidate all symbolizers referencing the image
            // and invoke the imageLoadedCallback.
            loadExternalGraphic(
              imageUrl,
              featureTypeStyle,
              imageLoadedCallback
            );
          }
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
