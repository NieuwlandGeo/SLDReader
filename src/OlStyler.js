/**
 * @private
 * @param  {string} hex   eg #AA00FF
 * @param  {Number} alpha eg 0.5
 * @return {string}       rgba(0,0,0,0)
 */
function hexToRGB(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (alpha) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Create openlayers style from object returned by rulesConverter
 * @param {ol.style} olstyle ol.style http://openlayers.org/en/latest/apidoc/ol.style.html
 * @param {StyleDescription} styleDescription rulesconverter
 * @return ol.Style.Style
 */
export default function OlStyler(olstyle, styleDescription) {
  const fill = new olstyle.Fill({
    color:
      styleDescription.fillOpacity &&
      styleDescription.fillColor &&
      styleDescription.fillColor.slice(0, 1) === '#'
        ? hexToRGB(styleDescription.fillColor, styleDescription.fillOpacity)
        : styleDescription.fillColor,
  });
  const stroke = new olstyle.Stroke({
    color: styleDescription.strokeColor,
    width: styleDescription.strokeWidth,
    lineCap: styleDescription.strokeLinecap && styleDescription.strokeDasharray,
    lineDash: styleDescription.strokeDasharray && styleDescription.strokeDasharray.split(' '),
    lineDashOffset: styleDescription.strokeDashoffset && styleDescription.strokeDashoffset,
    lineJoin: styleDescription.strokeLinejoin && styleDescription.strokeLinejoin,
  });
  const styles = [
    new olstyle.Style({
      image: new olstyle.Circle({
        fill,
        stroke,
        radius: 5,
      }),
      fill,
      stroke,
    }),
  ];
  return styles;
}
