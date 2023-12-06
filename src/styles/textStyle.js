import { Style, Fill, Stroke, Text } from 'ol/style';
import { getOLColorString, memoizeStyleFunction } from './styleUtils';
import evaluate, { isDynamicExpression } from '../olEvaluator';
import { emptyStyle } from './static';
import { applyDynamicTextStyling } from './dynamicStyles';

/**
 * @private
 * Get the static OL style instance for a text symbolizer.
 * The text and placement properties will be set on the style object at runtime.
 * @param {object} textsymbolizer SLD text symbolizer object.
 * @return {object} openlayers style
 */
function textStyle(textsymbolizer) {
  if (!(textsymbolizer && textsymbolizer.label)) {
    return emptyStyle;
  }

  // If the label is dynamic, set text to empty string.
  // In that case, text will be set at runtime.
  const labelText = evaluate(textsymbolizer.label, null, null, '');

  const fontStyling = textsymbolizer.font
    ? textsymbolizer.font.styling || {}
    : {};
  const fontFamily = evaluate(fontStyling.fontFamily, null, null, 'sans-serif');
  const fontSize = evaluate(fontStyling.fontSize, null, null, 10);
  const fontStyle = evaluate(fontStyling.fontStyle, null, null, '');
  const fontWeight = evaluate(fontStyling.fontWeight, null, null, '');
  const olFontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  const pointplacement =
    textsymbolizer &&
    textsymbolizer.labelplacement &&
    textsymbolizer.labelplacement.pointplacement
      ? textsymbolizer.labelplacement.pointplacement
      : {};

  // If rotation is dynamic, default to 0. Rotation will be set at runtime.
  const labelRotationDegrees = evaluate(
    pointplacement.rotation,
    null,
    null,
    0.0
  );

  const displacement =
    pointplacement && pointplacement.displacement
      ? pointplacement.displacement
      : {};
  const offsetX = evaluate(displacement.displacementx, null, null, 0.0);
  // Positive offsetY shifts the label downwards. Positive displacementY in SLD means shift upwards.
  const offsetY = -evaluate(displacement.displacementy, null, null, 0.0);

  // OpenLayers does not support fractional alignment, so snap the anchor to the most suitable option.
  const anchorpoint = (pointplacement && pointplacement.anchorpoint) || {};

  let textAlign = 'center';
  const anchorPointX = evaluate(anchorpoint.anchorpointx, null, null, NaN);
  if (anchorPointX < 0.25) {
    textAlign = 'left';
  } else if (anchorPointX > 0.75) {
    textAlign = 'right';
  }

  let textBaseline = 'middle';
  const anchorPointY = evaluate(anchorpoint.anchorpointy, null, null, NaN);
  if (anchorPointY < 0.25) {
    textBaseline = 'bottom';
  } else if (anchorPointY > 0.75) {
    textBaseline = 'top';
  }

  const fillStyling = textsymbolizer.fill ? textsymbolizer.fill.styling : {};
  const textFillColor = evaluate(fillStyling.fill, null, null, '#000000');
  const textFillOpacity = evaluate(fillStyling.fillOpacity, null, null, 1.0);

  // Assemble text style options.
  const textStyleOptions = {
    text: labelText,
    font: olFontString,
    offsetX,
    offsetY,
    rotation: (Math.PI * labelRotationDegrees) / 180.0,
    textAlign,
    textBaseline,
    fill: new Fill({
      color: getOLColorString(textFillColor, textFillOpacity),
    }),
  };

  // Convert SLD halo to text symbol stroke.
  if (textsymbolizer.halo) {
    const haloStyling =
      textsymbolizer.halo && textsymbolizer.halo.fill
        ? textsymbolizer.halo.fill.styling
        : {};
    const haloFillColor = evaluate(haloStyling.fill, null, null, '#FFFFFF');
    const haloFillOpacity = evaluate(haloStyling.fillOpacity, null, null, 1.0);
    const haloRadius = evaluate(textsymbolizer.halo.radius, null, null, 1.0);
    textStyleOptions.stroke = new Stroke({
      color: getOLColorString(haloFillColor, haloFillOpacity),
      // wrong position width radius equal to 2 or 4
      width:
        (haloRadius === 2 || haloRadius === 4
          ? haloRadius - 0.00001
          : haloRadius) * 2,
    });
  }

  return new Style({
    text: new Text(textStyleOptions),
  });
}

const cachedTextStyle = memoizeStyleFunction(textStyle);

/**
 * @private
 * Get an OL text style instance for a feature according to a symbolizer.
 * @param {object} symbolizer SLD symbolizer object.
 * @param {ol/Feature} feature OpenLayers Feature.
 * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
 * @returns {ol/Style} OpenLayers style instance.
 */
function getTextStyle(symbolizer, feature, getProperty) {
  const olStyle = cachedTextStyle(symbolizer);
  const olText = olStyle.getText();
  if (!olText) {
    return olStyle;
  }

  // Read text from feature and set it on the text style instance.
  const { label, labelplacement } = symbolizer;

  // Set text only if the label expression is dynamic.
  if (isDynamicExpression(label)) {
    const labelText = evaluate(label, feature, getProperty, '');
    // Important! OpenLayers expects the text property to always be a string.
    olText.setText(labelText.toString());
  }

  // Set rotation if expression is dynamic.
  if (labelplacement) {
    const pointPlacementRotation =
      (labelplacement.pointplacement &&
        labelplacement.pointplacement.rotation) ||
      0.0;
    if (isDynamicExpression(pointPlacementRotation)) {
      const labelRotationDegrees = evaluate(
        pointPlacementRotation,
        feature,
        getProperty,
        0.0
      );
      olText.setRotation((Math.PI * labelRotationDegrees) / 180.0); // OL rotation is in radians.
    }
  }

  // Set line or point placement according to geometry type.
  const geometry = feature.getGeometry
    ? feature.getGeometry()
    : feature.geometry;
  const geometryType = geometry.getType ? geometry.getType() : geometry.type;
  const lineplacement =
    symbolizer &&
    symbolizer.labelplacement &&
    symbolizer.labelplacement.lineplacement
      ? symbolizer.labelplacement.lineplacement
      : null;
  const placement =
    geometryType !== 'point' && lineplacement ? 'line' : 'point';
  olText.setPlacement(placement);

  // Apply dynamic style properties.
  applyDynamicTextStyling(olStyle, symbolizer, feature, getProperty);

  // Adjust font if one or more font svgparameters are dynamic.
  if (symbolizer.font && symbolizer.font.styling) {
    const fontStyling = symbolizer.font.styling || {};
    if (
      isDynamicExpression(fontStyling.fontFamily) ||
      isDynamicExpression(fontStyling.fontStyle) ||
      isDynamicExpression(fontStyling.fontWeight) ||
      isDynamicExpression(fontStyling.fontSize)
    ) {
      const fontFamily = evaluate(
        fontStyling.fontFamily,
        feature,
        getProperty,
        'sans-serif'
      );
      const fontStyle = evaluate(
        fontStyling.fontStyle,
        feature,
        getProperty,
        ''
      );
      const fontWeight = evaluate(
        fontStyling.fontWeight,
        feature,
        getProperty,
        ''
      );
      const fontSize = evaluate(fontStyling.fontSize, feature, getProperty, 10);
      const olFontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      olText.setFont(olFontString);
    }
  }

  return olStyle;
}

export default getTextStyle;
