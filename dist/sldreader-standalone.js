/* Version: 0.7.1 - August 7, 2025 15:57:28 */
var SLDReader = (function (exports, RenderFeature, Style, Icon, Fill, Stroke, Circle, RegularShape, render, Point, color, colorlike, IconImageCache, ImageStyle, dom, IconImage, LineString, extent, has, Polygon, MultiPolygon, Text, MultiPoint) {
  'use strict';

  const IMAGE_LOADING = 'IMAGE_LOADING';
  const IMAGE_LOADED = 'IMAGE_LOADED';
  const IMAGE_ERROR = 'IMAGE_ERROR';

  // SLD Spec: Default size for Marks without Size should be 6 pixels.
  const DEFAULT_MARK_SIZE = 6; // pixels
  // SLD Spec: Default size for ExternalGraphic with an unknown native size,
  // like SVG without dimensions, should be 16 pixels.
  const DEFAULT_EXTERNALGRAPHIC_SIZE = 16; // pixels

  // QGIS Graphic stroke placement options
  const PLACEMENT_DEFAULT = 'PLACEMENT_DEFAULT';
  const PLACEMENT_FIRSTPOINT = 'PLACEMENT_FIRSTPOINT';
  const PLACEMENT_LASTPOINT = 'PLACEMENT_LASTPOINT';

  // Supported units of measure
  const UOM_METRE = 'metre';
  const UOM_FOOT = 'foot';
  const UOM_PIXEL = 'pixel';
  // None = number is dimensionless.
  const UOM_NONE = 'none';
  const METRES_PER_FOOT = 0.3048;

  /**
   * Factory methods for filterelements
   * @see http://schemas.opengis.net/filter/1.0.0/filter.xsd
   *
   * @private
   * @module
   */

  const TYPE_COMPARISON = 'comparison';

  /**
   * @var string[] element names of binary comparison
   * @private
   */
  const BINARY_COMPARISON_NAMES = ['PropertyIsEqualTo', 'PropertyIsNotEqualTo', 'PropertyIsLessThan', 'PropertyIsLessThanOrEqualTo', 'PropertyIsGreaterThan', 'PropertyIsGreaterThanOrEqualTo'];
  const COMPARISON_NAMES = BINARY_COMPARISON_NAMES.concat(['PropertyIsLike', 'PropertyIsNull', 'PropertyIsBetween']);
  function isComparison(element) {
    return COMPARISON_NAMES.includes(element.localName);
  }
  function isBinary(element) {
    return ['or', 'and'].includes(element.localName.toLowerCase());
  }

  /**
   * factory for comparisonOps
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createComparison(element, addParameterValueProp) {
    if (BINARY_COMPARISON_NAMES.includes(element.localName)) {
      return createBinaryFilterComparison(element, addParameterValueProp);
    }
    if (element.localName === 'PropertyIsBetween') {
      return createIsBetweenComparison(element, addParameterValueProp);
    }
    if (element.localName === 'PropertyIsNull') {
      return createIsNullComparison(element, addParameterValueProp);
    }
    if (element.localName === 'PropertyIsLike') {
      return createIsLikeComparison(element, addParameterValueProp);
    }
    throw new Error(`Unknown comparison element ${element.localName}`);
  }

  /**
   * factory for element type BinaryComparisonOpType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createBinaryFilterComparison(element, addParameterValueProp) {
    const obj = {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      // Match case attribute is true by default, so only make it false if the attribute value equals 'false'.
      matchcase: element.getAttribute('matchCase') !== 'false'
    };

    // Parse child expressions, and add them to the comparison object.
    const parsed = {};
    addParameterValueProp(element, parsed, 'expressions', {
      concatenateLiterals: false
    });
    if (parsed.expressions && parsed.expressions.children) {
      obj.expression1 = parsed.expressions.children[0];
      obj.expression2 = parsed.expressions.children[1];
    }
    return obj;
  }

  /**
   * factory for element type PropertyIsLikeType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsLikeComparison(element, addParameterValueProp) {
    // A like comparison is a binary comparison expression, with extra attributes.
    const obj = createBinaryFilterComparison(element, addParameterValueProp);
    return {
      ...obj,
      wildcard: element.getAttribute('wildCard'),
      singlechar: element.getAttribute('singleChar'),
      escapechar: element.getAttribute('escapeChar')
    };
  }

  /**
   * factory for element type PropertyIsNullType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsNullComparison(element, addParameterValueProp) {
    const parsed = {};
    addParameterValueProp(element, parsed, 'expressions', {
      concatenateLiterals: false
    });
    return {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      expression: parsed.expressions
    };
  }
  /**
   * factory for element type PropertyIsBetweenType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsBetweenComparison(element, addParameterValueProp) {
    const obj = {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      // Match case attribute is true by default, so only make it false if the attribute value equals 'false'.
      matchcase: element.getAttribute('matchCase') !== 'false'
    };

    // Parse child expressions, and add them to the comparison object.
    const parsed = {};
    addParameterValueProp(element, parsed, 'expressions', {
      concatenateLiterals: false
    });
    if (parsed.expressions && parsed.expressions.children) {
      // According to spec, the child elements should be expression, lower boundary, upper boundary.
      obj.expression = parsed.expressions.children[0];
      obj.lowerboundary = parsed.expressions.children[1];
      obj.upperboundary = parsed.expressions.children[2];
    }
    return obj;
  }

  /**
   * Factory for and/or filter
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createBinaryLogic(element, addParameterValueProp) {
    const predicates = [];
    for (let n = element.firstElementChild; n; n = n.nextElementSibling) {
      if (n && isComparison(n)) {
        predicates.push(createComparison(n, addParameterValueProp));
      }
      if (n && isBinary(n)) {
        predicates.push(createBinaryLogic(n, addParameterValueProp));
      }
      if (n && n.localName.toLowerCase() === 'not') {
        predicates.push(createUnaryLogic(n, addParameterValueProp));
      }
    }
    return {
      type: element.localName.toLowerCase(),
      predicates
    };
  }

  /**
   * Factory for not filter
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createUnaryLogic(element, addParameterValueProp) {
    let predicate = null;
    const childElement = element.firstElementChild;
    if (childElement && isComparison(childElement)) {
      predicate = createComparison(childElement, addParameterValueProp);
    }
    if (childElement && isBinary(childElement)) {
      predicate = createBinaryLogic(childElement, addParameterValueProp);
    }
    if (childElement && childElement.localName.toLowerCase() === 'not') {
      predicate = createUnaryLogic(childElement, addParameterValueProp);
    }
    return {
      type: element.localName.toLowerCase(),
      predicate
    };
  }

  /**
   * Factory root filter element
   * @param {Element} element
   *
   * @return {Filter}
   */
  function createFilter(element, addParameterValueProp) {
    let filter = {};
    for (let n = element.firstElementChild; n; n = n.nextElementSibling) {
      if (isComparison(n)) {
        filter = createComparison(n, addParameterValueProp);
      }
      if (isBinary(n)) {
        filter = createBinaryLogic(n, addParameterValueProp);
      }
      if (n.localName.toLowerCase() === 'not') {
        filter = createUnaryLogic(n, addParameterValueProp);
      }
      if (n.localName.toLowerCase() === 'featureid') {
        filter.type = 'featureid';
        filter.fids = filter.fids || [];
        filter.fids.push(n.getAttribute('fid'));
      }
    }
    return filter;
  }

  /**
   * Generic expression used in SLDReader objects.
   * @typedef Expression
   * @name Expression
   * @description Modeled after [SvgParameterType](https://schemas.opengis.net/se/1.1.0/Symbolizer.xsd).
   * Can be either a primitive value (string,integer,boolean), or an object with these properties:
   * @property {string} type One of 'literal', 'propertyname', or 'function'.
   * @property {string} [typeHint] Optional type hint, used when evaluating the expression. Defaults to 'string'. Can be 'number'.
   * @property {any} [value] The primitive type representing the value of a literal expresion,
   * or a string representing the name of a propertyname expression .
   * @property {string} [name] Required for function expressions. Contains the function name.
   * @property {any} [fallbackValue] Optional fallback value when function evaluation returns null.
   * @property {Array<Expression>} [params] Required array of function parameters for function expressions.
   * @property {string} [uom] One of 'metre', 'foot', 'pixel' or 'none'. Only used for type 'literal' or 'propertyname'.
   */

  /**
   * A filter predicate.
   * @typedef Filter
   * @name Filter
   * @description [filter operators](https://schemas.opengis.net/filter/2.0/filter.xsd), see also
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
   * 'propertyisnull'
   * @property {Filter[]} [predicates] Required for type='and' or type='or'.
   * An array of filter predicates that must all evaluate to true for 'and', or
   * for which at least one must evaluate to true for 'or'.
   * @property {Filter} [predicate] Required for type='not'. A single predicate to negate.
   * @property {Expression} [expression1] First expression required for boolean comparison filters.
   * @property {Expression} [expression2] Second expression required for boolean comparison filters.
   * @property {Expression} [expression] Expression required for unary comparison filters.
   * @property {Expression} [lowerboundary] Lower boundary expression, required for operator='propertyisbetween'.
   * @property {Expression} [upperboundary] Upper boundary expression, required for operator='propertyisbetween'.
   * @property {string} [wildcard] Required wildcard character for operator='propertyislike'.
   * @property {string} [singlechar] Required single char match character,
   * required for operator='propertyislike'.
   * @property {string} [escapechar] Required escape character for operator='propertyislike'.
   */

  /**
   * @module
   */

  const numericSvgProps = new Set(['strokeWidth', 'strokeOpacity', 'strokeDashoffset', 'fillOpacity', 'fontSize']);
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
    const item = {
      type: 'symbolizer'
    };

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
          console.warn('Unsupported uom attribute found, one of http://www.opengeospatial.org/se/units/(metre|feet|pixel) expected.');
          item.uom = UOM_PIXEL;
          break;
      }
    } else {
      item.uom = UOM_PIXEL;
    }
    readNode(node, item, {
      uom: item.uom
    });
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
      if (/^base64:/.test(externalgraphic.onlineresource) && externalgraphic.format) {
        const fixedPrefix = `data:${externalgraphic.format || ''};base64,`;
        const base64Data = externalgraphic.onlineresource.replace(/^base64:/, '');
        externalgraphic.onlineresource = `${fixedPrefix}${base64Data}`;
      }

      // Test if onlineresource is a parametric SVG (QGIS export).
      if (parametricSvgRegex.test(externalgraphic.onlineresource)) {
        try {
          // Parametric (embedded) SVG is exported by QGIS as <base64data>?<query parameter list>;
          const [, base64SvgXML, queryString] = externalgraphic.onlineresource.match(parametricSvgRegex);
          const svgXml = window.atob(base64SvgXML);
          const svgParams = new URLSearchParams(queryString);

          // Replace all 'param(name)' strings in the SVG with the value of 'name'.
          const replacedSvgXml = svgXml.replace(paramReplacerRegex, (_, paramName) => svgParams.get(paramName) || '');

          // Encode fixed SVG back to base64 and assemble a new data: url.
          const fixedBase64SvgXml = window.btoa(replacedSvgXml);
          externalgraphic.onlineresource = `data:${externalgraphic.format || ''};base64,${fixedBase64SvgXml}`;
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
  function simplifyChildExpressions(expressions, typeHint, concatenateLiterals, uom) {
    if (!Array.isArray(expressions)) {
      return expressions;
    }

    // Replace each literal expression with its value, unless it has units of measure that are not pixels.
    const simplifiedExpressions = expressions.map(expression => {
      if (expression.type === 'literal' && !(expression.uom === UOM_METRE || expression.uom === UOM_FOOT)) {
        return expression.value;
      }
      return expression;
    }).filter(expression => expression !== '');

    // If expression children are all literals, concatenate them into a string.
    if (concatenateLiterals) {
      const allLiteral = simplifiedExpressions.every(expr => typeof expr !== 'object' || expr === null);
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
      children: simplifiedExpressions
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
  function addParameterValueProp(node, obj, prop) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    const defaultParseOptions = {
      skipEmptyNodes: true,
      forceLowerCase: true,
      typeHint: 'string',
      concatenateLiterals: true,
      uom: UOM_NONE
    };
    const parseOptions = {
      ...defaultParseOptions,
      ...options
    };
    const childExpressions = [];
    for (let k = 0; k < node.childNodes.length; k += 1) {
      const childNode = node.childNodes[k];
      const childExpression = {};
      if (childNode.namespaceURI === 'http://www.opengis.net/ogc' && childNode.localName === 'PropertyName') {
        // Add ogc:PropertyName elements as type:propertyname.
        childExpression.type = 'propertyname';
        childExpression.typeHint = parseOptions.typeHint;
        childExpression.value = childNode.textContent.trim();
        if (childExpression.typeHint === 'number' && (parseOptions.uom === UOM_METRE || parseOptions.uom === UOM_FOOT)) {
          childExpression.uom = parseOptions.uom;
        }
      } else if (childNode.namespaceURI === 'http://www.opengis.net/ogc' && childNode.localName === 'Function') {
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
          concatenateLiterals: false
        });
        if (Array.isArray(parsed.params.children)) {
          // Case 0 or more than 1 children.
          childExpression.params = parsed.params.children;
        } else {
          // Special case of 1 parameter.
          // An array containing one expression is simplified into the expression itself.
          childExpression.params = [parsed.params];
        }
      } else if (childNode.localName === 'Add' || childNode.localName === 'Sub' || childNode.localName === 'Mul' || childNode.localName === 'Div') {
        // Convert mathematical operators to builtin function expressions.
        childExpression.type = 'function';
        childExpression.name = `__fe:${childNode.localName}__`;
        childExpression.typeHint = 'number';
        // Parse function parameters.
        // Parse child expressions, and add them to the comparison object.
        const parsed = {};
        addParameterValueProp(childNode, parsed, 'params', {
          ...parseOptions,
          concatenateLiterals: false
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
    let simplifiedValue = simplifyChildExpressions(childExpressions, parseOptions.typeHint, parseOptions.concatenateLiterals, parseOptions.uom);

    // Convert simple string value to number if type hint is number.
    // Keep full literal expression if unit of measure is in metre or foot.
    if (typeof simplifiedValue === 'string' && parseOptions.typeHint === 'number') {
      // If numbers are written with 'px' at the end, they override the symbolizer's own uom.
      const uom = simplifiedValue.indexOf('px') > -1 ? UOM_PIXEL : parseOptions.uom;
      if (uom === UOM_METRE || uom === UOM_FOOT) {
        simplifiedValue = {
          type: 'literal',
          typeHint: 'number',
          value: parseFloat(simplifiedValue),
          uom
        };
      } else {
        simplifiedValue = parseFloat(simplifiedValue);
      }
    }
    obj[propertyName] = simplifiedValue;
  }
  function addNumericParameterValueProp(node, obj, prop) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    addParameterValueProp(node, obj, prop, {
      ...options,
      typeHint: 'number'
    });
  }
  function addDimensionlessNumericParameterValueProp(node, obj, prop) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    addParameterValueProp(node, obj, prop, {
      ...options,
      typeHint: 'number',
      uom: UOM_NONE
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
    const collection = element.getElementsByTagNameNS('http://www.opengis.net/sld', tagName);
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
    const parseOptions = {
      ...options
    };
    obj[parameterGroup] = obj[parameterGroup] || {};
    const name = element.getAttribute('name').toLowerCase().replace(/-(.)/g, (match, group1) => group1.toUpperCase());

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
      uom
    });
  }
  const FilterParsers = {
    Filter: (element, obj) => {
      obj.filter = createFilter(element, addParameterValueProp);
    },
    ElseFilter: (element, obj) => {
      obj.elsefilter = true;
    }
  };
  const SymbParsers = {
    PolygonSymbolizer: addSymbolizer,
    LineSymbolizer: addSymbolizer,
    PointSymbolizer: addSymbolizer,
    TextSymbolizer: addSymbolizer,
    Fill: addProp,
    Stroke: addProp,
    GraphicStroke: addProp,
    GraphicFill: (node, obj, prop, options) => addProp(node, obj, prop, {
      ...options,
      uom: UOM_PIXEL
    }),
    Graphic: addGraphicProp,
    ExternalGraphic: addExternalGraphicProp,
    Format: addPropWithTextContent,
    Gap: addNumericParameterValueProp,
    InitialGap: addNumericParameterValueProp,
    Mark: addProp,
    Label: (node, obj, prop, options) => addParameterValueProp(node, obj, prop, {
      ...options,
      skipEmptyNodes: false
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
    VendorOption: (element, obj, prop, options) => addParameterValue(element, obj, prop, 'vendoroptions', options),
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
    CssParameter: (element, obj, prop, options) => addParameterValue(element, obj, prop, 'styling', options),
    SvgParameter: (element, obj, prop, options) => addParameterValue(element, obj, prop, 'styling', options)
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
        featuretypestyles: []
      };
      readNode(element, style);
      obj.styles.push(style);
    },
    FeatureTypeStyle: (element, obj) => {
      obj.featuretypestyle = obj.featuretypestyle || [];
      const featuretypestyle = {
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
    Name: addPropWithTextContent,
    Title: addPropWithTextContent,
    Abstract: addPropWithTextContent,
    Description: readNode,
    MaxScaleDenominator: addNumericProp,
    MinScaleDenominator: addNumericProp,
    ...FilterParsers,
    ...SymbParsers
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
      if (hasMarkOrExternalGraphic && (n.localName === 'Mark' || n.localName === 'ExternalGraphic')) {
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
  function Reader(sld) {
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

  // This module contains a global registry of function implementations,
  // and functions to register new function implementations.

  const FunctionCache = new Map();

  /**
   * Register a function implementation by name. When evaluating the function, it will be called
   * with the values of the parameter elements evaluated for a single feature.
   * If the function returns null, the fallback value given in the SLD function element will be used instead.
   *
   * Note: take care of these possible gotcha's in the function implementation.
   * * The function will be called with the number of parameters given in the SLD function element.
   *   This number can be different from the expected number of arguments.
   * * Try to avoid throwing errors from the function implementation and return null if possible.
   * * Literal values will always be provided as strings. Convert numeric parameters to numbers yourself.
   * * Geometry valued parameters will be provided as OpenLayers geometry instances. Do not mutate these!
   * @param {string} functionName Function name.
   * @param {Function} implementation The function implementation.
   */
  function registerFunction(functionName, implementation) {
    if (typeof implementation !== 'function') {
      throw new Error('Function implementation is not a function');
    }
    FunctionCache[functionName] = implementation;
  }

  /**
   * Get a function implementation by name.
   * @param {string} functionName Function name.
   * @returns {Function} The function implementation, or null if no function with the given
   * name has been registered yet.
   */
  function getFunction(functionName) {
    return FunctionCache[functionName] || null;
  }

  /**
   * @private
   * @param {any} input Input value.
   * @returns The string representation of the input value.
   * It will always return a valid string and return an empty string for null and undefined values.
   * Other types of input will be returned as their type name.
   */
  function asString(input) {
    if (input === null) {
      return '';
    }
    const inputType = typeof input;
    switch (inputType) {
      case 'string':
        return input;
      case 'number':
      case 'bigint':
      case 'boolean':
        return input.toString();
      case 'undefined':
        return '';
      default:
        // object, function, symbol, bigint, boolean, other?
        return inputType;
    }
  }

  /**
   * Maps geometry type string to the dimension of a geometry.
   * Multipart geometries will return the dimension of their separate parts.
   * @private
   * @param {string} geometryType OpenLayers Geometry type name.
   * @returns {number} The dimension of the geometry. Will return -1 for GeometryCollection or unknown type.
   */
  function dimensionFromGeometryType(geometryType) {
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        return 0;
      case 'LineString':
      case 'LinearRing':
      case 'Circle':
      case 'MultiLineString':
        return 1;
      case 'Polygon':
      case 'MultiPolygon':
        return 2;
      default:
        return -1;
    }
  }

  // This module contains an evaluate function that takes an SLD expression and a feature and outputs the value for that feature.
  // Constant expressions are returned as-is.


  /**
   * Check if an expression depends on feature properties.
   * @private
   * @param {Expression} expression SLDReader expression object.
   * @returns {bool} Returns true if the expression depends on feature properties.
   */
  function isDynamicExpression(expression) {
    // Expressions whose pixel value changes with resolution are dynamic by definition.
    if (expression && (expression.uom === UOM_METRE || expression.uom === UOM_FOOT)) {
      return true;
    }
    switch ((expression || {}).type) {
      case 'expression':
        // Expressions with all literal child values are already concatenated into a static string,
        // so any expression that survives that process has at least one non-literal child
        // and therefore possibly dynamic component.
        return true;
      case 'literal':
        return false;
      case 'propertyname':
        return true;
      case 'function':
        // Note: assuming function expressions are dynamic is correct in most practical cases.
        // A more accurate implementation would be that a function expression is static if:
        // * The function is idempotent. You cannot tell from the implementation, unless the implementor marks it as such.
        // * All function parameter expressions are static.
        return true;
      default:
        return false;
    }
  }

  /**
   * @private
   * This function takes an SLD expression and an OL feature and outputs the expression value for that feature.
   * Constant expressions are returned as-is.
   * @param {Expression} expression SLD object expression.
   * @param {ol/feature} feature OpenLayers feature instance.
   * @param {EvaluationContext} context Evaluation context.
   * @param {any} defaultValue Optional default value to use when feature is null.
   * Signature (feature, propertyName) => property value.
   */
  function evaluate(expression, feature, context) {
    let defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    // Determine the value of the expression.
    let value = null;
    const jsType = typeof expression;
    if (jsType === 'string' || jsType === 'number' || jsType === 'undefined' || jsType === 'boolean' || expression === null) {
      // Expression value equals the expression itself if it's a native javascript type.
      value = expression;
    } else if (expression.type === 'literal') {
      // Take expression value directly from literal type expression.
      value = expression.value;
    } else if (expression.type === 'propertyname') {
      // Expression value is taken from input feature.
      // If feature is null/undefined, use default value instead.
      const propertyName = expression.value;
      if (feature) {
        // If the property name equals the geometry field name, return the feature geometry.
        if (typeof feature.getGeometryName === 'function' && propertyName === feature.getGeometryName()) {
          value = feature.getGeometry();
        } else {
          value = context.getProperty(feature, propertyName);
        }
      } else {
        value = defaultValue;
      }
    } else if (expression.type === 'expression') {
      // Expression value is the concatenation of all child expession values.
      if (expression.children.length === 1) {
        value = evaluate(expression.children[0], feature, context, defaultValue);
      } else {
        // In case of multiple child expressions, concatenate the evaluated child results.
        const childValues = [];
        for (let k = 0; k < expression.children.length; k += 1) {
          childValues.push(
          // Do not use default values when evaluating children. Only apply default is
          // the concatenated result is empty.
          evaluate(expression.children[k], feature, context, null));
        }
        value = childValues.join('');
      }
    } else if (expression.type === 'function' && expression.name === 'dimension' && feature instanceof RenderFeature) {
      // Special shortcut for the dimension function when used on a RenderFeature (vector tiles),
      // which ignores the geometry name parameter and directly outputs the dimension.
      value = dimensionFromGeometryType(feature.getType());
    } else if (expression.type === 'function') {
      const func = getFunction(expression.name);
      if (!func) {
        value = expression.fallbackValue;
      } else {
        try {
          // evaluate parameter expressions.
          const paramValues = expression.params.map(paramExpression => evaluate(paramExpression, feature, context));
          value = func(...paramValues);
        } catch {
          value = expression.fallbackValue;
        }
      }
    }

    // Do not substitute default value if the value is numeric zero.
    if (value === 0) {
      return value;
    }

    // Check if value is empty/null. If so, return default value.
    if (value === null || typeof value === 'undefined' || value === '' || Number.isNaN(value)) {
      value = defaultValue;
    }
    if (expression) {
      // Convert value to number if expression is flagged as numeric.
      if (expression.typeHint === 'number') {
        value = Number(value);
        if (Number.isNaN(value)) {
          value = defaultValue;
        }
      }
      // Convert value to pixels in case of uom = metre or feet.
      if (expression.uom === UOM_FOOT) {
        // Convert feet to metres.
        value *= METRES_PER_FOOT;
      }
      if (expression.uom === UOM_METRE || expression.uom === UOM_FOOT) {
        // Convert metres to pixels.
        const scaleFactor = context ? context.resolution : 1;
        value /= scaleFactor;
      }
    }
    return value;
  }

  function isNullOrUndefined(value) {
    return value == null;
  }
  function compareNumbers(a, b) {
    if (a < b) {
      return -1;
    }
    if (a === b) {
      return 0;
    }
    return 1;
  }
  function toNumber(text) {
    if (text === '') {
      return NaN;
    }
    return Number(text);
  }
  function compare(a, b, matchcase) {
    const aNumber = toNumber(a);
    const bNumber = toNumber(b);
    if (!(Number.isNaN(aNumber) || Number.isNaN(bNumber))) {
      return compareNumbers(aNumber, bNumber);
    }

    // If a and/or b is non-numeric, compare both values as strings.
    const aString = a.toString();
    const bString = b.toString();

    // Note: using locale compare with sensitivity option fails the CI test, while it works on my PC.
    // So, case insensitive comparison is done in a more brute-force way by using lower case comparison.
    // Original method:
    // const caseSensitiveCollator = new Intl.Collator(undefined, { sensitivity: 'case' });
    // caseSensitiveCollator.compare(string1, string2);
    if (matchcase) {
      return aString.localeCompare(bString);
    }
    return aString.toLowerCase().localeCompare(bString.toLowerCase());
  }
  function propertyIsNull(comparison, feature, context) {
    const value = evaluate(comparison.expression, feature, context);
    return isNullOrUndefined(value);
  }
  function propertyIsLessThan(comparison, feature, context) {
    const value1 = evaluate(comparison.expression1, feature, context);
    if (isNullOrUndefined(value1)) {
      return false;
    }
    const value2 = evaluate(comparison.expression2, feature, context);
    if (isNullOrUndefined(value2)) {
      return false;
    }
    return compare(value1, value2) < 0;
  }
  function propertyIsGreaterThan(comparison, feature, context) {
    const value1 = evaluate(comparison.expression1, feature, context);
    if (isNullOrUndefined(value1)) {
      return false;
    }
    const value2 = evaluate(comparison.expression2, feature, context);
    if (isNullOrUndefined(value2)) {
      return false;
    }
    return compare(value1, value2) > 0;
  }
  function propertyIsBetween(comparison, feature, context) {
    const value = evaluate(comparison.expression, feature, context);
    if (isNullOrUndefined(value)) {
      return false;
    }
    const lowerBoundary = evaluate(comparison.lowerboundary, feature, context);
    if (isNullOrUndefined(lowerBoundary)) {
      return false;
    }
    const upperBoundary = evaluate(comparison.upperboundary, feature, context);
    if (isNullOrUndefined(upperBoundary)) {
      return false;
    }
    return compare(lowerBoundary, value) <= 0 && compare(upperBoundary, value) >= 0;
  }
  function propertyIsEqualTo(comparison, feature, context) {
    const value1 = evaluate(comparison.expression1, feature, context);
    if (isNullOrUndefined(value1)) {
      return false;
    }
    const value2 = evaluate(comparison.expression2, feature, context);
    if (isNullOrUndefined(value2)) {
      return false;
    }
    if (!comparison.matchcase || typeof value1 === 'boolean' || typeof value2 === 'boolean') {
      return compare(value1, value2, false) === 0;
    }
    return value1 == value2;
  }

  // Watch out! Null-ish values should not pass propertyIsNotEqualTo,
  // just like in databases.
  // This means that PropertyIsNotEqualTo is not the same as NOT(PropertyIsEqualTo).
  function propertyIsNotEqualTo(comparison, feature, context) {
    const value1 = evaluate(comparison.expression1, feature, context);
    if (isNullOrUndefined(value1)) {
      return false;
    }
    const value2 = evaluate(comparison.expression2, feature, context);
    if (isNullOrUndefined(value2)) {
      return false;
    }
    return !propertyIsEqualTo(comparison, feature, context);
  }

  /**
   * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
   * @private
   * @param {object} comparison filter object for operator 'propertyislike'
   * @param {string|number} value Feature property value.
   * @param {EvaluationContext} context Evaluation context.
   * the value of a property from a feature.
   */
  function propertyIsLike(comparison, feature, context) {
    const value = evaluate(comparison.expression1, feature, context);
    if (isNullOrUndefined(value)) {
      return false;
    }
    const pattern = evaluate(comparison.expression2, feature, context);
    if (isNullOrUndefined(pattern)) {
      return false;
    }

    // Create regex string from match pattern.
    const {
      wildcard,
      singlechar,
      escapechar,
      matchcase
    } = comparison;

    // Replace wildcard by '.*'
    let patternAsRegex = pattern.replace(new RegExp(`[${wildcard}]`, 'g'), '.*');

    // Replace single char match by '.'
    patternAsRegex = patternAsRegex.replace(new RegExp(`[${singlechar}]`, 'g'), '.');

    // Replace escape char by '\' if escape char is not already '\'.
    if (escapechar !== '\\') {
      patternAsRegex = patternAsRegex.replace(new RegExp(`[${escapechar}]`, 'g'), '\\');
    }

    // Bookend the regular expression.
    patternAsRegex = `^${patternAsRegex}$`;
    const rex = matchcase === false ? new RegExp(patternAsRegex, 'i') : new RegExp(patternAsRegex);
    return rex.test(value);
  }

  /**
   * Test feature properties against a comparison filter.
   * @private
   * @param  {Filter} comparison A comparison filter object.
   * @param  {object} feature A feature object.
   * @param {EvaluationContext} context Evaluation context.
   * @return {bool}  does feature fullfill comparison
   */
  function doComparison(comparison, feature, context) {
    switch (comparison.operator) {
      case 'propertyislessthan':
        return propertyIsLessThan(comparison, feature, context);
      case 'propertyisequalto':
        return propertyIsEqualTo(comparison, feature, context);
      case 'propertyislessthanorequalto':
        return propertyIsEqualTo(comparison, feature, context) || propertyIsLessThan(comparison, feature, context);
      case 'propertyisnotequalto':
        return propertyIsNotEqualTo(comparison, feature, context);
      case 'propertyisgreaterthan':
        return propertyIsGreaterThan(comparison, feature, context);
      case 'propertyisgreaterthanorequalto':
        return propertyIsEqualTo(comparison, feature, context) || propertyIsGreaterThan(comparison, feature, context);
      case 'propertyisbetween':
        return propertyIsBetween(comparison, feature, context);
      case 'propertyisnull':
        return propertyIsNull(comparison, feature, context);
      case 'propertyislike':
        return propertyIsLike(comparison, feature, context);
      default:
        throw new Error(`Unkown comparison operator ${comparison.operator}`);
    }
  }
  function doFIDFilter(fids, featureId) {
    for (let i = 0; i < fids.length; i += 1) {
      if (fids[i] === featureId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calls functions from Filter object to test if feature passes filter.
   * Functions are called with filter part they match and feature.
   * @private
   * @param  {Filter} filter
   * @param  {object} feature feature
   * @param {EvaluationContext} context Evaluation context.
   * @return {boolean} True if the feature passes the conditions described by the filter object.
   */
  function filterSelector(filter, feature, context) {
    const {
      type
    } = filter;
    switch (type) {
      case 'featureid':
        return doFIDFilter(filter.fids, context.getId(feature));
      case 'comparison':
        return doComparison(filter, feature, context);
      case 'and':
        {
          if (!filter.predicates) {
            throw new Error('And filter must have predicates array.');
          }

          // And without predicates should return false.
          if (filter.predicates.length === 0) {
            return false;
          }
          return filter.predicates.every(predicate => filterSelector(predicate, feature, context));
        }
      case 'or':
        {
          if (!filter.predicates) {
            throw new Error('Or filter must have predicates array.');
          }
          return filter.predicates.some(predicate => filterSelector(predicate, feature, context));
        }
      case 'not':
        {
          if (!filter.predicate) {
            throw new Error('Not filter must have predicate.');
          }
          return !filterSelector(filter.predicate, feature, context);
        }
      default:
        throw new Error(`Unknown filter type: ${type}`);
    }
  }

  /**
   * [scaleSelector description]
   * The "standardized rendering pixel size" is defined to be 0.28mm × 0.28mm
   * @private
   * @param  {Rule} rule
   * @param  {number} resolution  m/px
   * @return {boolean}
   */
  function scaleSelector(rule, resolution) {
    if (rule.maxscaledenominator !== undefined && rule.minscaledenominator !== undefined) {
      if (resolution / 0.00028 < rule.maxscaledenominator && resolution / 0.00028 > rule.minscaledenominator) {
        return true;
      }
      return false;
    }
    if (rule.maxscaledenominator !== undefined) {
      return resolution / 0.00028 < rule.maxscaledenominator;
    }
    if (rule.minscaledenominator !== undefined) {
      return resolution / 0.00028 > rule.minscaledenominator;
    }
    return true;
  }

  /**
   * get all layer names in sld
   * @param {StyledLayerDescriptor} sld
   * @return {string[]} registered layernames
   */
  function getLayerNames(sld) {
    return sld.layers.map(l => l.name);
  }

  /**
   * Get layer definition from sld
   * @param  {StyledLayerDescriptor} sld       [description]
   * @param  {string} [layername] optional layername
   * @return {Layer}           [description]
   */
  function getLayer(sld, layername) {
    if (!layername) {
      return sld.layers['0'];
    }
    return sld.layers.find(l => l.name === layername);
  }

  /**
   * getStyleNames, notice name is not required for userstyle, you might get undefined
   * @param  {Layer} layer [description]
   * @return {string[]}       [description]
   */
  function getStyleNames(layer) {
    return layer.styles.map(s => s.name);
  }

  /**
   * get style from array layer.styles, if name is undefined it returns default style.
   * null is no style found
   * @param  {Layer} layer [description]
   * @param {string} [name] of style. If not given, the style marked as default will be returned.
   * If there is no default style, the first one will be returned.
   * @return {object} the style from layer.styles matching the name
   */
  function getStyle(layer, name) {
    if (name) {
      return layer.styles.find(s => s.name === name);
    }
    const defaultStyle = layer.styles.find(s => s.default);
    if (defaultStyle) {
      return defaultStyle;
    }
    return layer.styles[0];
  }

  /**
   * get rules for specific feature after applying filters
   * @private
   * const style = getStyle(sldLayer, stylename);
   * getRules(style.featuretypestyles['0'], geojson, resolution);
   * @param  {FeatureTypeStyle} featureTypeStyle
   * @param  {object} feature geojson
   * @param {EvaluationContext} context Evaluation context.
   * @return {Rule[]}
   */
  function getRules(featureTypeStyle, feature, context) {
    const validRules = [];
    let elseFilterCount = 0;
    for (let j = 0; j < featureTypeStyle.rules.length; j += 1) {
      const rule = featureTypeStyle.rules[j];
      // Only keep rules that pass the rule's min/max scale denominator checks.
      if (scaleSelector(rule, context.resolution)) {
        if (rule.elsefilter) {
          // In the first rule selection step, keep all rules with an ElseFilter.
          validRules.push(rule);
          elseFilterCount += 1;
        } else if (!rule.filter) {
          // Rules without filter always apply.
          validRules.push(rule);
        } else if (filterSelector(rule.filter, feature, context)) {
          // If a rule has a filter, only keep it if the feature passes the filter.
          validRules.push(rule);
        }
      }
    }

    // When eligible rules contain only rules with ElseFilter, return them all.
    // Note: the spec does not forbid more than one ElseFilter remaining at a given scale,
    // but leaves handling this case up to the implementor.
    // The SLDLibrary chooses to keep them all.
    if (elseFilterCount === validRules.length) {
      return validRules;
    }

    // If a mix of rules with and without ElseFilter remains, only keep rules without ElseFilter.
    return validRules.filter(rule => !rule.elsefilter);
  }

  /**
   * Get all symbolizers inside a given rule.
   * Note: this will be a mix of Point/Line/Polygon/Text symbolizers.
   * @param {object} rule SLD rule object.
   * @returns {Array<object>} Array of all symbolizers in a rule.
   */
  function getRuleSymbolizers(rule) {
    const allSymbolizers = [...(rule.polygonsymbolizer || []), ...(rule.linesymbolizer || []), ...(rule.pointsymbolizer || []), ...(rule.textsymbolizer || [])];
    return allSymbolizers;
  }

  /**
   * Gets a nested property from an object according to a property path.
   * Note: path fragments may not contain a ".".
   * Note: returns undefined if input obj is falsy.
   * @private
   * @example
   * getByPath({ a: { b: { c: 42 } } }, "a.b.c") // returns 42.
   * getByPath({ a: { b: { c: 42 } } }, "a.d.c") // returns undefined, because obj.a has no property .d.
   * @param {object} obj Object.
   * @param {string} path Property path.
   * @returns {any} Value of property at given path inside object, or undefined if any property
   * in the path does not exist on the object.
   */
  function getByPath(obj, path) {
    if (!obj) {
      return undefined;
    }

    // Start from the given object.
    let value = obj;

    // Walk the object property path.
    const fragments = (path || '').split('.');
    for (let k = 0; k < fragments.length; k += 1) {
      const fragment = fragments[k];
      // Return undefined if any partial path does not exist in the object.
      if (!(fragment in value)) {
        return undefined;
      }
      value = value[fragment];
    }
    return value;
  }
  const warnings = new Set();
  /**
   * Display an error message as console.warn, but only once per error message.
   * @param {string} errMsg Error message.
   */
  function warnOnce(errMsg) {
    if (!warnings.has(errMsg)) {
      console.warn(errMsg);
      warnings.add(errMsg);
    }
  }

  /**
   * Get styling from rules per geometry type
   * @private
   * @param  {Rule[]} rules [description]
   * @return {CategorizedSymbolizers}
   */
  function categorizeSymbolizers(rules) {
    const result = {
      polygonSymbolizers: [],
      lineSymbolizers: [],
      pointSymbolizers: [],
      textSymbolizers: []
    };
    (rules || []).forEach(rule => {
      if (rule.polygonsymbolizer) {
        result.polygonSymbolizers = [...result.polygonSymbolizers, ...rule.polygonsymbolizer];
      }
      if (rule.linesymbolizer) {
        result.lineSymbolizers = [...result.lineSymbolizers, ...rule.linesymbolizer];
      }
      if (rule.pointsymbolizer) {
        result.pointSymbolizers = [...result.pointSymbolizers, ...rule.pointsymbolizer];
      }
      if (rule.textsymbolizer) {
        result.textSymbolizers = [...result.textSymbolizers, ...rule.textsymbolizer];
      }
    });
    return result;
  }

  /**
   * @typedef CategorizedSymbolizers
   * @name CategorizedSymbolizers
   * @description contains for each geometry type the symbolizer from an array of rules
   * @property {PolygonSymbolizer[]} polygonSymbolizers polygonsymbolizers
   * @property {LineSymbolizer[]} lineSymbolizers  linesymbolizers
   * @property {PointSymbolizer[]} pointSymbolizers  pointsymbolizers, same as graphic prop from PointSymbolizer
   * @property {TextSymbolizer[]} textSymbolizers  textsymbolizers
   */

  // These are possible locations for an external graphic inside a symbolizer.
  const externalGraphicPaths = ['graphic.externalgraphic', 'stroke.graphicstroke.graphic.externalgraphic', 'fill.graphicfill.graphic.externalgraphic'];

  /**
   * @private
   * Global image cache. A map of image Url -> {
   *   url: image url,
   *   image: an Image instance containing image data,
   *   width: image width in pixels,
   *   height: image height in pixels
   * }
   */
  const imageCache = {};
  function setCachedImage(url, imageData) {
    imageCache[url] = imageData;
  }
  function getCachedImage(url) {
    return imageCache[url];
  }

  /**
   * @private
   * Global image loading state cache.
   * A map of image Url -> one of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'
   */
  const imageLoadingStateCache = {};
  function setImageLoadingState(url, loadingState) {
    imageLoadingStateCache[url] = loadingState;
  }
  function getImageLoadingState(url) {
    return imageLoadingStateCache[url];
  }

  /**
   * @private
   * A cache of image loading promises.
   * A map of image Url -> Promise
   * This used to prevent duplicate loading when a style references an image that's already being loaded.
   */
  const _imageLoaderCache = {};
  function getImageLoader(url) {
    return _imageLoaderCache[url];
  }
  function setImageLoader(url, loaderPromise) {
    _imageLoaderCache[url] = loaderPromise;
  }
  function invalidateExternalGraphicSymbolizers(symbolizer, imageUrl) {
    // Look at all possible paths where an externalgraphic may be present within a symbolizer.
    // When such an externalgraphic has been found, and its url equals imageUrl, invalidate the symbolizer.
    for (let k = 0; k < externalGraphicPaths.length; k += 1) {
      // Note: this process assumes that each symbolizer has at most one external graphic element.
      const path = externalGraphicPaths[k];
      const externalgraphic = getByPath(symbolizer, path);
      if (externalgraphic && externalgraphic.onlineresource === imageUrl) {
        symbolizer.__invalidated = true;
        // If the symbolizer contains a graphic stroke symbolizer,
        // also update the nested graphicstroke symbolizer object.
        if (path.indexOf('graphicstroke') > -1) {
          symbolizer.stroke.graphicstroke.__invalidated = true;
        }
      }
    }
  }
  function updateSymbolizerInvalidatedState(ruleSymbolizer, imageUrl) {
    if (!ruleSymbolizer) {
      return;
    }

    // Watch out! A symbolizer inside a rule may be a symbolizer, or an array of symbolizers.
    // Todo: refactor so rule.symbolizers property is always an array with 0..n symbolizer objects.
    if (!Array.isArray(ruleSymbolizer)) {
      invalidateExternalGraphicSymbolizers(ruleSymbolizer, imageUrl);
    } else {
      for (let k = 0; k < ruleSymbolizer.length; k += 1) {
        invalidateExternalGraphicSymbolizers(ruleSymbolizer[k], imageUrl);
      }
    }
  }

  /**
   * @private
   * Invalidate all symbolizers inside a featureTypeStyle's rules having an ExternalGraphic matching the image url
   * @param {object} featureTypeStyle A feature type style object.
   * @param {string} imageUrl The image url.
   */
  function invalidateExternalGraphics(featureTypeStyle, imageUrl) {
    if (!featureTypeStyle.rules) {
      return;
    }
    featureTypeStyle.rules.forEach(rule => {
      updateSymbolizerInvalidatedState(rule.pointsymbolizer, imageUrl);
      updateSymbolizerInvalidatedState(rule.linesymbolizer, imageUrl);
      updateSymbolizerInvalidatedState(rule.polygonsymbolizer, imageUrl);
    });
  }

  /**
   * @private
   * Creates a promise that loads an image and store it in the image cache.
   * Calling this method with the same image url twice will return the loader promise
   * that was created when this method was called the first time for that specific image url.
   * @param {string} imageUrl Image url.
   * @returns {Promise} A promise that resolves when the image is loaded and fails when the
   * image didn't load correctly.
   */
  function getCachingImageLoader(imageUrl) {
    // Check of a load is already in progress for an image.
    // If so, return the loader.
    let loader = getImageLoader(imageUrl);
    if (loader) {
      return loader;
    }

    // If no load is in progress, create a new loader and store it in the image loader cache before returning it.
    loader = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        setCachedImage(imageUrl, {
          url: imageUrl,
          image,
          width: image.naturalWidth,
          height: image.naturalHeight
        });
        setImageLoadingState(imageUrl, IMAGE_LOADED);
        resolve(imageUrl);
      };
      image.onerror = () => {
        setImageLoadingState(imageUrl, IMAGE_ERROR);
        reject();
      };
      image.src = imageUrl;
    });

    // Cache the new image loader and return it.
    setImageLoadingState(imageUrl, IMAGE_LOADING);
    setImageLoader(imageUrl, loader);
    return loader;
  }

  /**
   * @private
   * Load and cache an image that's used as externalGraphic inside a symbolizer.
   * When the image is loaded, all symbolizers within the feature type style referencing this image are invalidated,
   * and the imageLoadedCallback is called with the loaded image url.
   * @param {url} imageUrl Image url.
   * @param {object} featureTypeStyle Feature type style object.
   * @param {Function} imageLoadedCallback Will be called with the image url when image
   * has loaded. Will be called with undefined if the loading the image resulted in an error.
   */
  function loadExternalGraphic(imageUrl, featureTypeStyle, imageLoadedCallback) {
    invalidateExternalGraphics(featureTypeStyle, imageUrl);
    getCachingImageLoader(imageUrl).then(() => {
      invalidateExternalGraphics(featureTypeStyle, imageUrl);
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback(imageUrl);
      }
    }).catch(() => {
      invalidateExternalGraphics(featureTypeStyle, imageUrl);
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback();
      }
    });
  }

  /**
   * @private
   * Start loading images used in rules that have a pointsymbolizer with an externalgraphic.
   * @param {Array<object>} rules Array of SLD rule objects that pass the filter for a single feature.
   * @param {FeatureTypeStyle} featureTypeStyle The feature type style object for a layer.
   * @param {Function} imageLoadedCallback Function to call when an image has loaded.
   */
  function processExternalGraphicSymbolizers(rules, featureTypeStyle, imageLoadedCallback, callbackRef) {
    // Walk over all symbolizers inside all given rules.
    // Dive into the symbolizers to find ExternalGraphic elements and for each ExternalGraphic,
    // check if the image url has been encountered before.
    // If not -> start loading the image into the global image cache.
    rules.forEach(rule => {
      const allSymbolizers = getRuleSymbolizers(rule);
      allSymbolizers.forEach(symbolizer => {
        externalGraphicPaths.forEach(path => {
          const exgraphic = getByPath(symbolizer, path);
          if (!exgraphic) {
            return;
          }
          const imageUrl = exgraphic.onlineresource;
          const imageLoadingState = getImageLoadingState(imageUrl);
          if (!imageLoadingState || imageLoadingState === IMAGE_LOADING) {
            // Prevent adding imageLoadedCallback more than once per image per created style function
            // by inspecting the callbackRef object passed by the style function creator function.
            // Each style function has its own callbackRef dictionary.
            if (!callbackRef[imageUrl]) {
              callbackRef[imageUrl] = true;
              // Load image and when loaded, invalidate all symbolizers referencing the image
              // and invoke the imageLoadedCallback.
              loadExternalGraphic(imageUrl, featureTypeStyle, imageLoadedCallback);
            }
          }
        });
      });
    });
  }

  /**
   * @private
   * Create an OL Icon style for an external graphic.
   * The Graphic must be already loaded and present in the global imageCache.
   * @param {string} imageUrl Url of the external graphic.
   * @param {number} size Requested size in pixels.
   * @param {number} [rotationDegrees] Image rotation in degrees (clockwise). Default 0.
   */
  function createCachedImageStyle(imageUrl, size) {
    let rotationDegrees = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.0;
    const {
      image,
      width,
      height
    } = getCachedImage(imageUrl);
    return new Style({
      image: new Icon({
        img: image,
        imgSize: [width, height],
        // According to SLD spec, if size is given, image height should equal the given size.
        scale: size / height || 1,
        rotation: Math.PI * rotationDegrees / 180.0
      })
    });
  }

  const emptyStyle = new Style({});
  const defaultPointStyle = new Style({
    image: new Circle({
      radius: 8,
      fill: new Fill({
        color: 'blue',
        fillOpacity: 0.7
      })
    })
  });
  const imageLoadingPointStyle = new Style({
    image: new Circle({
      radius: 5,
      fill: new Fill({
        color: '#DDDDDD'
      }),
      stroke: new Stroke({
        width: 1,
        color: '#888888'
      })
    })
  });
  const imageLoadingPolygonStyle = new Style({
    fill: new Fill({
      color: '#DDDDDD'
    }),
    stroke: new Stroke({
      color: '#888888',
      width: 1
    })
  });
  const imageErrorPointStyle = new Style({
    image: new RegularShape({
      angle: Math.PI / 4,
      fill: new Fill({
        color: 'red'
      }),
      points: 4,
      radius: 8,
      radius2: 0,
      stroke: new Stroke({
        color: 'red',
        width: 4
      })
    })
  });
  const imageErrorPolygonStyle = new Style({
    fill: new Fill({
      color: 'red'
    }),
    stroke: new Stroke({
      color: 'red',
      width: 1
    })
  });

  /**
   * Function to memoize style conversion functions that convert sld symbolizers to OpenLayers style instances.
   * The memoized version of the style converter returns the same OL style instance if the symbolizer is the same object.
   * Uses a WeakMap internally.
   * Note: This only works for constant symbolizers.
   * @private
   * @param {Function} styleFunction Function that accepts a single symbolizer object and returns the corresponding OpenLayers style object.
   * @returns {Function} The memoized function of the style conversion function.
   */
  function memoizeStyleFunction(styleFunction) {
    const styleCache = new WeakMap();
    return symbolizer => {
      let olStyle = styleCache.get(symbolizer);

      // Create a new style if no style has been created yet, or when symbolizer has been invalidated.
      if (!olStyle || symbolizer.__invalidated) {
        olStyle = styleFunction(symbolizer);
        // Clear invalidated flag after creating a new style instance.
        symbolizer.__invalidated = false;
        styleCache.set(symbolizer, olStyle);
      }
      return olStyle;
    };
  }

  /**
   * Convert a hex color (like #AABBCC) to an rgba-string.
   * @private
   * @param  {string} hex   eg #AA00FF
   * @param  {Number} alpha eg 0.5
   * @return {string}       rgba(0,0,0,0)
   */
  function hexToRGB(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (alpha || alpha === 0) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Get color string for OpenLayers. Encodes opacity into color string if it's a number less than 1.
   * @private
   * @param {string} color Color string, encoded as #AABBCC.
   * @param {number} opacity Opacity. Non-numeric values will be treated as 1.
   * @returns {string} OpenLayers color string.
   */
  function getOLColorString(color, opacity) {
    if (opacity !== null && opacity < 1.0 && color.startsWith('#')) {
      return hexToRGB(color, opacity);
    }
    return color;
  }

  /**
   * Calculate the center-to-center distance for graphics placed along a line within a GraphicSymbolizer.
   * @private
   * @param {object} lineSymbolizer SLD line symbolizer object.
   * @param {number} graphicWidth Width of the symbolizer graphic in pixels. This size may be dependent on feature properties,
   * so it has to be supplied separately from the line symbolizer object.
   * @returns {number} Center-to-center distance for graphics along a line.
   */
  function calculateGraphicSpacing(lineSymbolizer, graphicWidth) {
    const {
      graphicstroke,
      styling
    } = lineSymbolizer.stroke;
    if ('gap' in graphicstroke) {
      // Note: gap should be a numeric property after parsing (check reader.test).
      return graphicstroke.gap + graphicWidth;
    }

    // If gap is not given, use strokeDasharray to space graphics.
    // First digit represents size of graphic, second the relative space, e.g.
    // size = 20, dash = [2 6] -> 2 ~ 20 then 6 ~ 60, total segment length should be 20 + 60 = 80
    let multiplier = 1; // default, i.e. a segment is the size of the graphic (without stroke/outline).
    if (styling && styling.strokeDasharray) {
      const dash = styling.strokeDasharray.split(' ');
      if (dash.length >= 2 && dash[0] !== 0) {
        multiplier = dash[1] / dash[0] + 1;
      }
    }
    return multiplier * graphicWidth;
  }

  /**
   * Get initial gap size from line symbolizer.
   * @private
   * @param {object} lineSymbolizer SLD line symbolizer object.
   * @returns {number} Inital gap size. Defaults to 0 if not present.
   */
  function getInitialGapSize(lineSymbolizer) {
    const {
      graphicstroke
    } = lineSymbolizer.stroke;
    return graphicstroke.initialgap || 0.0;
  }

  /**
   * @module ol/style/RadialShape
   */


  // Parts below are copy-pasted from OpenLayers source, since they are not part of the API and not exported.
  const ImageState = {
    LOADING: 1,
    LOADED: 2};
  const defaultFillStyle = '#000';
  const defaultLineCap = 'round';
  const defaultLineJoin = 'round';
  const defaultLineWidth = 1;
  const defaultMiterLimit = 10;
  const defaultStrokeStyle = '#000';

  /**
   * @private
   * Specify radius for regular polygons, or both radius and radius2 for stars.
   * @typedef {Object} Options
   * @property {import("./Fill.js").default} [fill] Fill style.
   * @property {Array<number>} radii Array of radii.
   * @property {Array<number>} angles Angles in radians.
   * @property {Array<number>} [displacement=[0, 0]] Displacement of the shape in pixels.
   * Positive values will shift the shape right and up.
   * @property {import("./Stroke.js").default} [stroke] Stroke style.
   * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
   * @property {boolean} [rotateWithView=false] Whether to rotate the shape with the view.
   * @property {number|import("../size.js").Size} [scale=1] Scale. Unless two dimensional scaling is required a better
   * result may be obtained with appropriate settings for `radius` and `radius2`.
   * @property {import('./Style.js').DeclutterMode} [declutterMode] Declutter mode.
   */

  /**
   * @private
   * @typedef {Object} RenderOptions
   * @property {import("../colorlike.js").ColorLike|undefined} strokeStyle StrokeStyle.
   * @property {number} strokeWidth StrokeWidth.
   * @property {number} size Size.
   * @property {CanvasLineCap} lineCap LineCap.
   * @property {Array<number>|null} lineDash LineDash.
   * @property {number} lineDashOffset LineDashOffset.
   * @property {CanvasLineJoin} lineJoin LineJoin.
   * @property {number} miterLimit MiterLimit.
   */

  /**
   * @classdesc
   * Set regular shape style for vector features. The resulting shape will be
   * a polygon given in radial coordinates via two arrays: radii, and angles.
   * @private
   */
  class RadialShape extends ImageStyle {
    /**
     * @param {Options} options Options.
     */
    constructor(options) {
      super({
        opacity: 1,
        rotateWithView: options.rotateWithView !== undefined ? options.rotateWithView : false,
        rotation: options.rotation !== undefined ? options.rotation : 0,
        scale: options.scale !== undefined ? options.scale : 1,
        displacement: options.displacement !== undefined ? options.displacement : [0, 0],
        declutterMode: options.declutterMode
      });

      /**
       * @private
       * @type {HTMLCanvasElement|null}
       */
      this.hitDetectionCanvas_ = null;

      /**
       * @private
       * @type {import("./Fill.js").default|null}
       */
      this.fill_ = options.fill !== undefined ? options.fill : null;

      /**
       * @private
       * @type {Array<number>}
       */
      this.origin_ = [0, 0];

      /**
       * @protected
       * @type {Array<number>}
       */
      this.radii_ = [...options.radii]; // Clone input array to prevent accidents when the original is mutated.

      /**
       * @private
       * @type {Array<number>}
       */
      this.angles_ = [...options.angles]; // Clone input array to prevent accidents when the original is mutated.

      /**
       * @private
       * @type {import("./Stroke.js").default|null}
       */
      this.stroke_ = options.stroke !== undefined ? options.stroke : null;

      /**
       * @private
       * @type {import("../size.js").Size}
       */
      this.size_;

      /**
       * @private
       * @type {RenderOptions}
       */
      this.renderOptions_;

      /**
       * @private
       */
      this.imageState_ = this.fill_ && this.fill_.loading() ? ImageState.LOADING : ImageState.LOADED;
      if (this.imageState_ === ImageState.LOADING) {
        this.ready().then(() => this.imageState_ = ImageState.LOADED);
      }
      this.render();
    }

    /**
     * Clones the style.
     * @return {RadialShape} The cloned style.
     * @api
     * @override
     */
    clone() {
      const scale = this.getScale();
      const style = new RadialShape({
        fill: this.getFill() ? this.getFill().clone() : undefined,
        radii: [...this.getRadii()],
        angles: [...this.getAngles()],
        stroke: this.getStroke() ? this.getStroke().clone() : undefined,
        rotation: this.getRotation(),
        rotateWithView: this.getRotateWithView(),
        scale: Array.isArray(scale) ? scale.slice() : scale,
        displacement: this.getDisplacement().slice(),
        declutterMode: this.getDeclutterMode()
      });
      style.setOpacity(this.getOpacity());
      return style;
    }

    /**
     * Get the anchor point in pixels. The anchor determines the center point for the
     * symbolizer.
     * @return {Array<number>} Anchor.
     * @api
     * @override
     */
    getAnchor() {
      const size = this.size_;
      const displacement = this.getDisplacement();
      const scale = this.getScaleArray();
      // anchor is scaled by renderer but displacement should not be scaled
      // so divide by scale here
      return [size[0] / 2 - displacement[0] / scale[0], size[1] / 2 + displacement[1] / scale[1]];
    }

    /**
     * Get the fill style for the shape.
     * @return {import("./Fill.js").default|null} Fill style.
     * @api
     */
    getFill() {
      return this.fill_;
    }

    /**
     * Set the fill style.
     * @param {import("./Fill.js").default|null} fill Fill style.
     * @api
     */
    setFill(fill) {
      this.fill_ = fill;
      this.render();
    }

    /**
     * @return {HTMLCanvasElement} Image element.
     * @override
     */
    getHitDetectionImage() {
      if (!this.hitDetectionCanvas_) {
        this.hitDetectionCanvas_ = this.createHitDetectionCanvas_(this.renderOptions_);
      }
      return this.hitDetectionCanvas_;
    }

    /**
     * Get the image icon.
     * @param {number} pixelRatio Pixel ratio.
     * @return {HTMLCanvasElement} Image or Canvas element.
     * @api
     * @override
     */
    getImage(pixelRatio) {
      const fillKey = this.fill_?.getKey();
      const cacheKey = `${pixelRatio},${this.angle_},${this.radii_.join()},${this.angles_.join()},${fillKey}` + Object.values(this.renderOptions_).join(',');
      let image = /** @type {HTMLCanvasElement} */
      IconImageCache.shared.get(cacheKey, null, null)?.getImage(1);
      if (!image) {
        const renderOptions = this.renderOptions_;
        const size = Math.ceil(renderOptions.size * pixelRatio);
        const context = dom.createCanvasContext2D(size, size);
        this.draw_(renderOptions, context, pixelRatio);
        image = context.canvas;
        IconImageCache.shared.set(cacheKey, null, null, new IconImage(image, undefined, null, ImageState.LOADED, null));
      }
      return image;
    }

    /**
     * Get the image pixel ratio.
     * @param {number} pixelRatio Pixel ratio.
     * @return {number} Pixel ratio.
     * @override
     */
    getPixelRatio(pixelRatio) {
      return pixelRatio;
    }

    /**
     * @return {import("../size.js").Size} Image size.
     * @override
     */
    getImageSize() {
      return this.size_;
    }

    /**
     * @return {import("../ImageState.js").default} Image state.
     * @override
     */
    getImageState() {
      return this.imageState_;
    }

    /**
     * Get the origin of the symbolizer.
     * @return {Array<number>} Origin.
     * @api
     * @override
     */
    getOrigin() {
      return this.origin_;
    }

    /**
     * Get the array of radii for the shape.
     * @return {number} Radii.
     * @api
     */
    getRadii() {
      return this.radii_;
    }

    /**
     * Get the array of angles for the shape.
     * @return {Array<number>} Angles.
     * @api
     */
    getAngles() {
      return this.angles_;
    }

    /**
     * Get the size of the symbolizer (in pixels).
     * @return {import("../size.js").Size} Size.
     * @api
     * @override
     */
    getSize() {
      return this.size_;
    }

    /**
     * Get the stroke style for the shape.
     * @return {import("./Stroke.js").default|null} Stroke style.
     * @api
     */
    getStroke() {
      return this.stroke_;
    }

    /**
     * Set the stroke style.
     * @param {import("./Stroke.js").default|null} stroke Stroke style.
     * @api
     */
    setStroke(stroke) {
      this.stroke_ = stroke;
      this.render();
    }

    /**
     * @param {function(import("../events/Event.js").default): void} listener Listener function.
     * @override
     */
    // eslint-disable-next-line no-unused-vars
    listenImageChange(listener) {}

    /**
     * Load not yet loaded URI.
     * @override
     */
    load() {}

    /**
     * @param {function(import("../events/Event.js").default): void} listener Listener function.
     * @override
     */
    // eslint-disable-next-line no-unused-vars
    unlistenImageChange(listener) {}

    /**
     * Calculate additional canvas size needed for the miter.
     * @param {string} lineJoin Line join
     * @param {number} strokeWidth Stroke width
     * @param {number} miterLimit Miter limit
     * @return {number} Additional canvas size needed
     * @private
     */
    calculateLineJoinSize_(lineJoin, strokeWidth, miterLimit) {
      if (strokeWidth === 0 || lineJoin !== 'bevel' && lineJoin !== 'miter') {
        return strokeWidth;
      }

      // m  | ^
      // i  | |\                  .
      // t >|  #\
      // e  | |\ \              .
      // r      \s\
      //      |  \t\          .                 .
      //          \r\                      .   .
      //      |    \o\      .          .  . . .
      //          e \k\            .  .    . .
      //      |      \e\  .    .  .       . .
      //       d      \ \  .  .          . .
      //      | _ _a_ _\#  .            . .
      //   r1          / `             . .
      //      |                       . .
      //       b     /               . .
      //      |                     . .
      //           / r2            . .
      //      |                        .   .
      //         /                           .   .
      //      |α                                   .   .
      //       /                                         .   .
      //      ° center
      let maxBevelAdd = 0;
      for (let idx = 0; idx < this.radii_.length; idx += 1) {
        let r1 = this.radii_[idx];
        let r2 = this.radii_[idx === this.radii_.length - 1 ? 0 : idx + 1];
        if (r1 < r2) {
          const tmp = r1;
          r1 = r2;
          r2 = tmp;
        }
        let alpha;
        if (idx < this.radii_.length - 1) {
          alpha = this.angles_[idx + 1] - this.angles_[idx];
        } else {
          alpha = 2 * Math.PI - this.angles_[idx] + this.angles_[0];
        }
        const a = r2 * Math.sin(alpha);
        const b = Math.sqrt(r2 * r2 - a * a);
        const d = r1 - b;
        const e = Math.sqrt(a * a + d * d);
        const miterRatio = e / a;
        if (lineJoin === 'miter' && miterRatio <= miterLimit) {
          maxBevelAdd = Math.max(maxBevelAdd, miterRatio * strokeWidth);
          continue;
        }
        // Calculate the distance from center to the stroke corner where
        // it was cut short because of the miter limit.
        //              l
        //        ----+---- <= distance from center to here is maxr
        //       /####|k ##\
        //      /#####^#####\
        //     /#### /+\# s #\
        //    /### h/+++\# t #\
        //   /### t/+++++\# r #\
        //  /### a/+++++++\# o #\
        // /### p/++ fill +\# k #\
        ///#### /+++++^+++++\# e #\
        //#####/+++++/+\+++++\#####\
        const k = strokeWidth / 2 / miterRatio;
        const l = strokeWidth / 2 * (d / e);
        const maxr = Math.sqrt((r1 + k) * (r1 + k) + l * l);
        const bevelAdd = maxr - r1;
        if (this.radius2_ === undefined || lineJoin === 'bevel') {
          maxBevelAdd = Math.max(maxBevelAdd, bevelAdd * 2);
          continue;
        }
        // If outer miter is over the miter limit the inner miter may reach through the
        // center and be longer than the bevel, same calculation as above but swap r1 / r2.
        const aa = r1 * Math.sin(alpha);
        const bb = Math.sqrt(r1 * r1 - aa * aa);
        const dd = r2 - bb;
        const ee = Math.sqrt(aa * aa + dd * dd);
        const innerMiterRatio = ee / aa;
        if (innerMiterRatio <= miterLimit) {
          const innerLength = innerMiterRatio * strokeWidth / 2 - r2 - r1;
          maxBevelAdd = Math.max(maxBevelAdd, 2 * Math.max(bevelAdd, innerLength));
          continue;
        }
        maxBevelAdd = Math.max(maxBevelAdd, 2 * bevelAdd);
      }
      return maxBevelAdd;
    }

    /**
     * @return {RenderOptions}  The render options
     * @protected
     */
    createRenderOptions() {
      let lineCap = defaultLineCap;
      let lineJoin = defaultLineJoin;
      let miterLimit = 0;
      let lineDash = null;
      let lineDashOffset = 0;
      let strokeStyle;
      let strokeWidth = 0;
      if (this.stroke_) {
        strokeStyle = colorlike.asColorLike(this.stroke_.getColor() ?? defaultStrokeStyle);
        strokeWidth = this.stroke_.getWidth() ?? defaultLineWidth;
        lineDash = this.stroke_.getLineDash();
        lineDashOffset = this.stroke_.getLineDashOffset() ?? 0;
        lineJoin = this.stroke_.getLineJoin() ?? defaultLineJoin;
        lineCap = this.stroke_.getLineCap() ?? defaultLineCap;
        miterLimit = this.stroke_.getMiterLimit() ?? defaultMiterLimit;
      }
      const add = this.calculateLineJoinSize_(lineJoin, strokeWidth, miterLimit);
      let maxRadius = 0;
      this.radii_.forEach(radius => {
        maxRadius = Math.max(maxRadius, radius);
      });
      const size = Math.ceil(2 * maxRadius + add);
      return {
        strokeStyle: strokeStyle,
        strokeWidth: strokeWidth,
        size: size,
        lineCap: lineCap,
        lineDash: lineDash,
        lineDashOffset: lineDashOffset,
        lineJoin: lineJoin,
        miterLimit: miterLimit
      };
    }

    /**
     * @protected
     */
    render() {
      this.renderOptions_ = this.createRenderOptions();
      const size = this.renderOptions_.size;
      this.hitDetectionCanvas_ = null;
      this.size_ = [size, size];
    }

    /**
     * @private
     * @param {RenderOptions} renderOptions Render options.
     * @param {CanvasRenderingContext2D} context The rendering context.
     * @param {number} pixelRatio The pixel ratio.
     */
    draw_(renderOptions, context, pixelRatio) {
      context.scale(pixelRatio, pixelRatio);
      // set origin to canvas center
      context.translate(renderOptions.size / 2, renderOptions.size / 2);
      this.createPath_(context);
      if (this.fill_) {
        let color = this.fill_.getColor();
        if (color === null) {
          color = defaultFillStyle;
        }
        context.fillStyle = colorlike.asColorLike(color);
        context.fill();
      }
      if (renderOptions.strokeStyle) {
        context.strokeStyle = renderOptions.strokeStyle;
        context.lineWidth = renderOptions.strokeWidth;
        if (renderOptions.lineDash) {
          context.setLineDash(renderOptions.lineDash);
          context.lineDashOffset = renderOptions.lineDashOffset;
        }
        context.lineCap = renderOptions.lineCap;
        context.lineJoin = renderOptions.lineJoin;
        context.miterLimit = renderOptions.miterLimit;
        context.stroke();
      }
    }

    /**
     * @private
     * @param {RenderOptions} renderOptions Render options.
     * @return {HTMLCanvasElement} Canvas containing the icon
     */
    createHitDetectionCanvas_(renderOptions) {
      let context;
      if (this.fill_) {
        let color$1 = this.fill_.getColor();

        // determine if fill is transparent (or pattern or gradient)
        let opacity = 0;
        if (typeof color$1 === 'string') {
          color$1 = color.asArray(color$1);
        }
        if (color$1 === null) {
          opacity = 1;
        } else if (Array.isArray(color$1)) {
          opacity = color$1.length === 4 ? color$1[3] : 1;
        }
        if (opacity === 0) {
          // if a transparent fill style is set, create an extra hit-detection image
          // with a default fill style
          context = dom.createCanvasContext2D(renderOptions.size, renderOptions.size);
          this.drawHitDetectionCanvas_(renderOptions, context);
        }
      }
      return context ? context.canvas : this.getImage(1);
    }

    /**
     * @private
     * @param {CanvasRenderingContext2D} context The context to draw in.
     */
    createPath_(context) {
      for (let k = 0; k < this.radii_.length; k += 1) {
        const radius = this.radii_[k];
        const angle = this.angles_[k];
        // Watch out: image coordinates have y pointing downwards!
        context.lineTo(radius * Math.cos(angle), -radius * Math.sin(angle));
      }
      context.closePath();
    }

    /**
     * @private
     * @param {RenderOptions} renderOptions Render options.
     * @param {CanvasRenderingContext2D} context The context.
     */
    drawHitDetectionCanvas_(renderOptions, context) {
      // set origin to canvas center
      context.translate(renderOptions.size / 2, renderOptions.size / 2);
      this.createPath_(context);
      context.fillStyle = defaultFillStyle;
      context.fill();
      if (renderOptions.strokeStyle) {
        context.strokeStyle = renderOptions.strokeStyle;
        context.lineWidth = renderOptions.strokeWidth;
        if (renderOptions.lineDash) {
          context.setLineDash(renderOptions.lineDash);
          context.lineDashOffset = renderOptions.lineDashOffset;
        }
        context.lineJoin = renderOptions.lineJoin;
        context.miterLimit = renderOptions.miterLimit;
        context.stroke();
      }
    }

    /**
     * @override
     */
    ready() {
      return this.fill_ ? this.fill_.ready() : Promise.resolve();
    }
  }

  // Custom symbols that cannot be represented as RegularShape.
  // Coordinates are normalized within a [-1,-1,1,1] square and will be scaled by size/2 when rendered.
  // Shapes are auto-closed, so no need to make the last coordinate equal to the first.
  const customSymbols = {
    arrow: [[0, 1], [-0.5, 0.5], [-0.25, 0.5], [-0.25, -1], [0.25, -1], [0.25, 0.5], [0.5, 0.5]],
    arrowhead: [[0, 0], [-1, 1], [0, 0], [-1, -1]],
    filled_arrowhead: [[0, 0], [-1, 1], [-1, -1]],
    cross_fill: [[1, 0.2], [0.2, 0.2], [0.2, 1], [-0.2, 1], [-0.2, 0.2], [-1, 0.2], [-1, -0.2], [-0.2, -0.2], [-0.2, -1], [0.2, -1], [0.2, -0.2], [1, -0.2]],
    quarter_square: [[0, 0], [0, 1], [-1, 1], [-1, 0]],
    half_square: [[0, 1], [-1, 1], [-1, -1], [0, -1]],
    diagonal_half_square: [[-1, 1], [-1, -1], [1, -1]],
    // In QGIS, right_half_triangle apparently means "skip the right half of the triangle".
    right_half_triangle: [[0, 1], [-1, -1], [0, -1]],
    left_half_triangle: [[0, 1], [0, -1], [1, -1]],
    'shape://carrow': [[0, 0], [-1, 0.4], [-1, -0.4]],
    'shape://oarrow': [[0, 0], [-1, 0.4], [0, 0], [-1, -0.4]]
  };

  /**
   * Get registered custom symbol coordinate array.
   * @private
   * @param {string} name Wellknown symbol name.
   * @returns {Array<Array<number>>} Custom symbol coordinates inside the [-1,-1,1,1] square.
   */
  function getCustomSymbolCoordinates(name) {
    return customSymbols[name];
  }

  /**
   * Register a custom symbol for use as a graphic.
   * Custom symbols are referenced by WellKnownName inside a Mark.
   * Custom symbol coordinates must be entered in counterclockwise order and must all lie within [-1,-1,1,1].
   * The first and last coordinates must not be equal. The shape will be closed automatically.
   * @param {string} wellknownname Custom symbol name.
   * @param {Array<Array<number>>} normalizedCoordinates Array of coordinates.
   * @returns {void}
   */
  function registerCustomSymbol(name, normalizedCoordinates) {
    // Verify that input coordinates lie outside the expected [-1,-1,1,1] square.
    const allInside = normalizedCoordinates.every(_ref => {
      let [x, y] = _ref;
      return x >= -1 && x <= 1 && y >= -1 && y <= 1;
    });
    if (!allInside) {
      throw new Error('Custom symbol coordinates must lie within [-1,-1,1,1].');
    }

    // Verify that input shape is not closed.
    const [x1, y1] = normalizedCoordinates[0];
    const [xN, yN] = normalizedCoordinates[normalizedCoordinates.length - 1];
    if (x1 === xN && y1 === yN) {
      throw new Error('Custom symbol start and end coordinate should not be the same. Custom symbols will close themselves.');
    }
    customSymbols[name] = normalizedCoordinates;
  }

  const HALF_CIRCLE_RESOLUTION = 96; // Number of points to approximate half a circle as radial shape.

  /**
   * Test render a point with an image style (or subclass). Will throw an error if rendering a point fails.
   * @private
   * @param {ol/styleImage} olImage OpenLayers Image style (or subclass) instance.
   * @returns {void} Does nothing if render succeeds.
   */
  function testRenderImageMark(olImage) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    const olContext = render.toContext(context);
    const olStyle = new Style({
      image: olImage
    });
    olContext.setStyle(olStyle);
    olContext.drawGeometry(new Point([16, 16]));
  }

  /**
   * Approximate a partial circle as a radial shape.
   * @private
   * @param {object} options Options.
   * @param {number} startAngle Start angle in radians.
   * @param {number} endAngle End angle in radians.
   * @param {number} radius Symbol radius.
   * @param {ol/style/stroke} stroke OpenLayers Stroke instance.
   * @param {ol/style/fill} fill OpenLayers Fill instance.
   * @param {number} rotation Symbol rotation in radians (clockwise). Default 0.
   * @returns {RadialShape} A RadialShape instance.
   */
  function createPartialCircleRadialShape(_ref) {
    let {
      wellKnownName,
      startAngle,
      endAngle,
      radius,
      stroke,
      fill,
      rotation
    } = _ref;
    const numPoints = Math.ceil(HALF_CIRCLE_RESOLUTION * (endAngle - startAngle) / Math.PI);
    const radii = [0];
    const angles = [0];
    for (let k = 0; k <= numPoints; k += 1) {
      const deltaAngle = (endAngle - startAngle) / numPoints;
      radii.push(radius);
      angles.push(startAngle + k * deltaAngle);
    }
    try {
      const olImage = new RadialShape({
        radii,
        angles,
        stroke,
        fill,
        rotation: rotation ?? 0.0
      });
      testRenderImageMark(olImage);
      return olImage;
    } catch (err) {
      // Custom radial shapes only work from OL v10.3.0 onwards,
      // lower versions give errors because RadialShape expects Fill properties that were introduced in v10.3.0.
      warnOnce(`Error rendering symbol '${wellKnownName}'. OpenLayers v10.3.0 or higher required. ${err}`);
      // When creating a radial shape fails, return default square as fallback.
      return new RegularShape({
        angle: Math.PI / 4,
        fill,
        points: 4,
        // For square, scale radius so the height of the square equals the given size.
        radius: radius * Math.sqrt(2.0),
        stroke,
        rotation: rotation ?? 0.0
      });
    }
  }

  /**
   * Create a radial shape from symbol coordinates in the unit square, scaled by radius.
   * @private
   * @param {object} options Options.
   * @param {Array<Array<number>>} coordinates Unit coordinates in counter-clockwise order.
   * @param {number} radius Symbol radius.
   * @param {ol/style/stroke} stroke OpenLayers Stroke instance.
   * @param {ol/style/fill} fill OpenLayers Fill instance.
   * @param {number} rotation Symbol rotation in radians (clockwise). Default 0.
   * @returns {RadialShape} A RadialShape instance.
   */
  function radialShapeFromUnitCoordinates(_ref2) {
    let {
      wellKnownName,
      coordinates,
      radius,
      stroke,
      fill,
      rotation
    } = _ref2;
    // Convert unit coordinates and radius to polar coordinate representation.
    const radii = [];
    const angles = [];
    coordinates.forEach(_ref3 => {
      let [x, y] = _ref3;
      const polarRadius = radius * Math.sqrt(x * x + y * y);
      let polarAngle = Math.atan2(y, x);
      if (polarAngle < 2) {
        polarAngle += 2 * Math.PI;
      }
      radii.push(polarRadius);
      angles.push(polarAngle);
    });
    try {
      const olImage = new RadialShape({
        radii,
        angles,
        stroke,
        fill,
        rotation: rotation ?? 0.0
      });
      testRenderImageMark(olImage);
      return olImage;
    } catch (err) {
      // Custom radial shapes only work from OL v10.3.0 onwards,
      // lower versions give errors because RadialShape expects Fill properties that were introduced in v10.3.0.
      warnOnce(`Error rendering symbol '${wellKnownName}'. OpenLayers v10.3.0 or higher required. ${err}`);
      // When creating a radial shape fails, return default square as fallback.
      return new RegularShape({
        angle: Math.PI / 4,
        fill,
        points: 4,
        // For square, scale radius so the height of the square equals the given size.
        radius: radius * Math.sqrt(2.0),
        stroke,
        rotation: rotation ?? 0.0
      });
    }
  }

  /**
   * @private
   * Create an OL point style corresponding to a well known symbol identifier.
   * @param {string} wellKnownName SLD Well Known Name for symbolizer.
   * Can be 'circle', 'square', 'triangle', 'star', 'cross', 'x', 'hexagon', 'octagon'.
   * @param {number} size Symbol size in pixels.
   * @param {ol/style/stroke} stroke OpenLayers Stroke instance.
   * @param {ol/style/fill} fill OpenLayers Fill instance.
   * @param {number} rotationDegrees Symbol rotation in degrees (clockwise). Default 0.
   */
  function getWellKnownSymbol(wellKnownName, size, stroke, fill) {
    let rotationDegrees = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0.0;
    const radius = size / 2;
    const rotationRadians = Math.PI * rotationDegrees / 180.0;
    const sharedOptions = {
      stroke,
      fill,
      rotation: rotationRadians
    };
    const customSymbolCoordinates = getCustomSymbolCoordinates(wellKnownName);
    if (customSymbolCoordinates) {
      return radialShapeFromUnitCoordinates({
        ...sharedOptions,
        wellKnownName,
        coordinates: customSymbolCoordinates,
        radius
      });
    }
    switch (wellKnownName) {
      case 'circle':
        return new Circle({
          stroke,
          fill,
          radius
        });
      case 'shape://dot':
        return new Circle({
          stroke,
          fill,
          radius: radius / 8
        });
      case 'equilateral_triangle':
      case 'triangle':
        return new RegularShape({
          ...sharedOptions,
          points: 3,
          radius
        });
      case 'star':
        return new RegularShape({
          ...sharedOptions,
          points: 5,
          radius,
          radius2: radius / 2.5
        });
      case 'shape://plus':
      case 'cross':
        return new RegularShape({
          ...sharedOptions,
          points: 4,
          radius,
          radius2: 0
        });
      case 'pentagon':
        return new RegularShape({
          ...sharedOptions,
          points: 5,
          radius
        });
      case 'hexagon':
        return new RegularShape({
          ...sharedOptions,
          points: 6,
          radius
        });
      case 'octagon':
        return new RegularShape({
          ...sharedOptions,
          angle: Math.PI / 8,
          points: 8,
          radius: radius / Math.cos(Math.PI / 8)
        });
      case 'shape://times':
      case 'cross2': // cross2 is used by QGIS for the x symbol.
      case 'x':
        return new RegularShape({
          ...sharedOptions,
          angle: Math.PI / 4,
          points: 4,
          radius: Math.sqrt(2.0) * radius,
          radius2: 0
        });
      case 'diamond':
        return new RegularShape({
          ...sharedOptions,
          points: 4,
          radius
        });
      case 'shape://horline':
      case 'horline':
        return new RegularShape({
          ...sharedOptions,
          points: 2,
          radius,
          angle: Math.PI / 2
        });
      case 'shape://vertline':
      case 'line':
        return new RegularShape({
          ...sharedOptions,
          points: 2,
          radius,
          angle: 0
        });
      case 'shape://backslash':
      case 'backslash':
        return new RegularShape({
          ...sharedOptions,
          points: 2,
          radius: radius * Math.sqrt(2),
          angle: -Math.PI / 4
        });
      case 'shape://slash':
      case 'slash':
        return new RegularShape({
          ...sharedOptions,
          points: 2,
          radius: radius * Math.sqrt(2),
          angle: Math.PI / 4
        });

      // Symbols that cannot be represented by RegularShape or custom symbols.
      case 'semi_circle':
        return createPartialCircleRadialShape({
          ...sharedOptions,
          wellKnownName,
          startAngle: 0,
          endAngle: Math.PI,
          radius
        });
      case 'third_circle':
        return createPartialCircleRadialShape({
          ...sharedOptions,
          wellKnownName,
          startAngle: Math.PI / 2,
          endAngle: 7 * Math.PI / 6,
          radius
        });
      case 'quarter_circle':
        return createPartialCircleRadialShape({
          ...sharedOptions,
          wellKnownName,
          startAngle: Math.PI / 2,
          endAngle: Math.PI,
          radius
        });

      // Default for unknown wellknownname is a square.
      default:
        // Default is `square`
        return new RegularShape({
          ...sharedOptions,
          angle: Math.PI / 4,
          points: 4,
          // For square, scale radius so the height of the square equals the given size.
          radius: radius * Math.sqrt(2.0)
        });
    }
  }

  /**
   * Get an OL style/Stroke instance from the css/svg properties of the .stroke property
   * of an SLD symbolizer object.
   * @private
   * @param  {object} stroke SLD symbolizer.stroke object.
   * @return {object} OpenLayers style/Stroke instance. Returns undefined when input is null or undefined.
   */
  function getSimpleStroke(stroke) {
    // According to SLD spec, if no Stroke element is present inside a symbolizer element,
    // no stroke is to be rendered.
    if (!stroke) {
      return undefined;
    }
    const styleParams = stroke?.styling;

    // Options that have a default value.
    const strokeColor = evaluate(styleParams?.stroke, null, null, '#000000');
    const strokeOpacity = evaluate(styleParams?.strokeOpacity, null, null, 1.0);
    const strokeWidth = evaluate(styleParams?.strokeWidth, null, null, 1.0);
    const strokeLineDashOffset = evaluate(styleParams?.strokeDashoffset, null, null, 0.0);
    const strokeOptions = {
      color: getOLColorString(strokeColor, strokeOpacity),
      width: strokeWidth,
      lineDashOffset: strokeLineDashOffset
    };

    // Optional parameters that will be added to stroke options when present in SLD.
    const strokeLineJoin = evaluate(styleParams?.strokeLinejoin, null, null);
    if (strokeLineJoin !== null) {
      strokeOptions.lineJoin = strokeLineJoin;
    }
    const strokeLineCap = evaluate(styleParams?.strokeLinecap, null, null);
    if (strokeLineCap !== null) {
      strokeOptions.lineCap = strokeLineCap;
    }
    const strokeDashArray = evaluate(styleParams?.strokeDasharray, null, null);
    if (strokeDashArray !== null) {
      strokeOptions.lineDash = strokeDashArray.split(' ');
    }
    return new Stroke(strokeOptions);
  }

  /**
   * Get an OL style/Fill instance from the css/svg properties of the .fill property
   * of an SLD symbolizer object.
   * @private
   * @param  {object} fill SLD symbolizer.fill object.
   * @return {object} OpenLayers style/Fill instance. Returns undefined when input is null or undefined.
   */
  function getSimpleFill(fill) {
    // According to SLD spec, if no Fill element is present inside a symbolizer element,
    // no fill is to be rendered.
    if (!fill) {
      return undefined;
    }
    const styleParams = fill?.styling;
    const fillColor = evaluate(styleParams?.fill, null, null, '#808080');
    const fillOpacity = evaluate(styleParams?.fillOpacity, null, null, 1.0);
    return new Fill({
      color: getOLColorString(fillColor, fillOpacity)
    });
  }

  /**
   * Change OL Style fill properties for dynamic symbolizer style parameters.
   * Modification happens in-place on the given style instance.
   * @private
   * @param {ol/style/Style} olStyle OL Style instance.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {bool} Returns true if any property-dependent fill style changes have been made.
   */
  function applyDynamicFillStyling(olStyle, symbolizer, feature, context) {
    const olFill = olStyle.getFill();
    if (!olFill) {
      return false;
    }
    if (!context) {
      return false;
    }
    let somethingChanged = false;
    const fill = symbolizer.fill || {};
    const styling = fill.styling || {};

    // Change fill color if either color or opacity is property based.
    if (isDynamicExpression(styling.fill) || isDynamicExpression(styling.fillOpacity)) {
      const fillColor = evaluate(styling.fill, feature, context, '#808080');
      const fillOpacity = evaluate(styling.fillOpacity, feature, context, 1.0);
      olFill.setColor(getOLColorString(fillColor, fillOpacity));
      somethingChanged = true;
    }
    return somethingChanged;
  }

  /**
   * Change OL Style stroke properties for dynamic symbolizer style parameters.
   * Modification happens in-place on the given style instance.
   * @private
   * @param {ol/style/Style} olStyle OL Style instance.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
   */
  function applyDynamicStrokeStyling(olStyle, symbolizer, feature, context) {
    const olStroke = olStyle.getStroke();
    if (!olStroke) {
      return false;
    }
    if (!context) {
      return false;
    }
    let somethingChanged = false;
    const styling = symbolizer?.stroke?.styling;

    // Change stroke width if it's property based.
    if (isDynamicExpression(styling?.strokeWidth)) {
      const strokeWidth = evaluate(styling.strokeWidth, feature, context, 1.0);
      olStroke.setWidth(strokeWidth);
      somethingChanged = true;
    }

    // Change stroke color if either color or opacity is property based.
    if (isDynamicExpression(styling?.stroke) || isDynamicExpression(styling?.strokeOpacity)) {
      const strokeColor = evaluate(styling.stroke, feature, context, '#000000');
      const strokeOpacity = evaluate(styling.strokeOpacity, feature, context, 1.0);
      olStroke.setColor(getOLColorString(strokeColor, strokeOpacity));
      somethingChanged = true;
    }
    return somethingChanged;
  }

  /**
   * Change OL Text properties for dynamic symbolizer style parameters.
   * Modification happens in-place on the given style instance.
   * @private
   * @param {ol/style/Style} olStyle OL Style instance.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
   */
  function applyDynamicTextStyling(olStyle, symbolizer, feature, context) {
    const olText = olStyle.getText();
    if (!olText) {
      return false;
    }
    if (!context) {
      return false;
    }

    // Text fill style has to be applied to text color, so it has to be set as olText stroke.
    if (isDynamicExpression(symbolizer?.fill?.styling?.fill) || isDynamicExpression(symbolizer?.fill?.styling?.fillOpacity)) {
      const textStrokeSymbolizer = {
        stroke: {
          styling: {
            stroke: symbolizer?.fill?.styling?.fill,
            strokeOpacity: symbolizer?.fill?.styling?.fillOpacity
          }
        }
      };
      applyDynamicStrokeStyling(olText, textStrokeSymbolizer, feature, context);
    }

    // Halo fill has to be applied as olText fill.
    if (isDynamicExpression(symbolizer?.halo?.fill?.styling?.fill) || isDynamicExpression(symbolizer?.halo?.fill?.styling?.fillOpacity)) {
      applyDynamicFillStyling(olText, symbolizer.halo, feature, context);
    }

    // Halo radius has to be applied as olText.stroke width.
    if (isDynamicExpression(symbolizer?.halo?.radius)) {
      const haloRadius = evaluate(symbolizer.halo.radius, feature, context, 1.0);
      const olStroke = olText.getStroke();
      if (olStroke) {
        const haloStrokeWidth = (haloRadius === 2 || haloRadius === 4 ? haloRadius - 0.00001 : haloRadius) * 2;
        olStroke.setWidth(haloStrokeWidth);
      }
    }
    return false;
  }

  const defaultMarkFill = getSimpleFill({
    styling: {
      fill: '#888888'
    }
  });
  const defaultMarkStroke = getSimpleStroke({
    styling: {
      stroke: {}
    }
  });

  /**
   * @private
   * @param  {PointSymbolizer} pointsymbolizer [description]
   * @return {object} openlayers style
   */
  function pointStyle(pointsymbolizer) {
    const {
      graphic: style
    } = pointsymbolizer;

    // If the point size is a dynamic expression, use the default point size and update in-place later.
    let pointSizeValue = evaluate(style.size, null, null, DEFAULT_MARK_SIZE);

    // If the point rotation is a dynamic expression, use 0 as default rotation and update in-place later.
    const rotationDegrees = evaluate(style.rotation, null, null, 0.0);
    if (style?.externalgraphic?.onlineresource) {
      // For external graphics: the default size is the native image size.
      // In that case, set pointSizeValue to null, so no scaling is calculated for the image.
      if (!style.size) {
        pointSizeValue = null;
      }
      const imageUrl = style.externalgraphic.onlineresource;

      // Use fallback point styles when image hasn't been loaded yet.
      switch (getImageLoadingState(imageUrl)) {
        case IMAGE_LOADED:
          return createCachedImageStyle(imageUrl, pointSizeValue, rotationDegrees);
        case IMAGE_LOADING:
          return imageLoadingPointStyle;
        case IMAGE_ERROR:
          return imageErrorPointStyle;
        default:
          // A symbolizer should have loading state metadata, but return IMAGE_LOADING just in case.
          return imageLoadingPointStyle;
      }
    }
    if (style.mark) {
      const {
        wellknownname
      } = style.mark;
      const olFill = getSimpleFill(style?.mark?.fill);
      const olStroke = getSimpleStroke(style?.mark?.stroke);
      return new Style({
        // Note: size will be set dynamically later.
        image: getWellKnownSymbol(wellknownname, pointSizeValue, olStroke, olFill, rotationDegrees)
      });
    }

    // SLD spec: when no ExternalGraphic or Mark is specified,
    // use a square of 6 pixels with 50% gray fill and a black outline.
    return new Style({
      image: getWellKnownSymbol('square', pointSizeValue, defaultMarkStroke, defaultMarkFill, rotationDegrees)
    });
  }
  const cachedPointStyle = memoizeStyleFunction(pointStyle);

  /**
   * @private
   * Get an OL point style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPointStyle(symbolizer, feature, context) {
    // According to SLD spec, when a point symbolizer has no Graphic, nothing will be rendered.
    if (!symbolizer?.graphic) {
      return emptyStyle;
    }
    const olStyle = cachedPointStyle(symbolizer);

    // Reset previous calculated point geometry left by evaluating point style for a line or polygon feature.
    olStyle.setGeometry(null);
    let olImage = olStyle.getImage();

    // Apply dynamic values to the cached OL style instance before returning it.

    const {
      graphic
    } = symbolizer;

    // Calculate size and rotation values first.
    const {
      size,
      rotation
    } = graphic;
    const sizeValue = Number(evaluate(size, feature, context)) || DEFAULT_MARK_SIZE;
    const rotationDegrees = Number(evaluate(rotation, feature, context)) || 0.0;

    // --- Update dynamic rotation ---
    if (isDynamicExpression(rotation)) {
      // Note: OL angles are in radians.
      const rotationRadians = Math.PI * rotationDegrees / 180.0;
      olImage.setRotation(rotationRadians);
    }

    // --- Update stroke and fill ---
    if (graphic.mark) {
      const strokeChanged = applyDynamicStrokeStyling(olImage, graphic.mark, feature, context);
      if (strokeChanged) {
        olImage.setStroke(olImage.getStroke());
      }
      const fillChanged = applyDynamicFillStyling(olImage, graphic.mark, feature, context);
      if (fillChanged) {
        olImage.setFill(olImage.getFill());
      }
    }

    // --- Update dynamic size ---
    if (isDynamicExpression(size)) {
      if (graphic?.externalgraphic?.onlineresource) {
        const height = olImage.getSize()[1];
        const scale = sizeValue / height || 1;
        olImage.setScale(scale);
      } else if (graphic?.mark?.wellknownname === 'circle') {
        // Note: only ol/style/Circle has a setter for radius. RegularShape does not.
        olImage.setRadius(sizeValue * 0.5);
      } else {
        // For a non-Circle RegularShape, create a new olImage in order to update the size.
        olImage = getWellKnownSymbol(graphic?.mark?.wellknownname ?? 'square', sizeValue,
        // Note: re-use stroke and fill instances for a (small?) performance gain.
        olImage.getStroke(), olImage.getFill(), rotationDegrees);
        olStyle.setImage(olImage);
      }
    }

    // Update displacement
    const {
      displacement
    } = graphic;
    if (displacement) {
      const {
        displacementx,
        displacementy
      } = displacement;
      if (typeof displacementx !== 'undefined' || typeof displacementy !== 'undefined') {
        const dx = evaluate(displacementx, feature, context) || 0.0;
        const dy = evaluate(displacementy, feature, context) || 0.0;
        if (dx !== 0.0 || dy !== 0.0) {
          olImage.setDisplacement([dx, dy]);
        }
      }
    }
    return olStyle;
  }

  function calculatePointsDistance(coord1, coord2) {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  function calculateSplitPointCoords(startCoord, endCoord, distanceFromStart) {
    const distanceBetweenNodes = calculatePointsDistance(startCoord, endCoord);
    const d = distanceFromStart / distanceBetweenNodes;
    const x = startCoord[0] + (endCoord[0] - startCoord[0]) * d;
    const y = startCoord[1] + (endCoord[1] - startCoord[1]) * d;
    return [x, y];
  }

  /**
   * Calculate the angle of a vector in radians clockwise from the positive x-axis.
   * Example: (0,0) -> (1,1) --> -pi/4 radians.
   * @private
   * @param {Array<number>} p1 Start of the line segment as [x,y].
   * @param {Array<number>} p2 End of the line segment as [x,y].
   * @param {boolean} invertY If true, calculate with Y-axis pointing downwards.
   * @returns {number} Angle in radians, clockwise from the positive x-axis.
   */
  function calculateAngle(p1, p2, invertY) {
    const dX = p2[0] - p1[0];
    const dY = p2[1] - p1[1];
    const angle = -Math.atan2(invertY ? -dY : dY, dX);
    return angle;
  }
  function splitLineString(geometry, graphicSpacing) {
    let _options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const defaultOptions = {
      minimumGraphicSpacing: 0
    };
    const splitOptions = Object.assign(defaultOptions, _options);
    const coords = geometry.getCoordinates();

    // Handle degenerate cases.
    // LineString without points
    if (coords.length === 0) {
      return [];
    }

    // LineString containing only one point.
    if (coords.length === 1) {
      return [[...coords[0], 0]];
    }

    // Handle first point placement case.
    if (splitOptions.placement === PLACEMENT_FIRSTPOINT) {
      const p1 = coords[0];
      const p2 = coords[1];
      return [[p1[0], p1[1], calculateAngle(p1, p2, splitOptions.invertY)]];
    }

    // Handle last point placement case.
    if (splitOptions.placement === PLACEMENT_LASTPOINT) {
      const p1 = coords[coords.length - 2];
      const p2 = coords[coords.length - 1];
      return [[p2[0], p2[1], calculateAngle(p1, p2, splitOptions.invertY)]];
    }
    const totalLength = geometry.getLength();
    const gapSize = Math.max(graphicSpacing, splitOptions.minimumGraphicSpacing);

    // Measure along line to place the next point.
    // Can start at a nonzero value if initialGap is used.
    let nextPointMeasure = splitOptions.initialGap || 0.0;
    let pointIndex = 0;
    const currentSegmentStart = [...coords[0]];
    const currentSegmentEnd = [...coords[1]];

    // Cumulative measure of the line where each segment's length is added in succession.
    let cumulativeMeasure = 0;
    const splitPoints = [];

    // Keep adding points until the next point measure lies beyond the line length.
    while (nextPointMeasure <= totalLength) {
      const currentSegmentLength = calculatePointsDistance(currentSegmentStart, currentSegmentEnd);
      if (cumulativeMeasure + currentSegmentLength < nextPointMeasure) {
        // If the current segment is too short to reach the next point, go to the next segment.
        if (pointIndex === coords.length - 2) {
          // Stop if there is no next segment to process.
          break;
        }
        currentSegmentStart[0] = currentSegmentEnd[0];
        currentSegmentStart[1] = currentSegmentEnd[1];
        currentSegmentEnd[0] = coords[pointIndex + 2][0];
        currentSegmentEnd[1] = coords[pointIndex + 2][1];
        pointIndex += 1;
        cumulativeMeasure += currentSegmentLength;
      } else {
        // Next point lies on the current segment.
        // Calculate its position and increase next point measure by gap size.
        const distanceFromSegmentStart = nextPointMeasure - cumulativeMeasure;
        const splitPointCoords = calculateSplitPointCoords(currentSegmentStart, currentSegmentEnd, distanceFromSegmentStart);
        const angle = calculateAngle(currentSegmentStart, currentSegmentEnd, splitOptions.invertY);
        if (!splitOptions.extent || extent.containsCoordinate(splitOptions.extent, splitPointCoords)) {
          splitPointCoords.push(angle);
          splitPoints.push(splitPointCoords);
        }
        nextPointMeasure += gapSize;
      }
    }
    return splitPoints;
  }

  /**
   * @private
   * Get the point located at the middle along a line string.
   * @param {ol/geom/LineString} geometry An OpenLayers LineString geometry.
   * @returns {Array<number>} An [x, y] coordinate array.
   */
  function getLineMidpoint(geometry) {
    // Use the splitpoints routine to distribute points over the line with
    // a point-to-point distance along the line equal to half line length.
    // This results in three points. Take the middle point.
    const splitPoints = splitLineString(geometry, geometry.getLength() / 2);
    const [x, y] = splitPoints[1];
    return [x, y];
  }

  // A flag to prevent multiple renderer patches.
  let rendererPatched = false;
  function patchRenderer(renderer) {
    if (rendererPatched) {
      return;
    }

    // Add setImageStyle2 function that does the same as setImageStyle, except that it sets rotation
    // to a given value instead of taking it from imageStyle.getRotation().
    // This fixes a problem with re-use of the (cached) image style instance when drawing
    // many points inside a single line feature that are aligned according to line segment direction.
    const rendererProto = Object.getPrototypeOf(renderer);
    rendererProto.setImageStyle2 = function (imageStyle, rotation) {
      // First call the original setImageStyle method.
      rendererProto.setImageStyle.call(this, imageStyle);

      // Then set rotation according to the given parameter.
      // This overrides the following line in setImageStyle:
      // this.imageRotation_ = imageStyle.getRotation()
      if (this.image_) {
        this.imageRotation_ = rotation;
      }
    };
    rendererPatched = true;
  }

  /**
   * Directly render graphic stroke marks for a line onto canvas.
   * @private
   * @param {ol/render/canvas/Immediate} render Instance of CanvasImmediateRenderer used to paint stroke marks directly to the canvas.
   * @param {Array<Array<number>>} pixelCoords A line as array of [x,y] point coordinate arrays in pixel space.
   * @param {number} graphicSpacing The center-to-center distance in pixels for stroke marks distributed along the line.
   * @param {ol/style/Style} pointStyle OpenLayers style instance used for rendering stroke marks.
   * @param {number} pixelRatio Ratio of device pixels to css pixels.
   * @returns {void}
   */
  function renderStrokeMarks(render, pixelCoords, graphicSpacing, pointStyle, pixelRatio, options) {
    if (!pixelCoords) {
      return;
    }

    // The first element of the first pixelCoords entry should be a number (x-coordinate of first point).
    // If it's an array instead, then we're dealing with a multiline or (multi)polygon.
    // In that case, recursively call renderStrokeMarks for each child coordinate array.
    if (Array.isArray(pixelCoords[0][0])) {
      pixelCoords.forEach(pixelCoordsChildArray => {
        renderStrokeMarks(render, pixelCoordsChildArray, graphicSpacing, pointStyle, pixelRatio, options);
      });
      return;
    }

    // Line should be a proper line with at least two coordinates.
    if (pixelCoords.length < 2) {
      return;
    }

    // Don't render anything when the pointStyle has no image.
    const image = pointStyle.getImage();
    if (!image) {
      return;
    }
    const splitPoints = splitLineString(new LineString(pixelCoords), graphicSpacing * pixelRatio, {
      invertY: true,
      // Pixel y-coordinates increase downwards in screen space.
      extent: render.extent_,
      placement: options.placement,
      initialGap: options.initialGap,
      // Use graphic spacing of at least 0.1 px to prevent an infinite number of split points happening by accident.
      minimumGraphicSpacing: 0.1
    });
    splitPoints.forEach(point => {
      const splitPointAngle = image.getRotation() + point[2];
      render.setImageStyle2(image, splitPointAngle);
      render.drawPoint(new Point([point[0] / pixelRatio, point[1] / pixelRatio]));
    });
  }

  /**
   * Create a renderer function for renderining GraphicStroke marks
   * to be used inside an OpenLayers Style.renderer function.
   * @private
   * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
   * @returns {ol/style/Style~RenderFunction} A style renderer function (pixelCoords, renderState) => void.
   */
  function getGraphicStrokeRenderer(linesymbolizer) {
    if (!linesymbolizer?.stroke?.graphicstroke) {
      throw new Error('getGraphicStrokeRenderer error: symbolizer.stroke.graphicstroke null or undefined.');
    }
    const {
      graphicstroke
    } = linesymbolizer.stroke;
    const options = {
      placement: PLACEMENT_DEFAULT
    };

    // QGIS vendor options to override graphicstroke symbol placement.
    if (linesymbolizer.vendoroptions) {
      if (linesymbolizer.vendoroptions.placement === 'firstPoint') {
        options.placement = PLACEMENT_FIRSTPOINT;
      } else if (linesymbolizer.vendoroptions.placement === 'lastPoint') {
        options.placement = PLACEMENT_LASTPOINT;
      }
    }
    return (pixelCoords, renderState) => {
      // Abort when feature geometry is (Multi)Point.
      const geometryType = renderState.feature.getGeometry().getType();
      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        return;
      }
      const pixelRatio = renderState.pixelRatio || 1.0;

      // TODO: Error handling, alternatives, etc.
      const render$1 = render.toContext(renderState.context);
      patchRenderer(render$1);
      let defaultGraphicSize = DEFAULT_MARK_SIZE;
      if (graphicstroke.graphic && graphicstroke.graphic.externalgraphic) {
        defaultGraphicSize = DEFAULT_EXTERNALGRAPHIC_SIZE;
      }
      const pointStyle = getPointStyle(graphicstroke, renderState.feature, null);

      // Calculate graphic spacing.
      // Graphic spacing equals the center-to-center distance of graphics along the line.
      // If there's no gap, segment length will be equal to graphic size.
      const graphicSizeExpression = graphicstroke?.graphic?.size || defaultGraphicSize;
      const graphicSize = Number(evaluate(graphicSizeExpression, renderState.feature, null, defaultGraphicSize));
      const graphicSpacing = calculateGraphicSpacing(linesymbolizer, graphicSize);
      options.initialGap = getInitialGapSize(linesymbolizer);
      renderStrokeMarks(render$1, pixelCoords, graphicSpacing, pointStyle, pixelRatio, options);
    };
  }

  /**
   * Create an OpenLayers style for rendering line symbolizers with a GraphicStroke.
   * @private
   * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
   * @returns {ol/style/Style} An OpenLayers style instance.
   */
  function getGraphicStrokeStyle(linesymbolizer) {
    if (!linesymbolizer?.stroke?.graphicstroke) {
      throw new Error('getGraphicStrokeStyle error: linesymbolizer.stroke.graphicstroke null or undefined.');
    }
    return new Style({
      renderer: getGraphicStrokeRenderer(linesymbolizer)
    });
  }

  /**
   * @private
   * @param  {object} symbolizer SLD symbolizer object.
   * @return {object} OpenLayers style instance corresponding to the stroke of the given symbolizer.
   */
  function lineStyle(symbolizer) {
    if (symbolizer?.stroke?.graphicstroke) {
      return getGraphicStrokeStyle(symbolizer);
    }
    return new Style({
      stroke: getSimpleStroke(symbolizer?.stroke)
    });
  }
  const cachedLineStyle = memoizeStyleFunction(lineStyle);

  /**
   * @private
   * Get an OL line style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getLineStyle(symbolizer, feature, context) {
    const olStyle = cachedLineStyle(symbolizer);

    // Apply dynamic properties.
    applyDynamicStrokeStyling(olStyle, symbolizer, feature, context);
    return olStyle;
  }

  const dense1Pixels = [[1, 1]];
  const dense2Pixels = [[0, 0], [2, 2]];
  const dense3Pixels = [[0, 0], [1, 1], [2, 2], [3, 3], [2, 0], [0, 2]];
  const dense4Pixels = [[0, 0], [1, 1]];
  function fillPixels(context, xyCoords) {
    xyCoords.forEach(_ref => {
      let [x, y] = _ref;
      context.fillRect(x, y, 1, 1);
    });
  }
  function clearPixels(context, xyCoords) {
    xyCoords.forEach(_ref2 => {
      let [x, y] = _ref2;
      context.clearRect(x, y, 1, 1);
    });
  }
  function createCanvasPattern(canvas) {
    const context = canvas.getContext('2d');

    // Scale pixel pattern according to device pixel ratio if necessary.
    if (has.DEVICE_PIXEL_RATIO === 1) {
      return context.createPattern(canvas, 'repeat');
    }
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = canvas.width * has.DEVICE_PIXEL_RATIO;
    scaledCanvas.height = canvas.height * has.DEVICE_PIXEL_RATIO;
    const scaledContext = scaledCanvas.getContext('2d');
    scaledContext.imageSmoothingEnabled = false;
    scaledContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, scaledCanvas.width, scaledCanvas.height);
    return scaledContext.createPattern(scaledCanvas, 'repeat');
  }
  function createPixelPattern(size, color, pixels) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    fillPixels(context, pixels);
    return createCanvasPattern(canvas);
  }
  function createInversePixelPattern(size, color, pixels) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, size, size);
    clearPixels(context, pixels);
    return createCanvasPattern(canvas);
  }
  function getQGISBrushFill(brushName, fillColor) {
    let fill = null;
    switch (brushName) {
      case 'brush://dense1':
        fill = new Fill({
          color: createInversePixelPattern(4, fillColor, dense1Pixels)
        });
        break;
      case 'brush://dense2':
        fill = new Fill({
          color: createInversePixelPattern(4, fillColor, dense2Pixels)
        });
        break;
      case 'brush://dense3':
        fill = new Fill({
          color: createInversePixelPattern(4, fillColor, dense3Pixels)
        });
        break;
      case 'brush://dense4':
        fill = new Fill({
          color: createPixelPattern(2, fillColor, dense4Pixels)
        });
        break;
      case 'brush://dense5':
        fill = new Fill({
          color: createPixelPattern(4, fillColor, dense3Pixels)
        });
        break;
      case 'brush://dense6':
        fill = new Fill({
          color: createPixelPattern(4, fillColor, dense2Pixels)
        });
        break;
      case 'brush://dense7':
        fill = new Fill({
          color: createPixelPattern(4, fillColor, dense1Pixels)
        });
        break;
      default:
        fill = new Fill({
          color: fillColor
        });
        break;
    }
    return fill;
  }

  function createPattern(graphic) {
    const {
      image,
      width,
      height
    } = getCachedImage(graphic.externalgraphic.onlineresource);
    const cnv = document.createElement('canvas');
    const ctx = cnv.getContext('2d');

    // Calculate image scale factor.
    let imageRatio = has.DEVICE_PIXEL_RATIO;
    if (graphic.size && height !== graphic.size) {
      imageRatio *= graphic.size / height;
    }

    // Draw image to canvas directly if no scaling necessary.
    if (imageRatio === 1) {
      return ctx.createPattern(image, 'repeat');
    }

    // Scale the image by drawing onto a temp canvas.
    const tempCanvas = document.createElement('canvas');
    const tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width * imageRatio;
    tempCanvas.height = height * imageRatio;
    // prettier-ignore
    tCtx.drawImage(image, 0, 0, width, height, 0, 0, width * imageRatio, height * imageRatio);
    return ctx.createPattern(tempCanvas, 'repeat');
  }
  function getExternalGraphicFill(symbolizer) {
    const {
      graphic
    } = symbolizer.fill.graphicfill;
    const fillImageUrl = graphic.externalgraphic.onlineresource;

    // Use fallback style when graphicfill image hasn't been loaded yet.
    switch (getImageLoadingState(fillImageUrl)) {
      case IMAGE_LOADED:
        return new Fill({
          color: createPattern(symbolizer.fill.graphicfill.graphic)
        });
      case IMAGE_LOADING:
        return imageLoadingPolygonStyle.getFill();
      case IMAGE_ERROR:
        return imageErrorPolygonStyle.getFill();
      default:
        // Load state of an image should be known at this time, but return 'loading' style as fallback.
        return imageLoadingPolygonStyle.getFill();
    }
  }

  /**
   * Scale mark graphic fill symbol with given scale factor to improve mark fill rendering.
   * Scale factor will be applied to stroke width depending on the original value for visual fidelity.
   * @private
   * @param {object} graphicfill GraphicFill symbolizer object.
   * @param {number} scaleFactor Scale factor.
   * @returns {object} A new GraphifFill symbolizer object with scale factor applied.
   */
  function scaleMarkGraphicFill(graphicfill, scaleFactor) {
    if (!graphicfill.graphic) {
      return graphicfill;
    }

    // Create a deep clone of the original symbolizer.
    const newFill = JSON.parse(JSON.stringify(graphicfill));
    const {
      graphic
    } = newFill;
    const oriSize = Number(graphic.size) || DEFAULT_MARK_SIZE;
    graphic.size = scaleFactor * oriSize;
    const {
      mark
    } = graphic;
    if (mark && mark.stroke) {
      // Apply SLD defaults to stroke parameters.
      // Todo: do this at the SLDReader parsing stage already.
      if (!mark.stroke.styling) {
        mark.stroke.styling = {
          stroke: '#000000',
          strokeWidth: 1.0
        };
      }
      if (!mark.stroke.styling.strokeWidth) {
        mark.stroke.styling.strokeWidth = Number(mark.stroke.styling.strokeWidth) || 1;
      }

      // If original stroke width is 1 or less, do not scale it.
      // This gives better visual results than using a stroke width of 2 and downsizing.
      const oriStrokeWidth = mark.stroke.styling.strokeWidth;
      if (oriStrokeWidth > 1) {
        mark.stroke.styling.strokeWidth = scaleFactor * oriStrokeWidth;
      }
    }
    return newFill;
  }
  function getMarkGraphicFill(symbolizer) {
    const {
      graphicfill
    } = symbolizer.fill;
    const {
      graphic
    } = graphicfill;
    const {
      mark
    } = graphic;
    const {
      wellknownname
    } = mark || {};

    // If it's a QGIS brush fill, use direct pixel manipulation to create the fill.
    if (wellknownname && wellknownname.indexOf('brush://') === 0) {
      let brushFillColor = '#000000';
      if (mark.fill && mark.fill.styling && mark.fill.styling.fill) {
        brushFillColor = mark.fill.styling.fill;
      }
      return getQGISBrushFill(wellknownname, brushFillColor);
    }

    // Create mark graphic fill by drawing a single mark on a square canvas.
    const graphicSize = Number(graphic.size) || DEFAULT_MARK_SIZE;
    const canvasSize = graphicSize * has.DEVICE_PIXEL_RATIO;
    let fill = null;

    // The graphic symbol will be rendered at a larger size and then scaled back to the graphic size.
    // This is done to mitigate visual artifacts that occur when drawing between pixels.
    const scaleFactor = 2.0;
    try {
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = canvasSize * scaleFactor;
      scaledCanvas.height = canvasSize * scaleFactor;
      const context = scaledCanvas.getContext('2d');

      // Point symbolizer function expects an object with a .graphic property.
      // The point symbolizer is stored as graphicfill in the polygon symbolizer.
      const scaledGraphicFill = scaleMarkGraphicFill(graphicfill, scaleFactor);
      const pointStyle = getPointStyle(scaledGraphicFill);

      // Let OpenLayers draw a point with the given point style on the temp canvas.
      // Note: OL rendering context size params are always in css pixels, while the temp canvas may
      // be larger depending on the device pixel ratio.
      const olContext = render.toContext(context, {
        size: [graphicSize * scaleFactor, graphicSize * scaleFactor]
      });

      // Disable image smoothing to ensure crisp graphic fill pattern.
      context.imageSmoothingEnabled = false;

      // Let OpenLayers draw the symbol to the canvas directly.
      olContext.setStyle(pointStyle);
      const centerX = scaleFactor * (graphicSize / 2);
      const centerY = scaleFactor * (graphicSize / 2);
      olContext.drawGeometry(new Point([centerX, centerY]));

      // For (back)slash marks, draw extra copies to the sides to ensure complete tiling coverage when used as a pattern.
      // S = symbol, C = copy.
      //     +---+
      //     | C |
      // +---+---+---+
      // | C | S | C |
      // +---+---+---+
      //     | C |
      //     +---+
      if (wellknownname && wellknownname.indexOf('slash') > -1) {
        olContext.drawGeometry(new Point([centerX - scaleFactor * graphicSize, centerY]));
        olContext.drawGeometry(new Point([centerX + scaleFactor * graphicSize, centerY]));
        olContext.drawGeometry(new Point([centerX, centerY - scaleFactor * graphicSize]));
        olContext.drawGeometry(new Point([centerX, centerY + scaleFactor * graphicSize]));
      }

      // Downscale the drawn mark back to original graphic size.
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = canvasSize;
      patternCanvas.height = canvasSize;
      const patternContext = patternCanvas.getContext('2d');
      patternContext.drawImage(scaledCanvas, 0, 0, canvasSize * scaleFactor, canvasSize * scaleFactor, 0, 0, canvasSize, canvasSize);

      // Turn the generated image into a repeating pattern, just like a regular image fill.
      const pattern = patternContext.createPattern(patternCanvas, 'repeat');
      fill = new Fill({
        color: pattern
      });
    } catch {
      // Default black fill as backup plan.
      fill = new Fill({
        color: '#000000'
      });
    }
    return fill;
  }
  function polygonStyle(symbolizer) {
    const fillImageUrl = symbolizer?.fill?.graphicfill?.graphic?.externalgraphic?.onlineresource;
    const fillMark = symbolizer?.fill?.graphicfill?.graphic?.mark;
    let polygonFill = null;
    if (fillImageUrl) {
      polygonFill = getExternalGraphicFill(symbolizer);
    } else if (fillMark) {
      polygonFill = getMarkGraphicFill(symbolizer);
    } else {
      polygonFill = getSimpleFill(symbolizer.fill);
    }

    // When a polygon has a GraphicStroke, use a custom renderer to combine
    // GraphicStroke with fill. This is needed because a custom renderer
    // ignores any stroke, fill and image present in the style.
    if (symbolizer?.stroke?.graphicstroke) {
      const renderGraphicStroke = getGraphicStrokeRenderer(symbolizer);
      return new Style({
        renderer: (pixelCoords, renderState) => {
          // First render the fill (if any).
          if (polygonFill) {
            const {
              feature,
              context
            } = renderState;
            const render$1 = render.toContext(context);
            render$1.setFillStrokeStyle(polygonFill, undefined);
            const geometryType = feature.getGeometry().getType();
            if (geometryType === 'Polygon') {
              render$1.drawPolygon(new Polygon(pixelCoords));
            } else if (geometryType === 'MultiPolygon') {
              render$1.drawMultiPolygon(new MultiPolygon(pixelCoords));
            }
          }

          // Then, render the graphic stroke.
          renderGraphicStroke(pixelCoords, renderState);
        }
      });
    }
    const polygonStroke = getSimpleStroke(symbolizer.stroke);
    return new Style({
      fill: polygonFill,
      stroke: polygonStroke
    });
  }
  const cachedPolygonStyle = memoizeStyleFunction(polygonStyle);

  /**
   * @private
   * Get an OL line style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPolygonStyle(symbolizer, feature, context) {
    const olStyle = cachedPolygonStyle(symbolizer);

    // Apply dynamic properties.
    applyDynamicFillStyling(olStyle, symbolizer, feature, context);
    applyDynamicStrokeStyling(olStyle, symbolizer, feature, context);
    return olStyle;
  }

  /**
   * @private
   * Get the static OL style instance for a text symbolizer.
   * The text and placement properties will be set on the style object at runtime.
   * @param {object} textsymbolizer SLD text symbolizer object.
   * @return {object} openlayers style
   */
  function textStyle(textsymbolizer) {
    if (!textsymbolizer?.label) {
      return emptyStyle;
    }

    // If the label is dynamic, set text to empty string.
    // In that case, text will be set at runtime.
    const labelText = evaluate(textsymbolizer.label, null, null, '');
    const fontStyling = textsymbolizer?.font?.styling;
    const fontFamily = evaluate(fontStyling?.fontFamily, null, null, 'sans-serif');
    const fontSize = evaluate(fontStyling?.fontSize, null, null, 10);
    const fontStyle = evaluate(fontStyling?.fontStyle, null, null, '');
    const fontWeight = evaluate(fontStyling?.fontWeight, null, null, '');
    const olFontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const pointplacement = textsymbolizer?.labelplacement?.pointplacement;

    // If rotation is dynamic, default to 0. Rotation will be set at runtime.
    const labelRotationDegrees = evaluate(pointplacement?.rotation, null, null, 0.0);
    const displacement = pointplacement?.displacement;
    const offsetX = evaluate(displacement?.displacementx, null, null, 0.0);
    // Positive offsetY shifts the label downwards. Positive displacementY in SLD means shift upwards.
    const offsetY = -evaluate(displacement?.displacementy, null, null, 0.0);

    // OpenLayers does not support fractional alignment, so snap the anchor to the most suitable option.
    const anchorpoint = pointplacement?.anchorpoint;
    let textAlign = 'center';
    const anchorPointX = evaluate(anchorpoint?.anchorpointx, null, null, NaN);
    if (anchorPointX < 0.25) {
      textAlign = 'left';
    } else if (anchorPointX > 0.75) {
      textAlign = 'right';
    }
    let textBaseline = 'middle';
    const anchorPointY = evaluate(anchorpoint?.anchorpointy, null, null, NaN);
    if (anchorPointY < 0.25) {
      textBaseline = 'bottom';
    } else if (anchorPointY > 0.75) {
      textBaseline = 'top';
    }
    const fillStyling = textsymbolizer?.fill?.styling;
    const textFillColor = evaluate(fillStyling?.fill, null, null, '#000000');
    const textFillOpacity = evaluate(fillStyling?.fillOpacity, null, null, 1.0);

    // Assemble text style options.
    const textStyleOptions = {
      text: labelText,
      font: olFontString,
      offsetX,
      offsetY,
      rotation: Math.PI * labelRotationDegrees / 180.0,
      textAlign,
      textBaseline,
      fill: new Fill({
        color: getOLColorString(textFillColor, textFillOpacity)
      })
    };

    // Convert SLD halo to text symbol stroke.
    if (textsymbolizer.halo) {
      const haloStyling = textsymbolizer?.halo?.fill?.styling;
      const haloFillColor = evaluate(haloStyling?.fill, null, null, '#FFFFFF');
      const haloFillOpacity = evaluate(haloStyling?.fillOpacity, null, null, 1.0);
      const haloRadius = evaluate(textsymbolizer?.halo?.radius, null, null, 1.0);
      textStyleOptions.stroke = new Stroke({
        color: getOLColorString(haloFillColor, haloFillOpacity),
        // wrong position width radius equal to 2 or 4
        width: (haloRadius === 2 || haloRadius === 4 ? haloRadius - 0.00001 : haloRadius) * 2
      });
    }
    return new Style({
      text: new Text(textStyleOptions)
    });
  }
  const cachedTextStyle = memoizeStyleFunction(textStyle);

  /**
   * @private
   * Get an OL text style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getTextStyle(symbolizer, feature, context) {
    const olStyle = cachedTextStyle(symbolizer);
    const olText = olStyle.getText();
    if (!olText) {
      return olStyle;
    }

    // Read text from feature and set it on the text style instance.
    const {
      label,
      labelplacement
    } = symbolizer;

    // Set text only if the label expression is dynamic.
    if (isDynamicExpression(label)) {
      const labelText = evaluate(label, feature, context, '');
      // Important! OpenLayers expects the text property to always be a string.
      olText.setText(labelText.toString());
    }

    // Set rotation if expression is dynamic.
    if (labelplacement) {
      const pointPlacementRotation = labelplacement?.pointplacement?.rotation ?? 0.0;
      if (isDynamicExpression(pointPlacementRotation)) {
        const labelRotationDegrees = evaluate(pointPlacementRotation, feature, context, 0.0);
        olText.setRotation(Math.PI * labelRotationDegrees / 180.0); // OL rotation is in radians.
      }
    }

    // Set line or point placement according to geometry type.
    const geometry = feature.getGeometry ? feature.getGeometry() : feature.geometry;
    const geometryType = geometry.getType ? geometry.getType() : geometry.type;
    const lineplacement = symbolizer?.labelplacement?.lineplacement;
    const placement = geometryType !== 'point' && lineplacement ? 'line' : 'point';
    olText.setPlacement(placement);

    // Apply dynamic style properties.
    applyDynamicTextStyling(olStyle, symbolizer, feature, context);

    // Adjust font if one or more font svgparameters are dynamic.
    const fontStyling = symbolizer?.font?.styling;
    if (fontStyling) {
      if (isDynamicExpression(fontStyling?.fontFamily) || isDynamicExpression(fontStyling?.fontStyle) || isDynamicExpression(fontStyling?.fontWeight) || isDynamicExpression(fontStyling?.fontSize)) {
        const fontFamily = evaluate(fontStyling?.fontFamily, feature, context, 'sans-serif');
        const fontStyle = evaluate(fontStyling?.fontStyle, feature, context, '');
        const fontWeight = evaluate(fontStyling?.fontWeight, feature, context, '');
        const fontSize = evaluate(fontStyling?.fontSize, feature, context, 10);
        const olFontString = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        olText.setFont(olFontString);
      }
    }
    return olStyle;
  }

  /**
   * @private
   * Get an OL point style instance for a line feature according to a symbolizer.
   * The style will render a point on the middle of the line.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getLinePointStyle(symbolizer, feature, context) {
    if (typeof feature.getGeometry !== 'function') {
      return null;
    }
    let geom = feature.getGeometry();
    if (!geom) {
      return null;
    }
    if (geom instanceof RenderFeature) {
      geom = RenderFeature.toGeometry(geom);
    }
    let pointStyle = null;
    const geomType = geom.getType();
    if (geomType === 'LineString') {
      pointStyle = getPointStyle(symbolizer, feature, context);
      pointStyle.setGeometry(new Point(getLineMidpoint(geom)));
    } else if (geomType === 'MultiLineString') {
      const lineStrings = geom.getLineStrings();
      const multiPointCoords = lineStrings.map(getLineMidpoint);
      pointStyle = getPointStyle(symbolizer, feature, context);
      pointStyle.setGeometry(new MultiPoint(multiPointCoords));
    }
    return pointStyle;
  }

  /**
   * @private
   * Get the point located at the centroid of a polygon.
   * @param {ol/geom/Polygon} geometry An OpenLayers Polygon geometry.
   * @returns {Array<number>} An [x, y] coordinate array.
   */
  function getInteriorPoint(geometry) {
    // Use OpenLayers getInteriorPoint method to get a 'good' interior point.
    const [x, y] = geometry.getInteriorPoint().getCoordinates();
    return [x, y];
  }

  /**
   * @private
   * Get an OL point style instance for a line feature according to a symbolizer.
   * The style will render a point on the middle of the line.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {EvaluationContext} context Evaluation context.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPolygonPointStyle(symbolizer, feature, context) {
    if (typeof feature.getGeometry !== 'function') {
      return null;
    }
    let geom = feature.getGeometry();
    if (!geom) {
      return null;
    }
    if (geom instanceof RenderFeature) {
      geom = RenderFeature.toGeometry(geom);
    }
    let pointStyle = null;
    const geomType = geom.getType();
    if (geomType === 'Polygon') {
      pointStyle = getPointStyle(symbolizer, feature, context);
      pointStyle.setGeometry(new Point(getInteriorPoint(geom)));
    } else if (geomType === 'MultiPolygon') {
      const polygons = geom.getPolygons();
      const multiPointCoords = polygons.map(getInteriorPoint);
      pointStyle = getPointStyle(symbolizer, feature, context);
      pointStyle.setGeometry(new MultiPoint(multiPointCoords));
    }
    return pointStyle;
  }

  const defaultStyles = [defaultPointStyle];

  /**
   * Evaluation context for style functions.
   * @private
   * @typedef {object} EvaluationContext
   * @property {Function} getProperty A function (feature, propertyName) -> value that returns the value of the property of a feature.
   * @property {Function} getId A function feature -> any that gets the id of a feature.
   * @property {number} resolution The current resolution in ground units in meters / pixel.
   */

  /**
   * @private
   * Convert symbolizers together with the feature to OL style objects and append them to the OL styles array.
   * @example appendStyles(styles, point[j], feature, getPointStyle);
   * @param {Array<ol/style>} styles Array of OL styles.
   * @param {Array<object>} symbolizers Array of feature symbolizers.
   * @param {ol/feature} feature OpenLayers feature.
   * @param {Function} styleFunction Function for getting the OL style object. Signature (symbolizer, feature) => OL style.
   * @param {EvaluationContext} context Evaluation context.
   */
  function appendStyles(styles, symbolizers, feature, styleFunction, context) {
    (symbolizers || []).forEach(symbolizer => {
      const olStyle = styleFunction(symbolizer, feature, context);
      if (olStyle) {
        styles.push(olStyle);
      }
    });
  }

  /**
   * Create openlayers style
   * @private
   * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
   * @param {object} categorizedSymbolizers Symbolizers categorized by type, e.g. .pointSymbolizers = [array of point symbolizer objects].
   * @param {object|Feature} feature {@link http://geojson.org|geojson}
   *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
   * @param {EvaluationContext} context Evaluation context.
   * @param {object} [options] Optional options object.
   * @param {boolean} [options.strictGeometryMatch] Default false. When true, only apply symbolizers to the corresponding geometry type.
   * E.g. point symbolizers will not be applied to lines and polygons. Default false (according to SLD spec).
   * @param {boolean} [options.useFallbackStyles] Default true. When true, provides default OL styles as fallback for unknown geometry types.
   * @return ol.style.Style or array of it
   */
  function OlStyler(categorizedSymbolizers, feature, context) {
    let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    const {
      polygonSymbolizers,
      lineSymbolizers,
      pointSymbolizers,
      textSymbolizers
    } = categorizedSymbolizers;
    const defaultOptions = {
      strictGeometryMatch: false,
      useFallbackStyles: true
    };
    const styleOptions = {
      ...defaultOptions,
      ...options
    };
    const geometry = feature.getGeometry ? feature.getGeometry() : feature.geometry;
    const geometryType = geometry.getType ? geometry.getType() : geometry.type;
    let styles = [];
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        appendStyles(styles, pointSymbolizers, feature, getPointStyle, context);
        appendStyles(styles, textSymbolizers, feature, getTextStyle, context);
        break;
      case 'LineString':
      case 'MultiLineString':
        appendStyles(styles, lineSymbolizers, feature, getLineStyle, context);
        if (!styleOptions.strictGeometryMatch) {
          appendStyles(styles, pointSymbolizers, feature, getLinePointStyle, context);
        }
        appendStyles(styles, textSymbolizers, feature, getTextStyle, context);
        break;
      case 'Polygon':
      case 'MultiPolygon':
        appendStyles(styles, polygonSymbolizers, feature, getPolygonStyle, context);
        if (!styleOptions.strictGeometryMatch) {
          appendStyles(styles, lineSymbolizers, feature, getLineStyle, context);
        }
        appendStyles(styles, pointSymbolizers, feature, getPolygonPointStyle, context);
        appendStyles(styles, textSymbolizers, feature, getTextStyle, context);
        break;
      default:
        if (styleOptions.useFallbackStyles) {
          styles = defaultStyles;
        }
    }

    // Set z-index of styles explicitly to fix a bug where GraphicStroke is always rendered above a line symbolizer.
    styles.forEach((style, index) => style.setZIndex(index));
    return styles;
  }

  /**
   * @private
   * Extract feature id from an OpenLayers Feature.
   * @param {Feature} feature {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
   * @returns {string} Feature id.
   */
  function getOlFeatureId(feature) {
    return feature.getId();
  }

  /**
   * @private
   * Extract a property value from an OpenLayers Feature.
   * @param {Feature} feature {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature}
   * @param {string} propertyName The name of the feature property to read.
   * @returns {object} Property value.
   */
  function getOlFeatureProperty(feature, propertyName) {
    return feature.get(propertyName);
  }

  /**
   * Create an OpenLayers style function from a FeatureTypeStyle object extracted from an SLD document.
   *
   * **Important!** When using externalGraphics for point styling, make sure to call .changed() on the layer
   * inside options.imageLoadedCallback to immediately see the loaded image. If you do not do this, the
   * image icon will only become visible the next time OpenLayers draws the layer (after pan or zoom).
   * @public
   * @param {FeatureTypeStyle} featureTypeStyle Feature Type Style object.
   * @param {object} options Options
   * @param {function} options.convertResolution An optional function to convert the resolution in map units/pixel to resolution in meters/pixel.
   * When not given, the map resolution is used as-is.
   * @param {function} options.imageLoadedCallback Optional callback that will be called with the url of an externalGraphic when
   * an image has been loaded (successfully or not). Call .changed() inside the callback on the layer to see the loaded image.
   * @param {function} options.getProperty Optional custom property getter: (feature, propertyName) => property value.
   * @returns {Function} A function that can be set as style function on an OpenLayers vector style layer.
   * @example
   * myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
   *   imageLoadedCallback: () => { myOlVectorLayer.changed(); }
   * }));
   */
  function createOlStyleFunction(featureTypeStyle) {
    let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const imageLoadedCallback = options.imageLoadedCallback || (() => {});

    // Keep track of whether a callback has been registered per image url.
    const callbackRef = {};

    // Evaluation context.
    const context = {};
    context.getProperty = typeof options.getProperty === 'function' ? options.getProperty : getOlFeatureProperty;
    context.getId = getOlFeatureId;
    return (feature, mapResolution) => {
      // Determine resolution in meters/pixel.
      const groundResolution = typeof options.convertResolution === 'function' ? options.convertResolution(mapResolution) : mapResolution;
      context.resolution = groundResolution;

      // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
      const rules = getRules(featureTypeStyle, feature, context);

      // Start loading images for external graphic symbolizers and when loaded:
      // * update symbolizers to use the cached image.
      // * call imageLoadedCallback with the image url.
      processExternalGraphicSymbolizers(rules, featureTypeStyle, imageLoadedCallback, callbackRef);

      // Convert style rules to style rule lookup categorized by geometry type.
      const categorizedSymbolizers = categorizeSymbolizers(rules);

      // Determine style rule array.
      const olStyles = OlStyler(categorizedSymbolizers, feature, context);
      return olStyles;
    };
  }

  /**
   * Create an array of OpenLayers style instances for features with the chosen geometry type from a style rule.
   * Since this function creates a static OpenLayers style and not a style function,
   * usage of this function is only suitable for simple symbolizers that do not depend on feature properties
   * and do not contain external graphics. External graphic marks will be shown as a grey circle instead.
   * @public
   * @param {StyleRule} styleRule Feature Type Style Rule object.
   * @param {string} geometryType One of 'Point', 'LineString' or 'Polygon'
   * @returns {Array<ol.Style>} An array of OpenLayers style instances.
   * @example
   * myOlVectorLayer.setStyle(SLDReader.createOlStyle(featureTypeStyle.rules[0], 'Point');
   */
  function createOlStyle(styleRule, geometryType) {
    const categorizedSymbolizers = categorizeSymbolizers([styleRule]);
    const olStyles = OlStyler(categorizedSymbolizers, {
      geometry: {
        type: geometryType
      }
    }, () => null, {
      strictGeometryMatch: true,
      useFallbackStyles: false
    });
    return olStyles.filter(style => style !== null);
  }

  // The functions below are taken from the Geoserver function list.
  // https://docs.geoserver.org/latest/en/user/filter/function_reference.html#string-functions
  // Note: implementation details may be different from Geoserver implementations.
  // SLDReader function parameters are not strictly typed and will convert inputs in a sensible manner.

  /**
   * @module
   * @private
   */

  /**
   * Converts the text representation of the input value to lower case.
   * @private
   * @param {any} input Input value.
   * @returns Lower case version of the text representation of the input value.
   */
  function strToLowerCase(input) {
    return asString(input).toLowerCase();
  }

  /**
   * Converts the text representation of the input value to upper case.
   * @private
   * @param {any} input Input value.
   * @returns Upper case version of the text representation of the input value.
   */
  function strToUpperCase(input) {
    return asString(input).toUpperCase();
  }

  /**
   * Extract a substring from the input text.
   * @private
   * @param {any} input Input value.
   * @param {number} start Integer representing start position to extract beginning with 1;
   * if start is negative, the return string will begin at the end of the string minus the start value.
   * @param {number} [length] Optional integer representing length of string to extract;
   * if length is negative, the return string will omit the given length of characters from the end of the string
   * @returns {string} The extracted substring.
   * @example
   * * qgisSubstr('HELLO WORLD', 3, 5) --> 'LLO W'.
   * * qgisSubstr('HELLO WORLD', -5) --> 'WORLD'.
   */
  function qgisSubstr(input, start, length) {
    const startIndex = Number(start);
    const lengthInt = Number(length);
    if (Number.isNaN(startIndex)) {
      return '';
    }

    // Note: implementation specification taken from https://docs.qgis.org/3.28/en/docs/user_manual/expressions/functions_list.html#substr
    const text = asString(input);
    if (Number.isNaN(lengthInt)) {
      if (startIndex > 0) {
        return text.slice(startIndex - 1);
      }
      return text.slice(startIndex);
    }
    if (lengthInt === 0) {
      return '';
    }
    if (startIndex > 0) {
      if (lengthInt > 0) {
        return text.slice(startIndex - 1, startIndex - 1 + lengthInt);
      }
      return text.slice(startIndex - 1, lengthInt);
    }
    if (lengthInt > 0) {
      if (startIndex + lengthInt < 0) {
        return text.slice(startIndex, startIndex + lengthInt);
      }
      return text.slice(startIndex);
    }
    return text.slice(startIndex, lengthInt);
  }

  /**
   * Extract a substring given a begin and end index.
   * @private
   * @param {any} input Input value.
   * @param {number} begin Begin index (0-based).
   * @param {number} end End index (0-based).
   * @returns {string} The substring starting at the begin index up to,
   * but not incuding the character at the end index.
   * @example
   * * strSubstring('HELLO', 2, 4) --> 'LL'.
   */
  function strSubstring(input, begin, end) {
    const text = asString(input);
    const beginIndex = Number(begin);
    const endIndex = Number(end);
    if (Number.isNaN(beginIndex) || Number.isNaN(endIndex)) {
      return '';
    }
    return text.slice(beginIndex, endIndex);
  }

  /**
   * Extract a substring from a begin index until the end.
   * @private
   * @param {any} input Input value.
   * @param {number} begin Begin index (0-based).
   * Using a negative index -N starts at N characters from the end.
   * @returns {string} The substring starting at the begin index until the end.
   * @example
   * * strSubstringStart('HELLO', 1) --> 'ELLO'.
   * * strSubstringStart('HELLO', -2) --> 'LO'.
   */
  function strSubstringStart(input, begin) {
    const text = asString(input);
    const beginIndex = Number(begin);
    if (Number.isNaN(beginIndex)) {
      return '';
    }
    return text.slice(beginIndex);
  }

  /**
   * Get the geometry type of an OpenLayers geometry instance.
   * Calls geom.getType() and returns the result.
   * See https://openlayers.org/en/latest/apidoc/module-ol_geom_Geometry.html#~Type
   * for possible values.
   * @private
   * @param {ol/geom/x} olGeometry OpenLayers Geometry instance.
   * @returns {string} The OpenLayers geometry type.
   */
  function geometryType(olGeometry) {
    if (olGeometry && typeof olGeometry.getType === 'function') {
      return olGeometry.getType();
    }
    return 'Unknown';
  }

  /**
   * Get the dimension of a geometry. Multipart geometries will return the dimension of their separate parts.
   * @private
   * @param {ol/geom/x} olGeometry OpenLayers Geometry instance.
   * @returns {number} The dimension of the geometry. Will return -1 for GeometryCollection or unknown type.
   */
  function dimension(olGeometry) {
    if (!olGeometry) {
      return -1;
    }
    return dimensionFromGeometryType(olGeometry.getType());
  }

  /**
   * Determine the type of an OpenLayers geometry. Does not differentiate between multipart and single part.
   * @private
   * @param {ol/geom/x} olGeometry OpenLayers Geometry instance.
   * @returns {string} The geometry type: one of Point, Line, Polygon, or Unknown (geometry collection).
   */
  function qgisGeometryType(olGeometry) {
    switch (geometryType(olGeometry)) {
      case 'Point':
      case 'MultiPoint':
        return 'Point';
      case 'LineString':
      case 'LinearRing':
      case 'Circle':
      case 'MultiLineString':
        return 'Line';
      case 'Polygon':
      case 'MultiPolygon':
        return 'Polygon';
      default:
        return 'Unknown';
    }
  }

  /**
   * Test if the first argument is the same as any of the other arguments.
   * Equality is determined by comparing test and candidates as strings.
   * @private
   * @param  {...any} inputArgs Input arguments.
   * @returns {boolean} True if the first argument is the same as any of the other arguments
   * using string-based comparison.
   */
  function stringIn() {
    for (var _len = arguments.length, inputArgs = new Array(_len), _key = 0; _key < _len; _key++) {
      inputArgs[_key] = arguments[_key];
    }
    const [test, ...candidates] = inputArgs;
    // Compare test with candidates as string.
    const testString = asString(test);
    return candidates.some(candidate => asString(candidate) === testString);
  }

  /**
   * Register all builtin functions at once.
   * @private
   */
  function addBuiltInFunctions() {
    // QGIS functions
    registerFunction('lower', strToLowerCase);
    registerFunction('upper', strToUpperCase);
    registerFunction('geometry_type', qgisGeometryType);
    registerFunction('substr', qgisSubstr);

    // Geoserver functions
    registerFunction('strToLowerCase', strToLowerCase);
    registerFunction('strToUpperCase', strToUpperCase);
    registerFunction('strSubstring', strSubstring);
    registerFunction('strSubstringStart', strSubstringStart);
    registerFunction('geometryType', geometryType);
    registerFunction('dimension', dimension);
    registerFunction('in', stringIn);
    // Also register in2/in10 as alias for the in function.
    // This is done for backwards compatibility with older geoservers, which have explicit 'in'
    // function versions for 2 to 10 parameters.
    for (let k = 2; k <= 10; k += 1) {
      registerFunction(`in${k}`, stringIn);
    }

    // Math operators as functions
    registerFunction('__fe:Add__', (a, b) => Number(a) + Number(b));
    registerFunction('__fe:Sub__', (a, b) => Number(a) - Number(b));
    registerFunction('__fe:Mul__', (a, b) => Number(a) * Number(b));
    registerFunction('__fe:Div__', (a, b) => Number(a) / Number(b));
  }

  const version = '0.7.1';

  // Add support for a handful of built-in SLD function implementations.
  addBuiltInFunctions();

  exports.OlStyler = OlStyler;
  exports.Reader = Reader;
  exports.categorizeSymbolizers = categorizeSymbolizers;
  exports.createOlStyle = createOlStyle;
  exports.createOlStyleFunction = createOlStyleFunction;
  exports.getByPath = getByPath;
  exports.getFunction = getFunction;
  exports.getLayer = getLayer;
  exports.getLayerNames = getLayerNames;
  exports.getRuleSymbolizers = getRuleSymbolizers;
  exports.getRules = getRules;
  exports.getStyle = getStyle;
  exports.getStyleNames = getStyleNames;
  exports.registerCustomSymbol = registerCustomSymbol;
  exports.registerFunction = registerFunction;
  exports.version = version;
  exports.warnOnce = warnOnce;

  return exports;

})({}, ol.render.Feature, ol.style.Style, ol.style.Icon, ol.style.Fill, ol.style.Stroke, ol.style.Circle, ol.style.RegularShape, ol.render, ol.geom.Point, ol.color, ol.colorlike, ol.style.IconImageCache, ol.style.Image, ol.dom, ol.style.IconImage, ol.geom.LineString, ol.extent, ol.has, ol.geom.Polygon, ol.geom.MultiPolygon, ol.style.Text, ol.geom.MultiPoint);
