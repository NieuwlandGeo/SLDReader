import Style from './Style';

/**
 * The OlSLDStyle class is the entry point for openlayers users.
 */
class OlSLDStyle extends Style {

  /**
   * An ol.styleFunction
   * @param {ol.Feature} feature openlayers feature to style
   * @param {number} resolution views resolution
   * @return {ol.style.Style} openlayers style
   */
  styleFunction(feature, resolution) {
    console.log(feature, resolution);
  }

}


export default OlSLDStyle;


 /**
  * Openlayers stylefunction
  * @external ol.StyleFunction
  * @see {@link http://openlayers.org/en/latest/apidoc/ol.html#.StyleFunction}
  */
