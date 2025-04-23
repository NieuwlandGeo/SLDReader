/* eslint-disable import/prefer-default-export */
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';

import { getOLColorString } from './styleUtils';
import evaluate from '../olEvaluator';

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

  // Options that have a default value.
  const strokeColor = evaluate(styleParams.stroke, null, null, '#000000');

  const strokeOpacity = evaluate(styleParams.strokeOpacity, null, null, 1.0);

  const strokeWidth = evaluate(styleParams.strokeWidth, null, null, 1.0);

  const strokeLineDashOffset = evaluate(
    styleParams.strokeDashoffset,
    null,
    null,
    0.0
  );

  const strokeOptions = {
    color: getOLColorString(strokeColor, strokeOpacity),
    width: strokeWidth,
    lineDashOffset: strokeLineDashOffset,
  };

  // Optional parameters that will be added to stroke options when present in SLD.
  const strokeLineJoin = evaluate(styleParams.strokeLinejoin, null, null);
  if (strokeLineJoin !== null) {
    strokeOptions.lineJoin = strokeLineJoin;
  }

  const strokeLineCap = evaluate(styleParams.strokeLinecap, null, null);
  if (strokeLineCap !== null) {
    strokeOptions.lineCap = strokeLineCap;
  }

  const strokeDashArray = evaluate(styleParams.strokeDasharray, null, null);
  if (strokeDashArray !== null) {
    strokeOptions.lineDash = strokeDashArray.split(' ');
  }

  return new Stroke(strokeOptions);
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

  const fillColor = evaluate(styleParams.fill, null, null, '#808080');

  const fillOpacity = evaluate(styleParams.fillOpacity, null, null, 1.0);

  return new Fill({ color: getOLColorString(fillColor, fillOpacity) });
}
