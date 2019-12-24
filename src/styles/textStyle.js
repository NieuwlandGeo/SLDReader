import { Style, Fill, Stroke, Text } from 'ol/style';
import { hexToRGB } from '../Utils';

/**
 * @private
 * @param  {TextSymbolizer} textsymbolizer [description]
 * @param {object|Feature} feature {@link http://geojson.org|geojson}
 *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
 * @param {string} type geometry type, @see {@link http://geojson.org|geojson} for possible types
 * @return {object} openlayers style
 */
function getTextStyle(textsymbolizer, feature, options = {}) {
  if (!(textsymbolizer && textsymbolizer.label)) {
    return new Style({});
  }

  const properties = feature.getProperties
    ? feature.getProperties()
    : feature.properties;

  const parseText = {
    text: part => part,
    propertyname: (part, props = {}) => props[part] || '',
  };

  const label = textsymbolizer.label.length
    ? textsymbolizer.label
    : [textsymbolizer.label];

  const text = label.reduce((string, part) => {
    const keys = Object.keys(part);
    return (
      string +
      (keys && parseText[keys[0]]
        ? parseText[keys[0]](part[keys[0]], properties)
        : '')
    );
  }, '');

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
  const lineplacement =
    textsymbolizer &&
    textsymbolizer.labelplacement &&
    textsymbolizer.labelplacement.lineplacement
      ? textsymbolizer.labelplacement.lineplacement
      : null;
  const rotation = pointplacement.rotation ? pointplacement.rotation : 0;
  const placement =
    options.geometryType !== 'point' && lineplacement ? 'line' : 'point';

  // Halo styling
  const textStyleOptions = {
    text,
    font: `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`,
    offsetX: Number(offsetX),
    offsetY: Number(offsetY),
    rotation,
    placement,
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

// Todo: memoize constant part of text style and set style label in-place.
export default getTextStyle;
