import Reader from './Reader';

/**
 * Base class for library specific style classes
 * After creating an instance you should call the read method.
 */
class Style {
  constructor() {
    this.getRules = this.getRules.bind(this);
  }

  /**
   * Read xml file
   * @param  {string} sld xml string
   * @param {string} [layername] Select layer matching case insensitive, defaults to first layer
   * @param {string} [stylename] Select style case insensitive, defaults to first style
   * @return {void}
   */
  read(sld, layername, stylename) {
    this.sld = Reader(sld);
    this.setStyle(layername, stylename);
  }

  /**
   * is layer defined in sld?
   * @deprecated use getLayer
   * @return {Boolean} [description]
   */
  hasLayer(layername) {
    return this.getLayer(layername);
  }

  getLayer(layername) {
    for (let i = 0; i < this.sld.layers.length; i += 1) {
      if (this.sld.layers[i].name.toLowerCase() === layername.toLowerCase()) {
        return this.sld.layers[i];
      }
    }
    return false;
  }
  /**
   * Change selected layer and style from sld to use
   * @param {string} [layername]  Select layer matching lowercased layername
   * @param {string} [stylename] style to use
   */
  setStyle(layername, stylename) {
    this.layer = layername ? this.getLayer(layername) : this.sld.layers['0'];
    this.style = this.layer.styles.filter(
      s => (stylename ? s.name.toLowerCase() === stylename.toLowerCase() : s.default),
    )['0'];
  }
}

export default Style;
