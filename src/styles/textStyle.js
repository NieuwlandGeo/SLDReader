import { Style, Fill, Stroke, Text } from 'ol/style';
import { hexToRGB, memoizeStyleFunction } from '../Utils';
import evaluate from '../olEvaluator';

/**
 * Get the static OL style instance for a text symbolizer.
 * The text and placement properties will be set on the style object at runtime.
 * @private
 * @param {object} textsymbolizer SLD text symbolizer object.
 * @return {object} openlayers style
 */
function textStyle(textsymbolizer) {
  if (!(textsymbolizer && textsymbolizer.label)) {
    return new Style({});
  }

  const fill = textsymbolizer.fill ? textsymbolizer.fill.styling : {};
  const halo =
    textsymbolizer.halo && textsymbolizer.halo.fill
      ? textsymbolizer.halo.fill.styling
      : {};
  const haloRadius =
    textsymbolizer.halo && textsymbolizer.halo.radius
      ? parseFloat(textsymbolizer.halo.radius)
      : 1;
  const {
    fontFamily = 'sans-serif',
    fontSize = 10,
    fontStyle = '',
    fontWeight = '',
  } =
    textsymbolizer.font && textsymbolizer.font.styling
      ? textsymbolizer.font.styling
      : {};

  const pointplacement =
    textsymbolizer &&
    textsymbolizer.labelplacement &&
    textsymbolizer.labelplacement.pointplacement
      ? textsymbolizer.labelplacement.pointplacement
      : {};
  const displacement =
    pointplacement && pointplacement.displacement
      ? pointplacement.displacement
      : {};
  const offsetX = displacement.displacementx ? displacement.displacementx : 0;
  const offsetY = displacement.displacementy ? displacement.displacementy : 0;

  const rotation = pointplacement.rotation ? pointplacement.rotation : 0;

  // Halo styling
  const textStyleOptions = {
    font: `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`,
    offsetX: Number(offsetX),
    offsetY: Number(offsetY),
    rotation,
    textAlign: 'center',
    textBaseline: 'middle',
    fill: new Fill({
      color:
        fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
          ? hexToRGB(fill.fill, fill.fillOpacity)
          : fill.fill,
    }),
  };

  if (textsymbolizer.halo) {
    textStyleOptions.stroke = new Stroke({
      color:
        halo.fillOpacity && halo.fill && halo.fill.slice(0, 1) === '#'
          ? hexToRGB(halo.fill, halo.fillOpacity)
          : halo.fill,
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

function getTextStyle(symbolizer, feature) {
  const olStyle = cachedTextStyle(symbolizer);

  // Read text from feature and set it on the text style instance.
  const { label } = symbolizer;
  const labelText = evaluate(label, feature);
  const olText = olStyle.getText();
  olText.setText(labelText);

  // Set placement dynamically.
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

  return olStyle;
}

export default getTextStyle;
