/**
 * Create openlayers style from object returned by rulesConverter
 * @param {ol.style} style ol.style http://openlayers.org/en/latest/apidoc/ol.style.html
 * @param {object} object rulesconverter
 * @return ol.Style.Style
 */
export default function OlStyler(style, object) {
  const fill = new style.Fill({
    color: 'rgba(255,255,255,0.4)',
  });
  const stroke = new style.Stroke({
    color: '#3399CC',
    width: 1.25,
  });
  return [
    new style.Style({
      image: new style.Circle({
        fill,
        stroke,
        radius: 5,
      }),
      fill,
      stroke,
    }),
  ];
}
