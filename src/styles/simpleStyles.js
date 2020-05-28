/* eslint-disable import/prefer-default-export */
import { Stroke, Fill } from 'ol/style';

import { hexToRGB } from './styleUtils';

/**
 * Get an OL style/Stroke instance from the css/svg properties of the .stroke property
 * of an SLD symbolizer object.
 * @private
 * @param  {object} stroke SLD symbolizer.stroke object.
 * @return {object} OpenLayers style/Stroke instance. Returns undefined when input is null or undefined.
 */
export function getSimpleStroke(stroke) {
  // According to SLD spec, if no Stroke element is present inside a symbolizer element,
  // no stroke is to be rendered.
  if (!stroke) {
    return undefined;
  }

  const styleParams = stroke.styling || {};
  return new Stroke({
    color:
      styleParams.strokeOpacity &&
      styleParams.stroke &&
      styleParams.stroke.slice(0, 1) === '#'
        ? hexToRGB(styleParams.stroke, styleParams.strokeOpacity)
        : styleParams.stroke || 'black',
    width: parseFloat(styleParams.strokeWidth) || 1,
    lineCap: styleParams.strokeLinecap,
    lineDash:
      styleParams.strokeDasharray && styleParams.strokeDasharray.split(' '),
    lineDashOffset: parseFloat(styleParams.strokeDashoffset),
    lineJoin: styleParams.strokeLinejoin,
  });
}

/**
 * Get an OL style/Fill instance from the css/svg properties of the .fill property
 * of an SLD symbolizer object.
 * @private
 * @param  {object} fill SLD symbolizer.fill object.
 * @return {object} OpenLayers style/Fill instance. Returns undefined when input is null or undefined.
 */
export function getSimpleFill(fill) {
  // According to SLD spec, if no Fill element is present inside a symbolizer element,
  // no fill is to be rendered.
  if (!fill) {
    return undefined;
  }

  const styleParams = fill.styling || {};

  return new Fill({
    color:
      styleParams.fillOpacity &&
      styleParams.fill &&
      styleParams.fill.slice(0, 1) === '#'
        ? hexToRGB(styleParams.fill, styleParams.fillOpacity)
        : styleParams.fill || 'black',
  });
}
