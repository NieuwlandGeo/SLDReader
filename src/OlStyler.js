import Style from 'ol/style/style';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';
import Circle from 'ol/style/circle';
import Icon from 'ol/style/icon';
import RegularShape from 'ol/style/regularshape';

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
  const stroke = style.stroke && (style.stroke.css || style.stroke.svg);
  const fill = style.fill && (style.fill.css || style.fill.svg);
  return new Style({
    fill:
      fill
      && new Fill({
        color:
          fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
            ? hexToRGB(fill.fill, fill.fillOpacity)
            : fill.fill,
      }),
    stroke:
      stroke
      && new Stroke({
        color:
          stroke.strokeOpacity && stroke.stroke && stroke.stroke.slice(0, 1) === '#'
            ? hexToRGB(stroke.stroke, stroke.strokeOpacity)
            : stroke.stroke || '#3399CC',
        width: stroke.strokeWidth || 1.25,
        lineCap: stroke.strokeLinecap && stroke.strokeLinecap,
        lineDash: stroke.strokeDasharray && stroke.strokeDasharray.split(' '),
        lineDashOffset: stroke.strokeDashoffset && stroke.strokeDashoffset,
        lineJoin: stroke.strokeLinejoin && stroke.strokeLinejoin,
      }),
  });
}

/**
 * @private
 * @param  {LineSymbolizer} linesymbolizer [description]
 * @return {object} openlayers style
 */
function lineStyle(linesymbolizer) {
  let style = {};
  if (linesymbolizer.stroke) {
    style = linesymbolizer.stroke.css || linesymbolizer.stroke.svg;
  }
  return new Style({
    stroke: new Stroke({
      color:
        style.strokeOpacity && style.stroke && style.stroke.slice(0, 1) === '#'
          ? hexToRGB(style.stroke, style.strokeOpacity)
          : style.stroke || '#3399CC',
      width: style.strokeWidth || 1.25,
      lineCap: style.strokeLinecap && style.strokeLinecap,
      lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
      lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
      lineJoin: style.strokeLinejoin && style.strokeLinejoin,
    }),
  });
}

/**
 * @private
 * @param  {PointSymbolizer} pointsymbolizer [description]
 * @return {object} openlayers style
 */

function pointStyle(pointsymbolizer, iconsData) {
  const { graphic: style } = pointsymbolizer;
  if (style.externalgraphic && style.externalgraphic.onlineresource) {
    const src = style.externalgraphic.onlineresource;
    return !iconsData || !iconsData[src] || iconsData[src].maxSide === undefined
      ? new Style({
        image: new Icon({
          src: style.externalgraphic.onlineresource,
        }),
      })
      : new Style({
        image: new Icon({
          src: iconsData[src].src,
          scale: style.size / iconsData[src].maxSide || 1,
        }),
      });
  }
  if (style.mark) {
    let { fill, stroke } = style.mark;
    const fillColor = (fill && fill.css && fill.css.fill) || 'blue';
    fill = new Fill({
      color: fillColor,
    });
    if (stroke) {
      const { stroke: cssStroke, strokeWidth: cssStrokeWidth } = stroke.css;
      stroke = new Stroke({
        color: cssStroke || 'black',
        width: cssStrokeWidth || 2,
      });
    }
    const radius = style.size || 10;
    switch (style.mark.wellknownname) {
      case 'circle':
        return new Style({
          image: new Circle({
            fill,
            radius,
            stroke,
          }),
        });
      case 'triangle':
        return new Style({
          image: new RegularShape({
            fill,
            points: 3,
            radius,
            stroke,
          }),
        });
      case 'star':
        return new Style({
          image: new RegularShape({
            fill,
            points: 5,
            radius1: radius,
            radius2: radius / 2.5,
            stroke,
          }),
        });
      case 'cross':
        return new Style({
          image: new RegularShape({
            fill,
            points: 4,
            radius1: radius,
            radius2: 0,
            stroke:
              stroke
              || new Stroke({
                color: fillColor,
                width: radius / 2,
              }),
          }),
        });
      case 'x':
        return new Style({
          image: new RegularShape({
            angle: Math.PI / 4,
            fill,
            points: 4,
            radius1: radius,
            radius2: 0,
            stroke:
              stroke
              || new Stroke({
                color: fillColor,
                width: radius / 2,
              }),
          }),
        });
      default:
        // Default is `square`
        return new Style({
          image: new RegularShape({
            angle: Math.PI / 4,
            fill,
            points: 4,
            radius,
            stroke,
          }),
        });
    }
  }
  return new Style({
    image: new Circle({
      radius: 4,
      fill: new Fill({
        color: 'blue',
      }),
    }),
  });
}

/**
 * Create openlayers style
 * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
 * @param {GeometryStyles} GeometryStyles rulesconverter
 * @param {string} type geometry type, @see {@link http://geojson.org|geojson}
 * @param {object} iconsData preloaded data of icons mapped by source url
 * @param {string} iconsData[src].src preloaded data of icons
 * @param {object} iconsData[src].img DOM image element
 * @param {number} iconsData[src].width natural width of image in px
 * @param {number} iconsData[src].height natural height of image in px
 * @param {number} iconsData[src].maxSide max size between natural height and width in px
 * @return ol.style.Style or array of it
 */
export default function OlStyler(GeometryStyles, type = 'Polygon', iconsData) {
  const { polygon, line, point } = GeometryStyles;
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
    case 'Point':
    case 'MultiPoint':
      for (let j = 0; j < point.length; j += 1) {
        styles.push(pointStyle(point[j], iconsData));
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
