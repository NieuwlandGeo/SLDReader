

var parsers = {
  NamedLayer: (element, obj) => {
    let layername = getText(element, 'sld:Name');
    obj[layername] = {
      styles: []
    };
    readNode(element, obj[layername]);
  },
  UserStyle: (element, obj) => {
    let style = {
      name: getText(element, 'sld:Name'),
      default: getBool(element, 'sld:IsDefault'),
      featuretypestyles: []
    };
    readNode(element, style);
    obj.styles.push(style);
  },
  FeatureTypeStyle: (element, obj) => {
    let featuretypestyle = {
      rules: []
    };
    readNode(element, featuretypestyle);
    obj.featuretypestyles.push(featuretypestyle);

  },
  Rule: (element, obj) => {
    const rule = {};
    readNode(element, rule);
    obj.rules.push(rule);
  },
  Filter: (element, obj) => {
    obj.filters = [];
    readNode(element, obj.filters);
  },
  FeatureId: (element, obj) => {
    obj.push({
      type: 'FeatureId',
      value: element.getAttribute('fid')
    });
  },
  Name: (element, obj) => getText(element, 'sld:Name')
};

function readNode(node, obj) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj);
    }
  }
}

function getText(element, tagName) {
  const collection = element.getElementsByTagName(tagName);
  return (collection.length) ? collection.item(0).textContent : '';
}

function getBool(element, tagName) {
  const collection = element.getElementsByTagName(tagName);
  if (collection.length) {
    return (collection.item(0).textContent == true);
  }
  return false;
}

/**
 * @param  {string} sld xml string
 * @return {StyledLayerDescriptor}  object representing sld style
 */
export function reader(sld) {
  var result = {};
  var parser = new DOMParser();
  var doc = parser.parseFromString(sld, 'application/xml');

  for (let n = doc.firstChild; n; n = n.nextSibling) {
    result.version = n.getAttribute('version');
    readNode(n, result);
  }
  return result;
}


/**
 * @typedef StyledLayerDescriptor
 * @name StyledLayerDescriptor
 * @description a typedef for StyledLayerDescriptor
 * @property {string} version sld version
 * @property {array} layers info extracted from NamedLayer element
 */

/**
* @typedef Layer
* @name Layer
* @description a typedef for Layer, the actual style object for a single layer
* @property {string} name layer name
* @property {Object[]} styles
* @property {Boolean} styles[].default
* @property {Array} styles[].featuretypestyles
* @property {Rule[]} styles[].featuretypestyles[].rules
*/


/**
* @typedef Rule
* @name Rule
* @description a typedef for Rule to match a feature
* @property {string} name rule name
* @property {Object[]} filters
**/
