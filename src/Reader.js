function addProp(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = {};
  readNode(node, obj[property]);
}

function getText(element, tagName) {
  const collection = element.getElementsByTagName(tagName);
  return (collection.length) ? collection.item(0).textContent : '';
}

function getBool(element, tagName) {
  const collection = element.getElementsByTagName(tagName);
  if (collection.length) {
    return Boolean(collection.item(0).textContent);
  }
  return false;
}

const parsers = {
  NamedLayer: (element, obj) => {
    obj.layers = obj.layers || [];
    const layer = {
      // name: getText(element, 'sld:Name'),
      styles: [],
    };
    readNode(element, layer);
    obj.layers.push(layer);
  },
  UserStyle: (element, obj) => {
    const style = {
      // name: getText(element, 'sld:Name'),
      default: getBool(element, 'sld:IsDefault'),
      featuretypestyles: [],
    };
    readNode(element, style);
    obj.styles.push(style);
  },
  FeatureTypeStyle: (element, obj) => {
    const featuretypestyle = {
      rules: [],
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
    obj.filter = {};
    readNode(element, obj.filter);
  },
  ElseFilter: (element, obj) => {
    obj.elsefilter = true;
  },
  FeatureId: (element, obj) => {
    obj.featureid = obj.featureid || [];
    obj.featureid.push(element.getAttribute('fid'));
  },
  Name: (element, obj) => {
    obj.name = element.textContent;
  },
  MaxScaleDenominator: (element, obj) => {
    obj.maxscaledenominator = element.textContent;
  },
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
      value: element.textContent.trim(),
    });
  },
};

function readNode(node, obj) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj, n.localName);
    }
  }
}


/**
 * Creates a object from an sld xml string
 * @param  {string} sld xml string
 * @return {StyledLayerDescriptor}  object representing sld style
 */
export default function Reader(sld) {
  const result = {};
  const parser = new DOMParser();
  const doc = parser.parseFromString(sld, 'application/xml');

  for (let n = doc.firstChild; n; n = n.nextSibling) {
    result.version = n.getAttribute('version');
    readNode(n, result);
  }
  return result;
}


/**
 * @typedef StyledLayerDescriptor
 * @name StyledLayerDescriptor
 * @description a typedef for StyledLayerDescriptor {@link http://schemas.opengis.net/sld/1.1/StyledLayerDescriptor.xsd xsd}
 * @property {string} version sld version
 * @property {Layer[]} layers info extracted from NamedLayer element
 */

/**
* @typedef Layer
* @name Layer
* @description a typedef for Layer, the actual style object for a single layer
* @property {string} name layer name
* @property {Object[]} styles See explanation at [Geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/styles.html)
* @property {Boolean} styles[].default
* @property {FeatureTypeStyle[]} styles[].featuretypestyles
*/

/**
* @typedef FeatureTypeStyle
* @name FeatureTypeStyle
* @description a typedef for FeatureTypeStyle: {@link http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd xsd}
* @property {Rule[]} rules
*/


/**
* @typedef Rule
* @name Rule
* @description a typedef for Rule to match a feature: {@link http://schemas.opengis.net/se/1.1.0/FeatureStyle.xsd xsd}
* @property {string} name rule name
* @property {Filter} filter
* @property {PolygonSymbolizer} [polygonsymbolizer]
* @property {LineSymbolizer}  [LineSymbolizer]
* @property {PointSymbolizer} [PointSymbolizer]
* */

/**
* @typedef Filter
* @name Filter
* @description a typedef for Filter to match a feature
* @property {string} type filter type, see [ogc filter]( http://schemas.opengis.net/filter/1.1.0/filter.xsd) for possible values
* @property {Object|string|array} value depends on type. Array of strings for ogc:_Id, eg FeatureId
* */


/**
* @typedef PolygonSymbolizer
* @name PolygonSymbolizer
* @description a typedef for [PolygonSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} fill
* @property {array} fill.css
* @property {Object} stroke
* @property {array} stroke.css
* */

/**
* @typedef LineSymbolizer
* @name LineSymbolizer
* @description a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} stroke
* @property {array} stroke.css
* */


/**
* @typedef PointSymbolizer
* @name PointSymbolizer
* @description a typedef for [PointSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
* @property {Object} graphic
* @property {Object} graphic.externalgraphic
* @property {string} graphic.externalgraphic.onlineresource
* */
