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
  read(sld, layername) {
    this.sld = Reader(sld);
    if (layername) {
      this.layer = this.sld.layer.filter(l => {
        if (layername) {
          return (l.name.toLowerCase() == layername);
        }
      })['0'];
    } else {
      this.layer = this.sld.layer['0'];
    }
  }
  /**
   * Change selected layer to style
   * @param {string} layername  Select layer matching lowercased layername
   */
  setLayer(layername) {
    this.layer = this.sld.layer.filter(l => {
      if (layername) {
        return (l.name.toLowerCase() == layername);
      }
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
