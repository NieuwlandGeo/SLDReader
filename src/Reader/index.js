import createFilter from './filter';

/**
 * @module
 */

const numericSvgProps = new Set([
  'strokeWidth',
  'strokeOpacity',
  'strokeDashOffset',
  'fillOpacity',
]);

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
 * Simplifies array of ogc:Expressions. If all expressions are literals, they will be concatenated into a string.
 * If the array contains only one expression, it will be returned.
 * If it's not an array, return unmodified.
 * @param {Array<OGCExpression>} expressions An array of ogc:Expression objects.
 * @param {string} typeHint Expression type. Choose 'string' or 'number'.
 * @return {Array<OGCExpression>|OGCExpression|string} Simplified version of the expression array.
 */
function simplifyChildExpressions(expressions, typeHint) {
  if (!Array.isArray(expressions)) {
    return expressions;
  }

  // Replace each literal expression with its value.
  const simplifiedExpressions = expressions
    .map(expression => {
      if (expression.type === 'literal') {
        return expression.value;
      }
      return expression;
    })
    .filter(expression => expression !== '');

  // If expression children are all literals, concatenate them into a string.
  const allLiteral = simplifiedExpressions.every(
    expr => typeof expr !== 'object' || expr === null
  );
  if (allLiteral) {
    return simplifiedExpressions.join('');
  }

  // If expression only has one child, return child instead.
  if (simplifiedExpressions.length === 1) {
    return simplifiedExpressions[0];
  }

  return {
    type: 'expression',
    typeHint,
    children: simplifiedExpressions,
  };
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
 * @param {object} [options] Parse options.
 * @param {object} [options.skipEmptyNodes] Default true. If true, emtpy (whitespace-only) text nodes will me omitted in the result.
 * @param {object} [options.forceLowerCase] Default true. If true, convert prop name to lower case before adding it to obj.
 * @param {object} [options.typeHint] Default 'string'. When set to 'number', a simple literal value will be converted to a number.
 */
function addParameterValueProp(node, obj, prop, options = {}) {
  const defaultParseOptions = {
    skipEmptyNodes: true,
    forceLowerCase: true,
    typeHint: 'string',
  };

  const parseOptions = {
    ...defaultParseOptions,
    ...options,
  };

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
      childExpression.typeHint = parseOptions.typeHint;
      childExpression.value = childNode.textContent.trim();
    } else if (childNode.nodeName === '#cdata-section') {
      // Add CDATA section text content untrimmed.
      childExpression.type = 'literal';
      childExpression.typeHint = parseOptions.typeHint;
      childExpression.value = childNode.textContent;
    } else {
      // Add ogc:Literal elements and plain text nodes as type:literal.
      childExpression.type = 'literal';
      childExpression.typeHint = parseOptions.typeHint;
      childExpression.value = childNode.textContent.trim();
    }

    if (childExpression.type === 'literal' && parseOptions.skipEmptyNodes) {
      if (childExpression.value.trim()) {
        childExpressions.push(childExpression);
      }
    } else {
      childExpressions.push(childExpression);
    }
  }

  const propertyName = parseOptions.forceLowerCase ? prop.toLowerCase() : prop;

  // Simplify child expressions.
  // For example: if they are all literals --> concatenate into string.
  let simplifiedValue = simplifyChildExpressions(
    childExpressions,
    parseOptions.typeHint
  );

  // Convert simple string value to number if type hint is number.
  if (
    typeof simplifiedValue === 'string' &&
    parseOptions.typeHint === 'number'
  ) {
    simplifiedValue = parseFloat(simplifiedValue);
  }

  obj[propertyName] = simplifiedValue;
}

function addNumericParameterValueProp(node, obj, prop, options = {}) {
  addParameterValueProp(node, obj, prop, { ...options, typeHint: 'number' });
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
 * @param  {string} prop
 * @param  {string} parameterGroup Name of parameter group.
 */
function addParameterValue(element, obj, prop, parameterGroup) {
  obj[parameterGroup] = obj[parameterGroup] || {};
  const name = element
    .getAttribute('name')
    .toLowerCase()
    .replace(/-(.)/g, (match, group1) => group1.toUpperCase());

  // Flag certain SVG parameters as numeric.
  let typeHint = 'string';
  if (parameterGroup === 'styling') {
    if (numericSvgProps.has(name)) {
      typeHint = 'number';
    }
  }

  addParameterValueProp(element, obj[parameterGroup], name, {
    skipEmptyNodes: true,
    forceLowerCase: false,
    typeHint,
  });
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
  PolygonSymbolizer: addPropArray,
  LineSymbolizer: addPropArray,
  PointSymbolizer: addPropArray,
  TextSymbolizer: addPropArray,
  Fill: addProp,
  Stroke: addProp,
  GraphicStroke: addProp,
  GraphicFill: addProp,
  Graphic: addProp,
  ExternalGraphic: addProp,
  Gap: addNumericParameterValueProp,
  InitialGap: addNumericParameterValueProp,
  Mark: addProp,
  Label: (node, obj, prop) =>
    addParameterValueProp(node, obj, prop, { skipEmptyNodes: false }),
  Halo: addProp,
  Font: addProp,
  Radius: addNumericParameterValueProp,
  LabelPlacement: addProp,
  PointPlacement: addProp,
  LinePlacement: addProp,
  PerpendicularOffset: addNumericParameterValueProp,
  AnchorPoint: addProp,
  AnchorPointX: addNumericParameterValueProp,
  AnchorPointY: addNumericParameterValueProp,
  Opacity: addNumericParameterValueProp,
  Rotation: addNumericParameterValueProp,
  Displacement: addProp,
  DisplacementX: addNumericParameterValueProp,
  DisplacementY: addNumericParameterValueProp,
  Size: addNumericParameterValueProp,
  WellKnownName: addPropWithTextContent,
  MarkIndex: addNumericProp,
  VendorOption: (element, obj, prop) =>
    addParameterValue(element, obj, prop, 'vendoroptions'),
  OnlineResource: (element, obj) => {
    obj.onlineresource = element.getAttribute('xlink:href');
  },
  CssParameter: (element, obj, prop) =>
    addParameterValue(element, obj, prop, 'styling'),
  SvgParameter: (element, obj, prop) =>
    addParameterValue(element, obj, prop, 'styling'),
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
  MaxScaleDenominator: addNumericProp,
  MinScaleDenominator: addNumericProp,
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
