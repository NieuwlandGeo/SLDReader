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
   * @param {number} resolution views resolution
   * @return {ol.style.Style} openlayers style
   */
  styleFunction(feature, resolution) {
    const rules = this.getRules(feature.getProperties());
    const style = rulesConverter(rules);
    const fill = new OlFill({
      color: style.fillColor,
    });
    const stroke = new OlStroke({
      color: style.strokeColor,
      width: style.strokeWidth,
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
  * Openlayers stylefunction
  * @external ol.StyleFunction
  * @see {@link http://openlayers.org/en/latest/apidoc/ol.html#.StyleFunction}
  */
