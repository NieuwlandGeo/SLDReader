import Style from 'ol/style/style';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';
import Circle from 'ol/style/circle';

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
 * @param {StyleDescription} styleDescription rulesconverter
 * @param {string} type geometry type, @see {@link http://geojson.org|geojson}
 * @return ol.style.Style or array of it
 */
export default function OlStyler(styleDescription, type = 'Polygon') {
  const { polygon, line } = styleDescription;
  switch (type) {
    case 'Polygon':
    case 'MultiPolygon':
      return [
        new Style({
          fill: new Fill({
            color:
              polygon.fillOpacity && polygon.fill && polygon.fill.slice(0, 1) === '#'
                ? hexToRGB(polygon.fill, polygon.fillOpacity)
                : polygon.fill,
          }),
          stroke: new Stroke({
            color: polygon.stroke || '#3399CC',
            width: polygon.strokeWidth || 1.25,
            lineCap: polygon.strokeLinecap && polygon.strokeLinecap,
            lineDash: polygon.strokeDasharray && polygon.strokeDasharray.split(' '),
            lineDashOffset: polygon.strokeDashoffset && polygon.strokeDashoffset,
            lineJoin: polygon.strokeLinejoin && polygon.strokeLinejoin,
          }),
        }),
      ];
    case 'LineString':
    case 'MultiLineString':
      return [
        new Style({
          stroke: new Stroke({
            color: line.stroke || '#3399CC',
            width: line.strokeWidth || 1.25,
            lineCap: line.strokeLinecap && line.strokeLinecap,
            lineDash: line.strokeDasharray && line.strokeDasharray.split(' '),
            lineDashOffset: line.strokeDashoffset && line.strokeDashoffset,
            lineJoin: line.strokeLinejoin && line.strokeLinejoin,
          }),
        }),
      ];
    default:
      return [
        new Style({
          image: new Circle({
            radius: 2,
            fill: new Fill({
              color: 'blue',
            }),
          }),
        }),
      ];
  }
}
