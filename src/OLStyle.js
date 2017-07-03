import Style from 'ol/style/style';
import Fill from 'ol/style/fill';
import Stroke from 'ol/style/stroke';

/**
 * Openlayers styler
 */
class OLStyle extends Style {

  /**
   * An ol.styleFunction
   * @param {ol.Feature} feature openlayers feature to style
   * @param {number} resolution views resolution
   * @return {ol.style.Style} openlayers style
   */
  styleFunction(feature, resolution) {
    return new Style({

    });
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
