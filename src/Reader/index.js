import { UOM_METRE, UOM_FOOT, UOM_PIXEL, UOM_NONE } from '../constants';
import createFilter from './filter';

/**
 * @module
 */

const numericSvgProps = new Set([
  'strokeWidth',
  'strokeOpacity',
  'strokeDashoffset',
  'fillOpacity',
  'fontSize',
]);

const dimensionlessSvgProps = new Set(['strokeOpacity', 'fillOpacity']);

const parametricSvgRegex = /^data:image\/svg\+xml;base64,(.*)(\?.*)/;
const paramReplacerRegex = /param\(([^)]*)\)/g;

/**
 * Generic parser for elements with maxOccurs > 1
 * it pushes result of readNode(node) to array on obj[prop]
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold array
 * @param {object} options Parse options.
 */
function addPropArray(node, obj, prop, options) {
  const property = prop.toLowerCase();
  obj[property] = obj[property] || [];
  const item = {};
  readNode(node, item, options);
  obj[property].push(item);
}

/**
 * Parse symbolizer element and extract units of measure attribute.
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold array
 */
function addSymbolizer(node, obj, prop) {
  const property = prop.toLowerCase();
  obj[property] = obj[property] || [];
  const item = { type: 'symbolizer' };

  // Check and add if symbolizer node has uom attribute.
  // If there is no uom attribute, default to pixel.
  const uom = node.getAttribute('uom');
  if (uom) {
    switch (uom) {
      // From symbology encoding spec:
      // The following uom definitions are recommended to be used:
      case 'http://www.opengeospatial.org/se/units/metre':
        item.uom = UOM_METRE;
        break;
      case 'http://www.opengeospatial.org/se/units/foot':
        item.uom = UOM_FOOT;
        break;
      case 'http://www.opengeospatial.org/se/units/pixel':
        item.uom = UOM_PIXEL;
        break;
      default:
        console.warn(
          'Unsupported uom attribute found, one of http://www.opengeospatial.org/se/units/(metre|feet|pixel) expected.'
        );
        item.uom = UOM_PIXEL;
        break;
    }
  } else {
    item.uom = UOM_PIXEL;
  }

  readNode(node, item, { uom: item.uom });
  obj[property].push(item);
}

/**
 * Generic parser for maxOccurs = 1 (the xsd default)
 * it sets result of readNode(node) to array on obj[prop]
 * @private
 * @param {Element} node the xml element to parse
 * @param {object} obj  the object to modify
 * @param {string} prop key on obj to hold empty object
 * @param {object} options Parse options.
 */
function addProp(node, obj, prop, options) {
  const property = prop.toLowerCase();
  obj[property] = {};
  readNode(node, obj[property], options);
}

function addGraphicProp(node, obj, prop, options) {
  const property = prop.toLowerCase();
  obj[property] = {};
  readGraphicNode(node, obj[property], options);
}

function addExternalGraphicProp(node, obj, prop, options) {
  const property = prop.toLowerCase();
  obj[property] = {};
  readNode(node, obj[property], options);

  const externalgraphic = obj[property];
  if (externalgraphic.onlineresource) {
    // Trim url.
    externalgraphic.onlineresource = externalgraphic.onlineresource.trim();

    // QGIS fix: if onlineresource starts with 'base64:', repair it into a valid data url using the externalgraphic Format element.
    if (
      /^base64:/.test(externalgraphic.onlineresource) &&
      externalgraphic.format
    ) {
      const fixedPrefix = `data:${externalgraphic.format || ''};base64,`;
      const base64Data = externalgraphic.onlineresource.replace(/^base64:/, '');
      externalgraphic.onlineresource = `${fixedPrefix}${base64Data}`;
    }

    // Test if onlineresource is a parametric SVG (QGIS export).
    if (parametricSvgRegex.test(externalgraphic.onlineresource)) {
      try {
        // Parametric (embedded) SVG is exported by QGIS as <base64data>?<query parameter list>;
        const [, base64SvgXML, queryString] =
          externalgraphic.onlineresource.match(parametricSvgRegex);
        const svgXml = window.atob(base64SvgXML);
        const svgParams = new URLSearchParams(queryString);

        // Replace all 'param(name)' strings in the SVG with the value of 'name'.
        const replacedSvgXml = svgXml.replace(
          paramReplacerRegex,
          (_, paramName) => svgParams.get(paramName) || ''
        );

        // Encode fixed SVG back to base64 and assemble a new data: url.
        const fixedBase64SvgXml = window.btoa(replacedSvgXml);
        externalgraphic.onlineresource = `data:${
          externalgraphic.format || ''
        };base64,${fixedBase64SvgXml}`;
      } catch (e) {
        console.error('Error converting parametric SVG: ', e);
      }
    }
  } else if (externalgraphic.inlinecontent) {
    if (externalgraphic.encoding?.indexOf('base64') > -1) {
      externalgraphic.onlineresource = `data:${externalgraphic.format || ''};base64,${externalgraphic.inlinecontent}`;
      delete externalgraphic.inlinecontent;
    } else if (externalgraphic.encoding?.indexOf('xml') > -1) {
      const encodedXml = window.encodeURIComponent(externalgraphic.inlinecontent);
      externalgraphic.onlineresource = `data:image/svg+xml;utf8,${encodedXml}`;
      delete externalgraphic.inlinecontent;
    }
  }
}

/**
 * Assigns textcontent to obj.prop
 * @private
 * @param {Element} node [description]
 * @param {object} obj  [description]
 * @param {string} prop [description]
 * @param {object} options Parse options.
 * @param {bool} [options.trimText] Trim whitespace from text content (default false).
 */
function addPropWithTextContent(node, obj, prop, options) {
  const property = prop.toLowerCase();
  if (options && options.trimText) {
    obj[property] = node.textContent.trim();
  } else {
    obj[property] = node.textContent;
  }
}

/**
 * Assigns numeric value of text content to obj.prop.
 * Assigns NaN if the text value is not a valid text representation of a floating point number.
 * If you need a value with unit of measure, use addParameterValueProp instead.
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
 * @private
 * @param {Array<OGCExpression>} expressions An array of ogc:Expression objects.
 * @param {string} typeHint Expression type. Choose 'string' or 'number'.
 * @param {boolean} concatenateLiterals When true, and when all expressions are literals,
 * concatenate all literal expressions into a single string.
 * @param {string} uom Unit of measure.
 * @return {Array<OGCExpression>|OGCExpression|string} Simplified version of the expression array.
 */
function simplifyChildExpressions(
  expressions,
  typeHint,
  concatenateLiterals,
  uom
) {
  if (!Array.isArray(expressions)) {
    return expressions;
  }

  // Replace each literal expression with its value, unless it has units of measure that are not pixels.
  const simplifiedExpressions = expressions
    .map(expression => {
      if (
        expression.type === 'literal' &&
        !(expression.uom === UOM_METRE || expression.uom === UOM_FOOT)
      ) {
        return expression.value;
      }
      return expression;
    })
    .filter(expression => expression !== '');

  // If expression children are all literals, concatenate them into a string.
  if (concatenateLiterals) {
    const allLiteral = simplifiedExpressions.every(
      expr => typeof expr !== 'object' || expr === null
    );
    if (allLiteral) {
      return simplifiedExpressions.join('');
    }
  }

  // If expression only has one child, return child instead.
  if (simplifiedExpressions.length === 1) {
    return simplifiedExpressions[0];
  }

  return {
    type: 'expression',
    typeHint,
    uom,
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
 * @param {bool} [options.skipEmptyNodes] Default true. If true, emtpy (whitespace-only) text nodes will me omitted in the result.
 * @param {bool} [options.forceLowerCase] Default true. If true, convert prop name to lower case before adding it to obj.
 * @param {string} [options.typeHint] Default 'string'. When set to 'number', a simple literal value will be converted to a number.
 * @param {bool} [options.concatenateLiterals] Default true. When true, and when all expressions are literals,
 * @param {string} [options.uom] Unit of measure.
 * concatenate all literal expressions into a single string.
 */
function addParameterValueProp(node, obj, prop, options = {}) {
  const defaultParseOptions = {
    skipEmptyNodes: true,
    forceLowerCase: true,
    typeHint: 'string',
    concatenateLiterals: true,
    uom: UOM_NONE,
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
      if (
        childExpression.typeHint === 'number' &&
        (parseOptions.uom === UOM_METRE || parseOptions.uom === UOM_FOOT)
      ) {
        childExpression.uom = parseOptions.uom;
      }
    } else if (
      childNode.namespaceURI === 'http://www.opengis.net/ogc' &&
      childNode.localName === 'Function'
    ) {
      const functionName = childNode.getAttribute('name');
      const fallbackValue = childNode.getAttribute('fallbackValue') || null;
      childExpression.type = 'function';
      childExpression.name = functionName;
      childExpression.fallbackValue = fallbackValue;

      // Parse function parameters.
      // Parse child expressions, and add them to the comparison object.
      const parsed = {};
      addParameterValueProp(childNode, parsed, 'params', {
        ...parseOptions,
        concatenateLiterals: false,
      });
      if (Array.isArray(parsed.params.children)) {
        // Case 0 or more than 1 children.
        childExpression.params = parsed.params.children;
      } else {
        // Special case of 1 parameter.
        // An array containing one expression is simplified into the expression itself.
        childExpression.params = [parsed.params];
      }
    } else if (
      childNode.localName === 'Add' ||
      childNode.localName === 'Sub' ||
      childNode.localName === 'Mul' ||
      childNode.localName === 'Div'
    ) {
      // Convert mathematical operators to builtin function expressions.
      childExpression.type = 'function';
      childExpression.name = `__fe:${childNode.localName}__`;
      childExpression.typeHint = 'number';
      // Parse function parameters.
      // Parse child expressions, and add them to the comparison object.
      const parsed = {};
      addParameterValueProp(childNode, parsed, 'params', {
        ...parseOptions,
        concatenateLiterals: false,
      });
      if (Array.isArray(parsed.params.children)) {
        // Case 0 or more than 1 children.
        childExpression.params = parsed.params.children;
      } else {
        // Special case of 1 parameter.
        // An array containing one expression is simplified into the expression itself.
        childExpression.params = [parsed.params];
      }
    } else if (childNode.nodeName === '#cdata-section') {
      // Add CDATA section text content untrimmed.
      childExpression.type = 'literal';
      childExpression.typeHint = parseOptions.typeHint;
      childExpression.value = childNode.textContent;
    } else if (childNode.nodeType !== Node.COMMENT_NODE) {
      // Add ogc:Literal elements and plain non-comment text nodes as type:literal.
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
    parseOptions.typeHint,
    parseOptions.concatenateLiterals,
    parseOptions.uom
  );

  // Convert simple string value to number if type hint is number.
  // Keep full literal expression if unit of measure is in metre or foot.
  if (
    typeof simplifiedValue === 'string' &&
    parseOptions.typeHint === 'number'
  ) {
    // If numbers are written with 'px' at the end, they override the symbolizer's own uom.
    const uom =
      simplifiedValue.indexOf('px') > -1 ? UOM_PIXEL : parseOptions.uom;
    if (uom === UOM_METRE || uom === UOM_FOOT) {
      simplifiedValue = {
        type: 'literal',
        typeHint: 'number',
        value: parseFloat(simplifiedValue),
        uom,
      };
    } else {
      simplifiedValue = parseFloat(simplifiedValue);
    }
  }

  obj[propertyName] = simplifiedValue;
}

function addNumericParameterValueProp(node, obj, prop, options = {}) {
  addParameterValueProp(node, obj, prop, { ...options, typeHint: 'number' });
}

function addDimensionlessNumericParameterValueProp(
  node,
  obj,
  prop,
  options = {}
) {
  addParameterValueProp(node, obj, prop, {
    ...options,
    typeHint: 'number',
    uom: UOM_NONE,
  });
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
 * @param  {object} options Parse options.
 */
function addParameterValue(element, obj, prop, parameterGroup, options) {
  const parseOptions = { ...options };

  obj[parameterGroup] = obj[parameterGroup] || {};
  const name = element
    .getAttribute('name')
    .toLowerCase()
    .replace(/-(.)/g, (match, group1) => group1.toUpperCase());

  // Flag certain SVG parameters as numeric.
  // Some SVG parameters are always dimensionless (like opacity).
  let typeHint = 'string';
  let uom = parseOptions.uom;
  if (parameterGroup === 'styling') {
    if (numericSvgProps.has(name)) {
      typeHint = 'number';
    }
    if (dimensionlessSvgProps.has(name)) {
      uom = UOM_NONE;
    }
  }

  addParameterValueProp(element, obj[parameterGroup], name, {
    ...options,
    skipEmptyNodes: true,
    forceLowerCase: false,
    typeHint,
    uom,
  });
}

const FilterParsers = {
  Filter: (element, obj) => {
    obj.filter = createFilter(element, addParameterValueProp);
  },
  ElseFilter: (element, obj) => {
    obj.elsefilter = true;
  },
};

const SymbParsers = {
  PolygonSymbolizer: addSymbolizer,
  LineSymbolizer: addSymbolizer,
  PointSymbolizer: addSymbolizer,
  TextSymbolizer: addSymbolizer,
  Fill: addProp,
  Stroke: addProp,
  GraphicStroke: addProp,
  GraphicFill: (node, obj, prop, options) =>
    addProp(node, obj, prop, { ...options, uom: UOM_PIXEL }),
  Graphic: addGraphicProp,
  ExternalGraphic: addExternalGraphicProp,
  Format: addPropWithTextContent,
  Gap: addNumericParameterValueProp,
  InitialGap: addNumericParameterValueProp,
  Mark: addProp,
  Label: (node, obj, prop, options) =>
    addParameterValueProp(node, obj, prop, {
      ...options,
      skipEmptyNodes: false,
    }),
  Halo: addProp,
  Font: addProp,
  Radius: addNumericParameterValueProp,
  LabelPlacement: addProp,
  PointPlacement: addProp,
  LinePlacement: addProp,
  PerpendicularOffset: addNumericParameterValueProp,
  AnchorPoint: addProp,
  AnchorPointX: addDimensionlessNumericParameterValueProp,
  AnchorPointY: addDimensionlessNumericParameterValueProp,
  Opacity: addDimensionlessNumericParameterValueProp,
  Rotation: addDimensionlessNumericParameterValueProp,
  Displacement: addProp,
  DisplacementX: addNumericParameterValueProp,
  DisplacementY: addNumericParameterValueProp,
  Size: addNumericParameterValueProp,
  WellKnownName: addPropWithTextContent,
  MarkIndex: addNumericProp,
  VendorOption: (element, obj, prop, options) =>
    addParameterValue(element, obj, prop, 'vendoroptions', options),
  OnlineResource: (element, obj) => {
    obj.onlineresource = element.getAttribute('xlink:href');
  },
  InlineContent: (element, obj) => {
    obj.encoding = element.getAttribute('encoding');
    if (obj.encoding?.indexOf('base64') > -1) {
      obj.inlinecontent = element.textContent?.trim();
    } else if (obj.encoding?.indexOf('xml') > -1) {
      obj.inlinecontent = element.innerHTML?.trim();
    }
  },
  CssParameter: (element, obj, prop, options) =>
    addParameterValue(element, obj, prop, 'styling', options),
  SvgParameter: (element, obj, prop, options) =>
    addParameterValue(element, obj, prop, 'styling', options),
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
  Description: readNode,
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
 * @param  {object} options Parse options.
 * @return {void}
 */
function readNode(node, obj, options) {
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj, n.localName, options);
    }
  }
}

/**
 * Same as readNode, but for Graphic elements.
 * Only one Mark or ExternalGraphic is allowed, so take the first one encountered.
 * @private
 * @param  {Element} node derived from xml
 * @param  {object} obj recieves results
 * @param  {object} options Parse options.
 * @return {void}
 */
function readGraphicNode(node, obj, options) {
  let hasMarkOrExternalGraphic = false;
  for (let n = node.firstElementChild; n; n = n.nextElementSibling) {
    // Skip Mark or ExternalGraphic if another one has already been parsed.
    if (
      hasMarkOrExternalGraphic &&
      (n.localName === 'Mark' || n.localName === 'ExternalGraphic')
    ) {
      continue;
    }
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj, n.localName, options);
      if (n.localName === 'Mark' || n.localName === 'ExternalGraphic') {
        hasMarkOrExternalGraphic = true;
      }
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

  const rootNode = doc.documentElement;
  result.version = rootNode.getAttribute('version');
  readNode(rootNode, result);

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
 * @property {string} [title] Optional title.
 * @property {Filter} [filter] Optional filter expression for the rule.
 * @property {boolean} [elsefilter] Set this to true when rule has no filter expression
 * to catch everything not passing any other filter.
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
 * @property {Object<Expression>} fill.styling one object per SvgParameter with props name (camelCased)
 * @property {Object} stroke
 * @property {Object<Expression>} stroke.styling with camelcased name & value
 * */

/**
 * @typedef LineSymbolizer
 * @name LineSymbolizer
 * @description a typedef for [LineSymbolizer](http://schemas.opengis.net/se/1.1.0/Symbolizer.xsd), see also
 * [geoserver docs](http://docs.geoserver.org/stable/en/user/styling/sld/reference/linesymbolizer.html#sld-reference-linesymbolizer)
 * @property {Object} stroke
 * @property {Object<Expression>} stroke.styling one object per SvgParameter with props name (camelCased)
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
 * @property {string} graphic.externalgraphic.format
 * @property {Object} graphic.mark
 * @property {string} graphic.mark.wellknownname
 * @property {Object} graphic.mark.fill
 * @property {Object} graphic.mark.stroke
 * @property {Number} graphic.opacity
 * @property {Expression} graphic.size
 * @property {Expression} graphic.rotation
 * */
