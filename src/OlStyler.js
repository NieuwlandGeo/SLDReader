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

function polygonStyle(style) {
  return new Style({
    fill: new Fill({
      color:
        style.fillOpacity && style.fill && style.fill.slice(0, 1) === '#'
          ? hexToRGB(style.fill, style.fillOpacity)
          : style.fill,
    }),
    stroke: new Stroke({
      color: style.stroke || '#3399CC',
      width: style.strokeWidth || 1.25,
      lineCap: style.strokeLinecap && style.strokeLinecap,
      lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
      lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
      lineJoin: style.strokeLinejoin && style.strokeLinejoin,
    }),
  });
}

function lineStyle(style) {
  return new Style({
    stroke: new Stroke({
      color: style.stroke || '#3399CC',
      width: style.strokeWidth || 1.25,
      lineCap: style.strokeLinecap && style.strokeLinecap,
      lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
      lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
      lineJoin: style.strokeLinejoin && style.strokeLinejoin,
    }),
  });
}

/**
 * Create openlayers style from object returned by rulesConverter
 * @param {StyleDescription} styleDescription rulesconverter
 * @param {string} type geometry type, @see {@link http://geojson.org|geojson}
 * @return ol.style.Style or array of it
 */
export default function OlStyler(styleDescription, type = 'Polygon') {
  const { polygon, line } = styleDescription;
  let styles = [];
  switch (type) {
    case 'Polygon':
    case 'MultiPolygon':
      for (let i = 0; i < polygon.length; i += 1) {
        styles.push(polygonStyle(polygon[i]));
      }
      break;
    case 'LineString':
    case 'MultiLineString':
      for (let j = 0; j < line.length; j += 1) {
        styles.push(lineStyle(line[j]));
      }
      break;
    default:
      styles = [
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
  return styles;
}
