import {Reader} from './Reader';

const Filters = {
  featureid: (value, props) => {
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === props.fid) {
        return true;
      }
    }
    return false;
  }

};


/**
 * Base class for library specific style functions
 */
class Style {
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
   * Change selected layer and style from sld to use
   * @param {string} [layername]  Select layer matching lowercased layername
   * @param {string} [stylename] style to use
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
  getRules(properties) {
    if (!this.style) {
      throw new Error('Set a style to use');
    }
    const result = [];
    const FeatureTypeStyleLength = this.style.featuretypestyles.length;
    for (let i = 0; i < FeatureTypeStyleLength; i += 1) {
      let fttypestyle = this.style.featuretypestyles[i];
      for (let j = 0; j < fttypestyle.rules.length; j += 1) {
        let rule = fttypestyle.rules[j];
        if (rule.filter) {
          const type = Object.keys(rule.filter)['0'];
          if (Filters[type]) {
            if (Filters[type](rule.filter[type], properties)) {
              result.push(rule);
            }
          } else {
            throw new Error(`Unkown filter ${type}`);
          }
        }
      }

    }
    return result;
  }
}


export {Style};
