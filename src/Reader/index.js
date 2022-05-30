import createFilter from './filter';

/**
 * @module
 */

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
 * Generic parser for elements that can be arrays
 * @private
 * @param {Element} node the xml element to parse
 * @param {object|Array} obj  the object or array to modify
 * @param {string} prop key on obj to hold array
 */
function addPropOrArray(node, obj, prop) {
  const property = prop.toLowerCase();
  const item = {};
  readNode(node, item);
  if (!(property in obj)) {
    obj[property] = item;
  } else if (Array.isArray(obj[property])) {
    obj[property].push(item);
  } else {
    obj[property] = [obj[property], item];
  }
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
 * Assigns textcontent to obj.prop
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
 * Assigns numeric value of text content to obj.prop.
 * Assigns NaN if the text value is not a valid text representation of a floating point number.
 * @private
 * @param {Element} node The XML node element.
 * @param {object} obj  The object to add the element value to.
 * @param {string} prop The property name.
 */
function addNumericProp(node, obj, prop) {
  const property = prop.toLowerCase();
  const value = parseFloat(node.textContent.trim());
  obj[property] = value;
}

/**
 * This function parses SLD XML nodes that can contain an SLD filter expression.
 * If the SLD node contains only text elements, the result will be concatenated into a string.
 * If the SLD node contains one or more non-literal nodes (for now, only PropertyName), the result
 * will be an object with type:"expression" and an array of child nodes of which one or more have
 * the type "propertyname".
 *
 * Functions and arithmetic operators (Add,Sub,Mul,Div) are not supported (yet).
 * Note: for now, only these contents will be parsed:
 * * Plain text nodes.
 * * CDATA sections.
 * * ogc:PropertyName elements (property name will be parsed as trimmed text).
 * * ogc:Literal elements (contents will be parsed as trimmed text).
 * See also:
 * * http://schemas.opengis.net/filter/1.1.0/expr.xsd
 * * https://docs.geoserver.org/stable/en/user/styling/sld/reference/filters.html#sld-filter-expression
 * @private
 * @param {Element} node XML Node.
 * @param {object} obj Object to add XML node contents to.
 * @param {string} prop Property name on obj that will hold the parsed node contents.
 * @param {bool} [skipEmptyNodes] Default true. If true, emtpy (whitespace-only) text nodes will me omitted in the result.
 */
function addFilterExpressionProp(node, obj, prop, skipEmptyNodes = true) {
  const childExpressions = [];

  for (let k = 0; k < node.childNodes.length; k += 1) {
    const childNode = node.childNodes[k];
    const childExpression = {};
    if (
      childNode.namespaceURI === 'http://www.opengis.net/ogc' &&
      childNode.localName === 'PropertyName'
    ) {
      // Add ogc:PropertyName elements as type:propertyname.
      childExpression.type = 'propertyname';
      childExpression.value = childNode.textContent.trim();
    } else if (childNode.nodeName === '#cdata-section') {
      // Add CDATA section text content untrimmed.
      childExpression.type = 'literal';
      childExpression.value = childNode.textContent;
    } else {
      // Add ogc:Literal elements and plain text nodes as type:literal.
      childExpression.type = 'literal';
      childExpression.value = childNode.textContent.trim();
    }

    if (childExpression.type === 'literal' && skipEmptyNodes) {
      if (childExpression.value.trim()) {
        childExpressions.push(childExpression);
      }
    } else {
      childExpressions.push(childExpression);
    }
  }

  const property = prop.toLowerCase();

  // If expression children are all literals, concatenate them into a string.
  const allLiteral = childExpressions.every(
    childExpression => childExpression.type === 'literal'
  );

  if (allLiteral) {
    obj[property] = childExpressions
      .map(expression => expression.value)
      .join('');
  } else {
    obj[property] = {
      type: 'expression',
      children: childExpressions,
    };
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
  const collection = element.getElementsByTagNameNS(
    'http://www.opengis.net/sld',
    tagName
  );
  if (collection.length) {
    return Boolean(collection.item(0).textContent);
  }
  return false;
}

/**
 * css and svg params
 * @private
 * @param  {Element} element
 * @param  {object} obj
 * @param  {String} prop
 */
function parameters(element, obj, prop) {
  const propnames = {
    CssParameter: 'styling',
    SvgParameter: 'styling',
    VendorOption: 'vendoroption',
  };
  const propname = propnames[prop] || 'styling';
  obj[propname] = obj[propname] || {};
  const name = element
    .getAttribute('name')
    .toLowerCase()
    .replace(/-(.)/g, (match, group1) => group1.toUpperCase());
  obj[propname][name] = element.textContent.trim();
}

const FilterParsers = {
  Filter: (element, obj) => {
    obj.filter = createFilter(element);
  },
  ElseFilter: (element, obj) => {
    obj.elsefilter = true;
  },
};

const SymbParsers = {
  PolygonSymbolizer: addPropOrArray,
  LineSymbolizer: addPropOrArray,
  PointSymbolizer: addPropOrArray,
  TextSymbolizer: addPropOrArray,
  Fill: addProp,
  Stroke: addProp,
  GraphicStroke: addProp,
  GraphicFill: addProp,
  Graphic: addProp,
  ExternalGraphic: addProp,
  Gap: addNumericProp,
  InitialGap: addNumericProp,
  Mark: addProp,
  Label: (node, obj, prop) => addFilterExpressionProp(node, obj, prop, false),
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
  Opacity: addFilterExpressionProp,
  Rotation: addFilterExpressionProp,
  Displacement: addProp,
  DisplacementX: addPropWithTextContent,
  DisplacementY: addPropWithTextContent,
  Size: addFilterExpressionProp,
  WellKnownName: addPropWithTextContent,
  VendorOption: parameters,
  OnlineResource: (element, obj) => {
    obj.onlineresource = element.getAttribute('xlink:href');
  },
  CssParameter: parameters,
  SvgParameter: parameters,
};

/**
 * Each propname is a tag in the sld that should be converted to plain object
 * @private
 * @type {Object}
 */
const parsers = {
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
    obj.featuretypestyle = obj.featuretypestyle || [];
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
  Title: addPropWithTextContent,
  Abstract: addPropWithTextContent,
  MaxScaleDenominator: addPropWithTextContent,
  MinScaleDenominator: addPropWithTextContent,
  ...FilterParsers,
  ...SymbParsers,
};

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
 * @property {Object} graphicstroke
 * @property {Object} graphicstroke.graphic
 * @property {Object} graphicstroke.graphic.mark
 * @property {string} graphicstroke.graphic.mark.wellknownname
 * @property {Object} graphicstroke.graphic.mark.fill
 * @property {Object} graphicstroke.graphic.mark.stroke
 * @property {Number} graphicstroke.graphic.opacity
 * @property {Number} graphicstroke.graphic.size
 * @property {Number} graphicstroke.graphic.rotation
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
