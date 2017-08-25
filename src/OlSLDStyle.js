import OlStyle from 'ol/style/style';
import OlFill from 'ol/style/fill';
import OlCircle from 'ol/style/circle';
import OlStroke from 'ol/style/stroke';
import Style from './Style';
import rulesConverter from './rulesConverter';


/**
 * The OlSLDStyle class is the entry point for openlayers users.
 */
class OlSLDStyle extends Style {
  constructor() {
    super();
    this.styleFunction = this.styleFunction.bind(this);
  }

  /**
   * An ol.styleFunction
   * @param {ol.Feature} feature openlayers feature to style
   * @param {number} resolution views resolution in meters/px, recalculate if your
   * layer use different units!
   * @return {ol.style.Style} openlayers style
   */
  styleFunction(feature, resolution) {
    const props = feature.getProperties();
    props.fid = feature.getId();
    const rules = this.getRules(props, resolution);
    const style = rulesConverter(rules);
    const fill = new OlFill({
      color: (style.fillOpacity && style.fillColor && style.fillColor.slice(0, 1) === '#')
        ? hexToRGB(style.fillColor, style.fillOpacity) : style.fillColor,
    });
    const stroke = new OlStroke({
      color: style.strokeColor,
      width: style.strokeWidth,
      lineCap: (style.strokeLinecap) && style.strokeDasharray,
      lineDash: (style.strokeDasharray) && style.strokeDasharray.split(' '),
      lineDashOffset: (style.strokeDashoffset) && style.strokeDashoffset,
      lineJoin: (style.strokeLinejoin) && style.strokeLinejoin,
    });
    const styles = [
      new OlStyle({
        image: new OlCircle({
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

}


export default OlSLDStyle;

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
  * Openlayers stylefunction
  * @external ol.StyleFunction
  * @see {@link http://openlayers.org/en/latest/apidoc/ol.html#.StyleFunction}
  */
