import {Reader} from './Reader';

/**
 * Base class for library specific style functions
 */
class Style {
  /**
   * Read xml file
   * @param  {string} sld xml string
   * @param {string} [layername] Select layer matching lowercased layername, defaults to first layer
   * @return {void}
   */
  read(sld, layername, stylename) {
    this.sld = Reader(sld);
    this.setStyle(layername, stylename);
  }
  /**
   * Change selected layer and style from sld to use
   * @param {string} layername  Select layer matching lowercased layername
   * @param {string} stylename style to use
   */
  setStyle(layername, stylename) {
    let filteredlayers;
    if (layername) {
      filteredlayers = this.sld.layers.filter(l => {
        return (l.name.toLowerCase() == layername.toLowerCase());
      });
    }
    this.layer = (filteredlayers) ? filteredlayers['0'] : this.sld.layers['0'];
    this.style = this.layer.styles.filter(s => {
      return (stylename) ? (s.name.toLowerCase() == stylename.toLowerCase) : s.default;
    })['0'];
  }


  /**
   * get sld rules for feature
   * @param  {Object} properties feature properties
   * @return {Rule} filtered sld rules
   */
  getRule(properties) {
    return {};
  }
}


export {Style};
