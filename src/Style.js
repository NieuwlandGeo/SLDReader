import {Reader} from './Reader';

const Filters = {
  FeatureId: (value, props) => {
    return (value === props.fid);
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
   * @param {string} [stylename] Select style case insensitive, defaults to first layer
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
        if (rule.filters) {
          for (let k = 0; k < rule.filters.length; k += 1) {
            let {value, type} = rule.filters[k];
            if (Filters[type]) {
              if (Filters[type](value, properties)) {
                result.push(rule);
              }
            } else {
              throw new Error(`Unkown filter ${rule.filters[k].type}`);
            }
          }
        }

      }
    }
    return result;
  }
}


export {Style};
