/**
 * Generic parser for elements with maxOccurs > 1
 * it pushes result of readNode(node) to array on obj[prop]
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold array
 */
function addPropArray(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = obj[property] || [];
  const item = {};
  readNode(node, item);
  obj[property].push(item);
}

/**
 * Generic parser for maxOccurs = 1 (the xsd default)
 * it sets result of readNode(node) to array on obj[prop]
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold empty object
 */
function addProp(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = {};
  readNode(node, obj[property]);
}

/**
 * Parser for filter comparison operators
 * @private
 * @type {[type]}
 */
function addFilterComparison(node, obj, prop) {
  obj.type = 'comparison';
  obj.operator = prop.toLowerCase();
  readNode(node, obj);
}

/**
 * Assigns textcontnet to obj.prop
 * @private
 * @param {Element} node [description]
 * @param {object} obj  [description]
 * @param {string} prop [description]
 * @param {bool} [trimText] Trim whitespace from text content (default false).
 */
function addPropWithTextContent(node, obj, prop, trimText = false) {
  const property = prop.toLowerCase();
  if (trimText) {
    obj[property] = node.textContent.trim();
  } else {
    obj[property] = node.textContent;
  }
}

/**
 * recieves boolean of element with tagName
 * @private
 * @param  {Element} element [description]
 * @param  {string} tagName [description]
 * @return {boolean}
 */
function getBool(element, tagName) {
  const collection = element.getElementsByTagNameNS('http://www.opengis.net/sld', tagName);
  if (collection.length) {
    return Boolean(collection.item(0).textContent);
  }
  return false;
}

/**
 * css and svg params
 * @private
 * @param  {[type]} element          [description]
 * @param  {[type]} obj              [description]
 * @param  {String} [propname='css'] [description]
 * @return {[type]}                  [description]
 */
function parameters(element, obj, prop) {
  const propnames = {
    CssParameter: 'css',
    SvgParameter: 'svg',
    VendorOption: 'vendoroption',
  };
  const propname = propnames[prop] || 'css';
  obj[propname] = obj[propname] || {};
  const name = element
    .getAttribute('name')
    .toLowerCase()
    .replace(/-(.)/g, (match, group1) => group1.toUpperCase());
  obj[propname][name] = element.textContent.trim();
}

/**
 * Parser for function tag
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold empty object
 */
function addFunction(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = {
    name: node.getAttribute('name'),
  };
  readNode(node, obj[property]);
}

const FilterParsers = {
  Filter: addProp,
  ElseFilter: (element, obj) => {
    obj.elsefilter = true;
  },
  Or: (element, obj) => {
    obj.type = 'or';
    obj.predicates = [];
    readNodeArray(element, obj, 'predicates');
  },
  And: (element, obj) => {
    obj.type = 'and';
    obj.predicates = [];
    readNodeArray(element, obj, 'predicates');
  },
  Not: (element, obj) => {
    obj.type = 'not';
    obj.predicate = {};
    readNode(element, obj.predicate);
  },
  PropertyIsEqualTo: addFilterComparison,
  PropertyIsNotEqualTo: addFilterComparison,
  PropertyIsLessThan: addFilterComparison,
  PropertyIsLessThanOrEqualTo: addFilterComparison,
  PropertyIsGreaterThan: addFilterComparison,
  PropertyIsGreaterThanOrEqualTo: addFilterComparison,
  PropertyIsBetween: addFilterComparison,
  PropertyIsLike: (element, obj, prop) => {
    addFilterComparison(element, obj, prop);
    obj.wildcard = element.getAttribute('wildCard');
    obj.singlechar = element.getAttribute('singleChar');
    obj.escapechar = element.getAttribute('escapeChar');
  },
  PropertyName: addPropWithTextContent,
  Literal: addPropWithTextContent,
  LowerBoundary: (element, obj, prop) => addPropWithTextContent(element, obj, prop, true),
  UpperBoundary: (element, obj, prop) => addPropWithTextContent(element, obj, prop, true),
  FeatureId: (element, obj) => {
    obj.type = 'featureid';
    obj.fids = obj.fids || [];
    obj.fids.push(element.getAttribute('fid'));
  },
};

const SymbParsers = {
  PolygonSymbolizer: addProp,
  LineSymbolizer: addProp,
  PointSymbolizer: addProp,
  TextSymbolizer: addProp,
  Fill: addProp,
  Stroke: addProp,
  Graphic: addProp,
  ExternalGraphic: addProp,
  Mark: addProp,
  Label: addTextProp,
  Halo: addProp,
  Font: addProp,
  Radius: addPropWithTextContent,
  LabelPlacement: addProp,
  PointPlacement: addProp,
  LinePlacement: addProp,
  PerpendicularOffset: addPropWithTextContent,
  AnchorPoint: addProp,
  AnchorPointX: addPropWithTextContent,
  AnchorPointY: addPropWithTextContent,
  Rotation: addPropWithTextContent,
  Displacement: addProp,
  DisplacementX: addPropWithTextContent,
  DisplacementY: addPropWithTextContent,
  Size: addPropWithTextContent,
  WellKnownName: addPropWithTextContent,
  VendorOption: parameters,
  OnlineResource: (element, obj) => {
    obj.onlineresource = element.getAttribute('xlink:href');
  },
  CssParameter: parameters,
  SvgParameter: parameters,
  Function: addFunction,
};

/**
 * Each propname is a tag in the sld that should be converted to plain object
 * @private
 * @type {Object}
 */
const parsers = Object.assign(
  {
    NamedLayer: (element, obj) => {
      addPropArray(element, obj, 'layers');
    },
    UserLayer: (element, obj) => {
      addPropArray(element, obj, 'layers');
    },
    UserStyle: (element, obj) => {
      obj.styles = obj.styles || [];
      const style = {
        default: getBool(element, 'IsDefault'),
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

    Name: addPropWithTextContent,
    MaxScaleDenominator: addPropWithTextContent,
    MinScaleDenominator: addPropWithTextContent,
  },
  FilterParsers,
  SymbParsers
);

/**
 * walks over xml nodes
 * @private
 * @param  {Element} node derived from xml
 * @param  {object} obj recieves results
 * @return {void}
 */
function readNode(node, obj) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj, n.localName);
    }
  }
}

/**
 * Parse all children of an element as an array in obj[prop]
 * @private
 * @param {Element} node parent xml element
 * @param {object} obj the object to modify
 * @param {string} prop the name of the array prop to fill with parsed child nodes
 * @return {void}
 */
function readNodeArray(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = [];
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      const childObj = {};
      parsers[n.localName](n, childObj, n.localName);
      obj[property].push(childObj);
    }
  }
}

/**
 * Generic parser for text props
 * It looks for nodeName #text and #cdata-section to get all text in labels
 * it sets result of readNode(node) to array on obj[prop]
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold empty object
 */
function addTextProp(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = [];
  Array.prototype.forEach.call(node.childNodes, child => {
    if (child && child.nodeName === '#text') {
      obj[property].push({
        text: child.textContent.trim(),
      });
    } else if (child && child.nodeName === '#cdata-section') {
      obj[property].push({
        text: child.textContent,
      });
    } else if (child && parsers[child.localName]) {
      const childObj = {};
      parsers[child.localName](child, childObj, child.localName);
      obj[property].push(childObj);
    }
  });
}

/**
 * Creates a object from an sld xml string,
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
 * @property {String} [styles[].name]
 * @property {FeatureTypeStyle[]} styles[].featuretypestyles Geoserver will draw multiple,
 * libraries as openlayers can only use one definition!
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
 * @property {Filter[]} [filter]
 * @property {boolean} [elsefilter]
 * @property {integer} [minscaledenominator]
 * @property {integer} [maxscaledenominator]
 * @property {PolygonSymbolizer} [polygonsymbolizer]
 * @property {LineSymbolizer}  [linesymbolizer]
 * @property {PointSymbolizer} [pointsymbolizer]
 * */

/**
 * A filter predicate.
 * @typedef Filter
 * @name Filter
 * @description [filter operators](http://schemas.opengis.net/filter/1.1.0/filter.xsd), see also
 * [geoserver](http://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html)
 * @property {string} type Can be 'comparison', 'and', 'or', 'not', or 'featureid'.
 * @property {Array<string>} [fids] An array of feature id's. Required for type='featureid'.
 * @property {string} [operator] Required for type='comparison'. Can be one of
 * 'propertyisequalto',
 * 'propertyisnotequalto',
 * 'propertyislessthan',
 * 'propertyislessthanorequalto',
 * 'propertyisgreaterthan',
 * 'propertyisgreaterthanorequalto',
 * 'propertyislike',
 * 'propertyisbetween'
 * @property {Filter[]} [predicates] Required for type='and' or type='or'.
 * An array of filter predicates that must all evaluate to true for 'and', or
 * for which at least one must evaluate to true for 'or'.
 * @property {Filter} [predicate] Required for type='not'. A single predicate to negate.
 * @property {string} [propertyname] Required for type='comparison'.
 * @property {string} [literal] A literal value to use in a comparison,
 * required for type='comparison'.
 * @property {string} [lowerboundary] Lower boundary, required for operator='propertyisbetween'.
 * @property {string} [upperboundary] Upper boundary, required for operator='propertyisbetween'.
 * @property {string} [wildcard] Required wildcard character for operator='propertyislike'.
 * @property {string} [singlechar] Required single char match character,
 * required for operator='propertyislike'.
 * @property {string} [escapechar] Required escape character for operator='propertyislike'.
 */

/**
 * @typedef PolygonSymbolizer
 * @name PolygonSymbolizer
 * @description a typedef for [PolygonSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also
 * [geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/polygonsymbolizer.html)
 * @property {Object} fill
 * @property {array} fill.css one object per CssParameter with props name (camelcased) & value
 * @property {Object} stroke
 * @property {Object[]} stroke.css with camelcased name & value
 * */

/**
 * @typedef LineSymbolizer
 * @name LineSymbolizer
 * @description a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also
 * [geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#sld-reference-linesymbolizer)
 * @property {Object} stroke
 * @property {Object[]} stroke.css one object per CssParameter with props name (camelcased) & value
 * */

/**
 * @typedef PointSymbolizer
 * @name PointSymbolizer
 * @description a typedef for PointSymbolizer [xsd](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd)
 * & [geoserver docs](http://docs.geoserver.org/latest/en/user/styling/sld/reference/pointsymbolizer.html)
 * @property {Object} graphic
 * @property {Object} graphic.externalgraphic
 * @property {string} graphic.externalgraphic.onlineresource
 * @property {Object} graphic.mark
 * @property {string} graphic.mark.wellknownname
 * @property {Object} graphic.mark.fill
 * @property {Object} graphic.mark.stroke
 * @property {Number} graphic.opacity
 * @property {Number} graphic.size
 * @property {Number} graphic.rotation
 * */
