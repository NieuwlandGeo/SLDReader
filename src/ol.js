import {reader} from './reader';

/**
 * Openlayers styler
 */
class OLStyle {
  read(sld) {
    this.sdobj = reader(sld);
  }

  /**
   * An ol.styleFunction
   * @param {ol.Feature} feature openlayers feature to style
   * @param {number} resolution views resolution
   * @return {ol.style.Style} openlayers style
   */
  styleFunction(feature, resolution) {
    return {};
  }

}


export {OLStyle};


/**
 * Openlayers feature
 * @external ol.Feature
 * @see {@link http://openlayers.org/en/latest/apidoc/ol.Feature.html}
 */


 /**
  * Openlayers style
  * @external ol.style.Style
  * @see {@link http://openlayers.org/en/latest/apidoc/ol.style.Style.html}
  */
