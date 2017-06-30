

var parsers = {
  NamedLayer: (element, obj) => {
    obj.layers = obj.layers || [];
    let layer = {
      name: getText(element, 'sld:Name'),
      styles: []
    };
    readNode(element, layer);
    obj.layers.push(layer);
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
  Name: (element, obj) => getText(element, 'sld:Name'),
  MaxScaleDenominator: (element, obj) => getText(element, 'sld:MaxScaleDenominator'),
  PolygonSymbolizer: addProp,
  LineSymbolizer: addProp,
  PointSymbolizer: addProp,
  Fill: addProp,
  Stroke: addProp,
  ExternalGraphic: addProp,
  OnlineResource: element => getText(element, 'sld:OnlineResource'),
  CssParameter: (element, obj) => {
    obj.css = obj.css || [];
    obj.css.push({
      name: element.getAttribute('name'),
      value: element.textContent.trim()
    });
  }
};

function addProp(node, obj, prop) {
  prop = prop.toLowerCase();
  obj[prop] = {};
  readNode(node, obj[prop]);
}

function readNode(node, obj, prop) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj, n.localName);
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
* @property {FeatureTypeStyle[]} styles[].featuretypestyles
*/

/**
* @typedef FeatureTypeStyle
* @name FeatureTypeStyle
* @description a typedef for FeatureTypeStyle
* @property {Rule[]} rules
*/


/**
* @typedef Rule
* @name Rule
* @description a typedef for Rule to match a feature
* @property {string} name rule name
* @property {Filter[]} filters
* @property {PolygonSymbolizer} [polygonsymbolizer]
* @property {LineSymbolizer}  [LineSymbolizer]
* @property {PointSymbolizer} [PointSymbolizer]
**/

/**
* @typedef Filter
* @name Filter
* @description a typedef for Filter to match a feature
* @property {string} type filter type, see [ogc filter]( http://schemas.opengis.net/filter/1.1.0/filter.xsd) for possible values
* @property {Object|string} value depends on value of type. String for AbstractIdType, object keys follow sld spec otherwise
**/


/**
* @typedef PolygonSymbolizer
* @name PolygonSymbolizer
* @description a typedef for [PolygonSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} fill
* @property {array} fill.css
* @property {Object} stroke
* @property {array} stroke.css
**/

/**
* @typedef LineSymbolizer
* @name LineSymbolizer
* @description a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} stroke
* @property {array} stroke.css
**/


/**
* @typedef PointSymbolizer
* @name PointSymbolizer
* @description a typedef for [PointSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} graphic
* @property {Object} graphic.externalgraphic
* @property {Object} graphic.externalgraphic.onlineresource
**/
