(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ol/style'), require('ol/render'), require('ol/geom'), require('ol/extent'), require('ol/has')) :
  typeof define === 'function' && define.amd ? define(['exports', 'ol/style', 'ol/render', 'ol/geom', 'ol/extent', 'ol/has'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SLDReader = {}, global.ol.style, global.ol.render, global.ol.geom, global.ol.extent, global.ol.has));
})(this, (function (exports, style, render, geom, extent, has) { 'use strict';

  /**
   * Factory methods for filterelements
   * @see http://schemas.opengis.net/filter/1.0.0/filter.xsd
   *
   * @module
   */

  var TYPE_COMPARISON = 'comparison';

  /**
   * @var string[] element names of binary comparison
   * @private
   */
  var BINARY_COMPARISON_NAMES = [
    'PropertyIsEqualTo',
    'PropertyIsNotEqualTo',
    'PropertyIsLessThan',
    'PropertyIsLessThanOrEqualTo',
    'PropertyIsGreaterThan',
    'PropertyIsGreaterThanOrEqualTo' ];

  var COMPARISON_NAMES = BINARY_COMPARISON_NAMES.concat([
    'PropertyIsLike',
    'PropertyIsNull',
    'PropertyIsBetween' ]);

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
    throw new Error(("Unknown comparison element " + (element.localName)));
  }

  /**
   * factory for element type BinaryComparisonOpType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createBinaryFilterComparison(element, addParameterValueProp) {
    var obj = {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      // Match case attribute is true by default, so only make it false if the attribute value equals 'false'.
      matchcase: element.getAttribute('matchCase') !== 'false',
    };

    // Parse child expressions, and add them to the comparison object.
    var parsed = {};
    addParameterValueProp(element, parsed, 'expressions', {
      concatenateLiterals: false,
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
    var obj = createBinaryFilterComparison(element, addParameterValueProp);
    return Object.assign({}, obj,
      {wildcard: element.getAttribute('wildCard'),
      singlechar: element.getAttribute('singleChar'),
      escapechar: element.getAttribute('escapeChar')});
  }

  /**
   * factory for element type PropertyIsNullType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsNullComparison(element, addParameterValueProp) {
    var parsed = {};
    addParameterValueProp(element, parsed, 'expressions', {
      concatenateLiterals: false,
    });

    return {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      expression: parsed.expressions,
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
    var obj = {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      // Match case attribute is true by default, so only make it false if the attribute value equals 'false'.
      matchcase: element.getAttribute('matchCase') !== 'false',
    };

    // Parse child expressions, and add them to the comparison object.
    var parsed = {};
    addParameterValueProp(element, parsed, 'expressions', {
      concatenateLiterals: false,
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
    var predicates = [];
    for (var n = element.firstElementChild; n; n = n.nextElementSibling) {
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
      predicates: predicates,
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
    var predicate = null;
    var childElement = element.firstElementChild;
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
      predicate: predicate,
    };
  }

  /**
   * Factory root filter element
   * @param {Element} element
   *
   * @return {Filter}
   */
  function createFilter(element, addParameterValueProp) {
    var filter = {};
    for (var n = element.firstElementChild; n; n = n.nextElementSibling) {
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

  var numericSvgProps = new Set([
    'strokeWidth',
    'strokeOpacity',
    'strokeDashoffset',
    'fillOpacity',
    'fontSize' ]);

  /**
   * Generic parser for elements with maxOccurs > 1
   * it pushes result of readNode(node) to array on obj[prop]
   * @private
   * @param {Element} node the xml element to parse
   * @param {object} obj  the object to modify
   * @param {string} prop key on obj to hold array
   */
  function addPropArray(node, obj, prop) {
    var property = prop.toLowerCase();
    obj[property] = obj[property] || [];
    var item = {};
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
    var property = prop.toLowerCase();
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
  function addPropWithTextContent(node, obj, prop, trimText) {
    if ( trimText === void 0 ) trimText = false;

    var property = prop.toLowerCase();
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
    var property = prop.toLowerCase();
    var value = parseFloat(node.textContent.trim());
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
   * @return {Array<OGCExpression>|OGCExpression|string} Simplified version of the expression array.
   */
  function simplifyChildExpressions(expressions, typeHint, concatenateLiterals) {
    if (!Array.isArray(expressions)) {
      return expressions;
    }

    // Replace each literal expression with its value.
    var simplifiedExpressions = expressions
      .map(function (expression) {
        if (expression.type === 'literal') {
          return expression.value;
        }
        return expression;
      })
      .filter(function (expression) { return expression !== ''; });

    // If expression children are all literals, concatenate them into a string.
    if (concatenateLiterals) {
      var allLiteral = simplifiedExpressions.every(
        function (expr) { return typeof expr !== 'object' || expr === null; }
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
      typeHint: typeHint,
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
   * @param {object} [options.concatenateLiterals] Default true. When true, and when all expressions are literals,
   * concatenate all literal expressions into a single string.
   */
  function addParameterValueProp(node, obj, prop, options) {
    if ( options === void 0 ) options = {};

    var defaultParseOptions = {
      skipEmptyNodes: true,
      forceLowerCase: true,
      typeHint: 'string',
      concatenateLiterals: true,
    };

    var parseOptions = Object.assign({}, defaultParseOptions,
      options);

    var childExpressions = [];

    for (var k = 0; k < node.childNodes.length; k += 1) {
      var childNode = node.childNodes[k];
      var childExpression = {};
      if (
        childNode.namespaceURI === 'http://www.opengis.net/ogc' &&
        childNode.localName === 'PropertyName'
      ) {
        // Add ogc:PropertyName elements as type:propertyname.
        childExpression.type = 'propertyname';
        childExpression.typeHint = parseOptions.typeHint;
        childExpression.value = childNode.textContent.trim();
      } else if (
        childNode.namespaceURI === 'http://www.opengis.net/ogc' &&
        childNode.localName === 'Function'
      ) {
        var functionName = childNode.getAttribute('name');
        var fallbackValue = childNode.getAttribute('fallbackValue') || null;
        childExpression.type = 'function';
        childExpression.name = functionName;
        childExpression.fallbackValue = fallbackValue;

        // Parse function parameters.
        // Parse child expressions, and add them to the comparison object.
        var parsed = {};
        addParameterValueProp(childNode, parsed, 'params', {
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
        childExpression.name = "__fe:" + (childNode.localName) + "__";
        childExpression.typeHint = 'number';
        // Parse function parameters.
        // Parse child expressions, and add them to the comparison object.
        var parsed$1 = {};
        addParameterValueProp(childNode, parsed$1, 'params', {
          concatenateLiterals: false,
        });
        if (Array.isArray(parsed$1.params.children)) {
          // Case 0 or more than 1 children.
          childExpression.params = parsed$1.params.children;
        } else {
          // Special case of 1 parameter.
          // An array containing one expression is simplified into the expression itself.
          childExpression.params = [parsed$1.params];
        }
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

    var propertyName = parseOptions.forceLowerCase ? prop.toLowerCase() : prop;

    // Simplify child expressions.
    // For example: if they are all literals --> concatenate into string.
    var simplifiedValue = simplifyChildExpressions(
      childExpressions,
      parseOptions.typeHint,
      parseOptions.concatenateLiterals
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

  function addNumericParameterValueProp(node, obj, prop, options) {
    if ( options === void 0 ) options = {};

    addParameterValueProp(node, obj, prop, Object.assign({}, options, {typeHint: 'number'}));
  }

  /**
   * recieves boolean of element with tagName
   * @private
   * @param  {Element} element [description]
   * @param  {string} tagName [description]
   * @return {boolean}
   */
  function getBool(element, tagName) {
    var collection = element.getElementsByTagNameNS(
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
    var name = element
      .getAttribute('name')
      .toLowerCase()
      .replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });

    // Flag certain SVG parameters as numeric.
    var typeHint = 'string';
    if (parameterGroup === 'styling') {
      if (numericSvgProps.has(name)) {
        typeHint = 'number';
      }
    }

    addParameterValueProp(element, obj[parameterGroup], name, {
      skipEmptyNodes: true,
      forceLowerCase: false,
      typeHint: typeHint,
    });
  }

  var FilterParsers = {
    Filter: function (element, obj) {
      obj.filter = createFilter(element, addParameterValueProp);
    },
    ElseFilter: function (element, obj) {
      obj.elsefilter = true;
    },
  };

  var SymbParsers = {
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
    Label: function (node, obj, prop) { return addParameterValueProp(node, obj, prop, { skipEmptyNodes: false }); },
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
    VendorOption: function (element, obj, prop) { return addParameterValue(element, obj, prop, 'vendoroptions'); },
    OnlineResource: function (element, obj) {
      obj.onlineresource = element.getAttribute('xlink:href');
    },
    CssParameter: function (element, obj, prop) { return addParameterValue(element, obj, prop, 'styling'); },
    SvgParameter: function (element, obj, prop) { return addParameterValue(element, obj, prop, 'styling'); },
  };

  /**
   * Each propname is a tag in the sld that should be converted to plain object
   * @private
   * @type {Object}
   */
  var parsers = Object.assign({}, {NamedLayer: function (element, obj) {
      addPropArray(element, obj, 'layers');
    },
    UserLayer: function (element, obj) {
      addPropArray(element, obj, 'layers');
    },
    UserStyle: function (element, obj) {
      obj.styles = obj.styles || [];
      var style = {
        default: getBool(element, 'IsDefault'),
        featuretypestyles: [],
      };
      readNode(element, style);
      obj.styles.push(style);
    },
    FeatureTypeStyle: function (element, obj) {
      obj.featuretypestyle = obj.featuretypestyle || [];
      var featuretypestyle = {
        rules: [],
      };
      readNode(element, featuretypestyle);
      obj.featuretypestyles.push(featuretypestyle);
    },
    Rule: function (element, obj) {
      var rule = {};
      readNode(element, rule);
      obj.rules.push(rule);
    },
    Name: addPropWithTextContent,
    Title: addPropWithTextContent,
    Abstract: addPropWithTextContent,
    MaxScaleDenominator: addNumericProp,
    MinScaleDenominator: addNumericProp},
    FilterParsers,
    SymbParsers);

  /**
   * walks over xml nodes
   * @private
   * @param  {Element} node derived from xml
   * @param  {object} obj recieves results
   * @return {void}
   */
  function readNode(node, obj) {
    for (var n = node.firstElementChild; n; n = n.nextElementSibling) {
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
  function Reader(sld) {
    var result = {};
    var parser = new DOMParser();
    var doc = parser.parseFromString(sld, 'application/xml');

    for (var n = doc.firstChild; n; n = n.nextSibling) {
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

  var FunctionCache = new Map();

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

  // This module contains an evaluate function that takes an SLD expression and a feature and outputs the value for that feature.

  /**
   * Check if an expression depends on feature properties.
   * @private
   * @param {Expression} expression SLDReader expression object.
   * @returns {bool} Returns true if the expression depends on feature properties.
   */
  function isDynamicExpression(expression) {
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
   * @param {function} getProperty A function to get a specific property value from a feature.
   * @param {any} defaultValue Optional default value to use when feature is null.
   * Signature (feature, propertyName) => property value.
   */
  function evaluate(
    expression,
    feature,
    getProperty,
    defaultValue
  ) {
    if ( defaultValue === void 0 ) defaultValue = null;

    // Determine the value of the expression.
    var value = null;

    var jsType = typeof expression;
    if (
      jsType === 'string' ||
      jsType === 'number' ||
      jsType === 'undefined' ||
      jsType === 'boolean' ||
      expression === null
    ) {
      // Expression value equals the expression itself if it's a native javascript type.
      value = expression;
    } else if (expression.type === 'literal') {
      // Take expression value directly from literal type expression.
      value = expression.value;
    } else if (expression.type === 'propertyname') {
      // Expression value is taken from input feature.
      // If feature is null/undefined, use default value instead.
      var propertyName = expression.value;
      if (feature) {
        // If the property name equals the geometry field name, return the feature geometry.
        if (
          typeof feature.getGeometryName === 'function' &&
          propertyName === feature.getGeometryName()
        ) {
          value = feature.getGeometry();
        } else {
          value = getProperty(feature, propertyName);
        }
      } else {
        value = defaultValue;
      }
    } else if (expression.type === 'expression') {
      // Expression value is the concatenation of all child expession values.
      if (expression.children.length === 1) {
        value = evaluate(
          expression.children[0],
          feature,
          getProperty,
          defaultValue
        );
      } else {
        // In case of multiple child expressions, concatenate the evaluated child results.
        var childValues = [];
        for (var k = 0; k < expression.children.length; k += 1) {
          childValues.push(
            // Do not use default values when evaluating children. Only apply default is
            // the concatenated result is empty.
            evaluate(expression.children[k], feature, getProperty, null)
          );
        }
        value = childValues.join('');
      }
    } else if (expression.type === 'function') {
      var func = getFunction(expression.name);
      if (!func) {
        value = expression.fallbackValue;
      } else {
        try {
          // evaluate parameter expressions.
          var paramValues = expression.params.map(function (paramExpression) { return evaluate(paramExpression, feature, getProperty); }
          );
          value = func.apply(void 0, paramValues);
        } catch (e) {
          value = expression.fallbackValue;
        }
      }
    }

    // Do not substitute default value if the value is numeric zero.
    if (value === 0) {
      return value;
    }

    // Check if value is empty/null. If so, return default value.
    if (
      value === null ||
      typeof value === 'undefined' ||
      value === '' ||
      Number.isNaN(value)
    ) {
      return defaultValue;
    }

    // Convert value to number if expression is flagged as numeric.
    if (expression && expression.typeHint === 'number') {
      value = Number(value);
      if (Number.isNaN(value)) {
        return defaultValue;
      }
    }

    return value;
  }

  function isNullOrUndefined(value) {
    /* eslint-disable-next-line eqeqeq */
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
    var aNumber = toNumber(a);
    var bNumber = toNumber(b);
    if (!(Number.isNaN(aNumber) || Number.isNaN(bNumber))) {
      return compareNumbers(aNumber, bNumber);
    }

    // If a and/or b is non-numeric, compare both values as strings.
    var aString = a.toString();
    var bString = b.toString();

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

  function propertyIsNull(comparison, feature, getProperty) {
    var value = evaluate(comparison.expression, feature, getProperty);
    return isNullOrUndefined(value);
  }

  function propertyIsLessThan(comparison, feature, getProperty) {
    var value1 = evaluate(comparison.expression1, feature, getProperty);
    if (isNullOrUndefined(value1)) {
      return false;
    }

    var value2 = evaluate(comparison.expression2, feature, getProperty);
    if (isNullOrUndefined(value2)) {
      return false;
    }

    return compare(value1, value2) < 0;
  }

  function propertyIsGreaterThan(comparison, feature, getProperty) {
    var value1 = evaluate(comparison.expression1, feature, getProperty);
    if (isNullOrUndefined(value1)) {
      return false;
    }

    var value2 = evaluate(comparison.expression2, feature, getProperty);
    if (isNullOrUndefined(value2)) {
      return false;
    }

    return compare(value1, value2) > 0;
  }

  function propertyIsBetween(comparison, feature, getProperty) {
    var value = evaluate(comparison.expression, feature, getProperty);
    if (isNullOrUndefined(value)) {
      return false;
    }

    var lowerBoundary = evaluate(
      comparison.lowerboundary,
      feature,
      getProperty
    );
    if (isNullOrUndefined(lowerBoundary)) {
      return false;
    }

    var upperBoundary = evaluate(
      comparison.upperboundary,
      feature,
      getProperty
    );
    if (isNullOrUndefined(upperBoundary)) {
      return false;
    }

    return (
      compare(lowerBoundary, value) <= 0 && compare(upperBoundary, value) >= 0
    );
  }

  function propertyIsEqualTo(comparison, feature, getProperty) {
    var value1 = evaluate(comparison.expression1, feature, getProperty);
    if (isNullOrUndefined(value1)) {
      return false;
    }

    var value2 = evaluate(comparison.expression2, feature, getProperty);
    if (isNullOrUndefined(value2)) {
      return false;
    }

    if (
      !comparison.matchcase ||
      typeof value1 === 'boolean' ||
      typeof value2 === 'boolean'
    ) {
      return compare(value1, value2, false) === 0;
    }

    /* eslint-disable-next-line eqeqeq */
    return value1 == value2;
  }

  // Watch out! Null-ish values should not pass propertyIsNotEqualTo,
  // just like in databases.
  // This means that PropertyIsNotEqualTo is not the same as NOT(PropertyIsEqualTo).
  function propertyIsNotEqualTo(comparison, feature, getProperty) {
    var value1 = evaluate(comparison.expression1, feature, getProperty);
    if (isNullOrUndefined(value1)) {
      return false;
    }

    var value2 = evaluate(comparison.expression2, feature, getProperty);
    if (isNullOrUndefined(value2)) {
      return false;
    }

    return !propertyIsEqualTo(comparison, feature, getProperty);
  }

  /**
   * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
   * @private
   * @param {object} comparison filter object for operator 'propertyislike'
   * @param {string|number} value Feature property value.
   * @param {object} getProperty A function with parameters (feature, propertyName) to extract
   * the value of a property from a feature.
   */
  function propertyIsLike(comparison, feature, getProperty) {
    var value = evaluate(comparison.expression1, feature, getProperty);
    if (isNullOrUndefined(value)) {
      return false;
    }

    var pattern = evaluate(comparison.expression2, feature, getProperty);
    if (isNullOrUndefined(pattern)) {
      return false;
    }

    // Create regex string from match pattern.
    var wildcard = comparison.wildcard;
    var singlechar = comparison.singlechar;
    var escapechar = comparison.escapechar;
    var matchcase = comparison.matchcase;

    // Replace wildcard by '.*'
    var patternAsRegex = pattern.replace(new RegExp(("[" + wildcard + "]"), 'g'), '.*');

    // Replace single char match by '.'
    patternAsRegex = patternAsRegex.replace(
      new RegExp(("[" + singlechar + "]"), 'g'),
      '.'
    );

    // Replace escape char by '\' if escape char is not already '\'.
    if (escapechar !== '\\') {
      patternAsRegex = patternAsRegex.replace(
        new RegExp(("[" + escapechar + "]"), 'g'),
        '\\'
      );
    }

    // Bookend the regular expression.
    patternAsRegex = "^" + patternAsRegex + "$";

    var rex =
      matchcase === false
        ? new RegExp(patternAsRegex, 'i')
        : new RegExp(patternAsRegex);
    return rex.test(value);
  }

  /**
   * Test feature properties against a comparison filter.
   * @private
   * @param  {Filter} comparison A comparison filter object.
   * @param  {object} feature A feature object.
   * @param  {Function} getProperty A function with parameters (feature, propertyName)
   * to extract a single property value from a feature.
   * @return {bool}  does feature fullfill comparison
   */
  function doComparison(comparison, feature, getProperty) {
    switch (comparison.operator) {
      case 'propertyislessthan':
        return propertyIsLessThan(comparison, feature, getProperty);
      case 'propertyisequalto':
        return propertyIsEqualTo(comparison, feature, getProperty);
      case 'propertyislessthanorequalto':
        return (
          propertyIsEqualTo(comparison, feature, getProperty) ||
          propertyIsLessThan(comparison, feature, getProperty)
        );
      case 'propertyisnotequalto':
        return propertyIsNotEqualTo(comparison, feature, getProperty);
      case 'propertyisgreaterthan':
        return propertyIsGreaterThan(comparison, feature, getProperty);
      case 'propertyisgreaterthanorequalto':
        return (
          propertyIsEqualTo(comparison, feature, getProperty) ||
          propertyIsGreaterThan(comparison, feature, getProperty)
        );
      case 'propertyisbetween':
        return propertyIsBetween(comparison, feature, getProperty);
      case 'propertyisnull':
        return propertyIsNull(comparison, feature, getProperty);
      case 'propertyislike':
        return propertyIsLike(comparison, feature, getProperty);
      default:
        throw new Error(("Unkown comparison operator " + (comparison.operator)));
    }
  }

  function doFIDFilter(fids, featureId) {
    for (var i = 0; i < fids.length; i += 1) {
      if (fids[i] === featureId) {
        return true;
      }
    }

    return false;
  }

  /**
   * @private
   * Get feature properties from a GeoJSON feature.
   * @param {object} feature GeoJSON feature.
   * @returns {object} Feature properties.
   *
   */
  function getGeoJSONProperty(feature, propertyName) {
    return feature.properties[propertyName];
  }

  /**
   * @private
   * Gets feature id from a GeoJSON feature.
   * @param {object} feature GeoJSON feature.
   * @returns {number|string} Feature ID.
   */
  function getGeoJSONFeatureId(feature) {
    return feature.id;
  }

  /**
   * Calls functions from Filter object to test if feature passes filter.
   * Functions are called with filter part they match and feature.
   * @private
   * @param  {Filter} filter
   * @param  {object} feature feature
   * @param  {object} options Custom filter options.
   * @param  {Function} options.getProperty An optional function with parameters (feature, propertyName)
   * that can be used to extract properties from a feature.
   * When not given, properties are read from feature.properties directly.
   * @param  {Function} options.getFeatureId An optional function to extract the feature id from a feature.
   * When not given, feature id is read from feature.id.
   * @return {boolean} True if the feature passes the conditions described by the filter object.
   */
  function filterSelector(filter, feature, options) {
    if ( options === void 0 ) options = {};

    var getProperty =
      typeof options.getProperty === 'function'
        ? options.getProperty
        : getGeoJSONProperty;

    var getFeatureId =
      typeof options.getFeatureId === 'function'
        ? options.getFeatureId
        : getGeoJSONFeatureId;

    var type = filter.type;
    switch (type) {
      case 'featureid':
        return doFIDFilter(filter.fids, getFeatureId(feature));

      case 'comparison':
        return doComparison(filter, feature, getProperty);

      case 'and': {
        if (!filter.predicates) {
          throw new Error('And filter must have predicates array.');
        }

        // And without predicates should return false.
        if (filter.predicates.length === 0) {
          return false;
        }

        return filter.predicates.every(function (predicate) { return filterSelector(predicate, feature, options); }
        );
      }

      case 'or': {
        if (!filter.predicates) {
          throw new Error('Or filter must have predicates array.');
        }

        return filter.predicates.some(function (predicate) { return filterSelector(predicate, feature, options); }
        );
      }

      case 'not': {
        if (!filter.predicate) {
          throw new Error('Not filter must have predicate.');
        }

        return !filterSelector(filter.predicate, feature, options);
      }

      default:
        throw new Error(("Unknown filter type: " + type));
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
    if (
      rule.maxscaledenominator !== undefined &&
      rule.minscaledenominator !== undefined
    ) {
      if (
        resolution / 0.00028 < rule.maxscaledenominator &&
        resolution / 0.00028 > rule.minscaledenominator
      ) {
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
    return sld.layers.map(function (l) { return l.name; });
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
    return sld.layers.find(function (l) { return l.name === layername; });
  }

  /**
   * getStyleNames, notice name is not required for userstyle, you might get undefined
   * @param  {Layer} layer [description]
   * @return {string[]}       [description]
   */
  function getStyleNames(layer) {
    return layer.styles.map(function (s) { return s.name; });
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
      return layer.styles.find(function (s) { return s.name === name; });
    }

    var defaultStyle = layer.styles.find(function (s) { return s.default; });
    if (defaultStyle) {
      return defaultStyle;
    }

    return layer.styles[0];
  }

  /**
   * get rules for specific feature after applying filters
   * @example
   * const style = getStyle(sldLayer, stylename);
   * getRules(style.featuretypestyles['0'], geojson, resolution);
   * @param  {FeatureTypeStyle} featureTypeStyle
   * @param  {object} feature geojson
   * @param  {number} resolution m/px
   * @param  {Function} options.getProperty An optional function with parameters (feature, propertyName)
   * that can be used to extract a property value from a feature.
   * When not given, properties are read from feature.properties directly.Error
   * @param  {Function} options.getFeatureId An optional function to extract the feature id from a feature.Error
   * When not given, feature id is read from feature.id.
   * @return {Rule[]}
   */
  function getRules(featureTypeStyle, feature, resolution, options) {
    if ( options === void 0 ) options = {};

    var validRules = [];
    var elseFilterCount = 0;
    for (var j = 0; j < featureTypeStyle.rules.length; j += 1) {
      var rule = featureTypeStyle.rules[j];
      // Only keep rules that pass the rule's min/max scale denominator checks.
      if (scaleSelector(rule, resolution)) {
        if (rule.elsefilter) {
          // In the first rule selection step, keep all rules with an ElseFilter.
          validRules.push(rule);
          elseFilterCount += 1;
        } else if (!rule.filter) {
          // Rules without filter always apply.
          validRules.push(rule);
        } else if (filterSelector(rule.filter, feature, options)) {
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
    return validRules.filter(function (rule) { return !rule.elsefilter; });
  }

  /**
   * Get all symbolizers inside a given rule.
   * Note: this will be a mix of Point/Line/Polygon/Text symbolizers.
   * @param {object} rule SLD rule object.
   * @returns {Array<object>} Array of all symbolizers in a rule.
   */
  function getRuleSymbolizers(rule) {
    var allSymbolizers = (rule.polygonsymbolizer || []).concat( (rule.linesymbolizer || []),
      (rule.pointsymbolizer || []),
      (rule.textsymbolizer || []) );

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
    var value = obj;

    // Walk the object property path.
    var fragments = (path || '').split('.');
    for (var k = 0; k < fragments.length; k += 1) {
      var fragment = fragments[k];
      // Return undefined if any partial path does not exist in the object.
      if (!(fragment in value)) {
        return undefined;
      }
      value = value[fragment];
    }

    return value;
  }

  /**
   * Get styling from rules per geometry type
   * @param  {Rule[]} rules [description]
   * @return {CategorizedSymbolizers}
   */
  function categorizeSymbolizers(rules) {
    var result = {
      polygonSymbolizers: [],
      lineSymbolizers: [],
      pointSymbolizers: [],
      textSymbolizers: [],
    };

    (rules || []).forEach(function (rule) {
      if (rule.polygonsymbolizer) {
        result.polygonSymbolizers = ( result.polygonSymbolizers ).concat( rule.polygonsymbolizer );
      }
      if (rule.linesymbolizer) {
        result.lineSymbolizers = ( result.lineSymbolizers ).concat( rule.linesymbolizer );
      }
      if (rule.pointsymbolizer) {
        result.pointSymbolizers = ( result.pointSymbolizers ).concat( rule.pointsymbolizer );
      }
      if (rule.textsymbolizer) {
        result.textSymbolizers = ( result.textSymbolizers ).concat( rule.textsymbolizer );
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

  var IMAGE_LOADING = 'IMAGE_LOADING';
  var IMAGE_LOADED = 'IMAGE_LOADED';
  var IMAGE_ERROR = 'IMAGE_ERROR';

  // SLD Spec: Default size for Marks without Size should be 6 pixels.
  var DEFAULT_MARK_SIZE = 6; // pixels
  // SLD Spec: Default size for ExternalGraphic with an unknown native size,
  // like SVG without dimensions, should be 16 pixels.
  var DEFAULT_EXTERNALGRAPHIC_SIZE = 16; // pixels

  // QGIS Graphic stroke placement options
  var PLACEMENT_DEFAULT = 'PLACEMENT_DEFAULT';
  var PLACEMENT_FIRSTPOINT = 'PLACEMENT_FIRSTPOINT';
  var PLACEMENT_LASTPOINT = 'PLACEMENT_LASTPOINT';

  /* eslint-disable no-continue */

  // These are possible locations for an external graphic inside a symbolizer.
  var externalGraphicPaths = [
    'graphic.externalgraphic',
    'stroke.graphicstroke.graphic.externalgraphic',
    'fill.graphicfill.graphic.externalgraphic' ];

  /**
   * @private
   * Global image cache. A map of image Url -> {
   *   url: image url,
   *   image: an Image instance containing image data,
   *   width: image width in pixels,
   *   height: image height in pixels
   * }
   */
  var imageCache = {};
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
  var imageLoadingStateCache = {};
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
  var _imageLoaderCache = {};
  function getImageLoader(url) {
    return _imageLoaderCache[url];
  }
  function setImageLoader(url, loaderPromise) {
    _imageLoaderCache[url] = loaderPromise;
  }

  function invalidateExternalGraphicSymbolizers(symbolizer, imageUrl) {
    // Look at all possible paths where an externalgraphic may be present within a symbolizer.
    // When such an externalgraphic has been found, and its url equals imageUrl, invalidate the symbolizer.
    for (var k = 0; k < externalGraphicPaths.length; k += 1) {
      // Note: this process assumes that each symbolizer has at most one external graphic element.
      var path = externalGraphicPaths[k];
      var externalgraphic = getByPath(symbolizer, path);
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
      for (var k = 0; k < ruleSymbolizer.length; k += 1) {
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

    featureTypeStyle.rules.forEach(function (rule) {
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
    var loader = getImageLoader(imageUrl);
    if (loader) {
      return loader;
    }

    // If no load is in progress, create a new loader and store it in the image loader cache before returning it.
    loader = new Promise(function (resolve, reject) {
      var image = new Image();

      image.onload = function () {
        setCachedImage(imageUrl, {
          url: imageUrl,
          image: image,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
        setImageLoadingState(imageUrl, IMAGE_LOADED);
        resolve(imageUrl);
      };

      image.onerror = function () {
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
  function loadExternalGraphic(
    imageUrl,
    featureTypeStyle,
    imageLoadedCallback
  ) {
    invalidateExternalGraphics(featureTypeStyle, imageUrl);
    getCachingImageLoader(imageUrl)
      .then(function () {
        invalidateExternalGraphics(featureTypeStyle, imageUrl);
        if (typeof imageLoadedCallback === 'function') {
          imageLoadedCallback(imageUrl);
        }
      })
      .catch(function () {
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
  function processExternalGraphicSymbolizers(
    rules,
    featureTypeStyle,
    imageLoadedCallback,
    callbackRef
  ) {
    // Walk over all symbolizers inside all given rules.
    // Dive into the symbolizers to find ExternalGraphic elements and for each ExternalGraphic,
    // check if the image url has been encountered before.
    // If not -> start loading the image into the global image cache.
    rules.forEach(function (rule) {
      var allSymbolizers = getRuleSymbolizers(rule);
      allSymbolizers.forEach(function (symbolizer) {
        externalGraphicPaths.forEach(function (path) {
          var exgraphic = getByPath(symbolizer, path);
          if (!exgraphic) {
            return;
          }
          var imageUrl = exgraphic.onlineresource;
          var imageLoadingState = getImageLoadingState(imageUrl);
          if (!imageLoadingState || imageLoadingState === IMAGE_LOADING) {
            // Prevent adding imageLoadedCallback more than once per image per created style function
            // by inspecting the callbackRef object passed by the style function creator function.
            // Each style function has its own callbackRef dictionary.
            if (!callbackRef[imageUrl]) {
              callbackRef[imageUrl] = true;
              // Load image and when loaded, invalidate all symbolizers referencing the image
              // and invoke the imageLoadedCallback.
              loadExternalGraphic(
                imageUrl,
                featureTypeStyle,
                imageLoadedCallback
              );
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
  function createCachedImageStyle(imageUrl, size, rotationDegrees) {
    if ( rotationDegrees === void 0 ) rotationDegrees = 0.0;

    var ref = getCachedImage(imageUrl);
    var image = ref.image;
    var width = ref.width;
    var height = ref.height;
    return new style.Style({
      image: new style.Icon({
        img: image,
        imgSize: [width, height],
        // According to SLD spec, if size is given, image height should equal the given size.
        scale: size / height || 1,
        rotation: (Math.PI * rotationDegrees) / 180.0,
      }),
    });
  }

  var emptyStyle = new style.Style({});

  var defaultPointStyle = new style.Style({
    image: new style.Circle({
      radius: 8,
      fill: new style.Fill({
        color: 'blue',
        fillOpacity: 0.7,
      }),
    }),
  });

  var imageLoadingPointStyle = new style.Style({
    image: new style.Circle({
      radius: 5,
      fill: new style.Fill({
        color: '#DDDDDD',
      }),
      stroke: new style.Stroke({
        width: 1,
        color: '#888888',
      }),
    }),
  });

  var imageLoadingPolygonStyle = new style.Style({
    fill: new style.Fill({
      color: '#DDDDDD',
    }),
    stroke: new style.Stroke({
      color: '#888888',
      width: 1,
    }),
  });

  var imageErrorPointStyle = new style.Style({
    image: new style.RegularShape({
      angle: Math.PI / 4,
      fill: new style.Fill({
        color: 'red',
      }),
      points: 4,
      radius: 8,
      radius2: 0,
      stroke: new style.Stroke({
        color: 'red',
        width: 4,
      }),
    }),
  });

  var imageErrorPolygonStyle = new style.Style({
    fill: new style.Fill({
      color: 'red',
    }),
    stroke: new style.Stroke({
      color: 'red',
      width: 1,
    }),
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
    var styleCache = new WeakMap();

    return function (symbolizer) {
      var olStyle = styleCache.get(symbolizer);

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
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    if (alpha || alpha === 0) {
      return ("rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")");
    }
    return ("rgb(" + r + ", " + g + ", " + b + ")");
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
    var ref = lineSymbolizer.stroke;
    var graphicstroke = ref.graphicstroke;
    var styling = ref.styling;
    if ('gap' in graphicstroke) {
      // Note: gap should be a numeric property after parsing (check reader.test).
      return graphicstroke.gap + graphicWidth;
    }

    // If gap is not given, use strokeDasharray to space graphics.
    // First digit represents size of graphic, second the relative space, e.g.
    // size = 20, dash = [2 6] -> 2 ~ 20 then 6 ~ 60, total segment length should be 20 + 60 = 80
    var multiplier = 1; // default, i.e. a segment is the size of the graphic (without stroke/outline).
    if (styling && styling.strokeDasharray) {
      var dash = styling.strokeDasharray.split(' ');
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
    var ref = lineSymbolizer.stroke;
    var graphicstroke = ref.graphicstroke;
    return graphicstroke.initialgap || 0.0;
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
  function getWellKnownSymbol(
    wellKnownName,
    size,
    stroke,
    fill,
    rotationDegrees
  ) {
    if ( rotationDegrees === void 0 ) rotationDegrees = 0.0;

    var radius = size / 2;
    var rotationRadians = (Math.PI * rotationDegrees) / 180.0;

    var fillColor;
    if (fill && fill.getColor()) {
      fillColor = fill.getColor();
    }

    switch (wellKnownName) {
      case 'circle':
        return new style.Circle({
          fill: fill,
          radius: radius,
          stroke: stroke,
        });

      case 'triangle':
        return new style.RegularShape({
          fill: fill,
          points: 3,
          radius: radius,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'star':
        return new style.RegularShape({
          fill: fill,
          points: 5,
          radius: radius,
          radius2: radius / 2.5,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'cross':
        return new style.RegularShape({
          fill: fill,
          points: 4,
          radius: radius,
          radius2: 0,
          stroke:
            stroke ||
            new style.Stroke({
              color: fillColor,
              width: radius / 2,
            }),
          rotation: rotationRadians,
        });

      case 'hexagon':
        return new style.RegularShape({
          fill: fill,
          points: 6,
          radius: radius,
          stroke:
            stroke ||
            new style.Stroke({
              color: fillColor,
              width: radius / 2,
            }),
          rotation: rotationRadians,
        });

      case 'octagon':
        return new style.RegularShape({
          angle: Math.PI / 8,
          fill: fill,
          points: 8,
          radius: radius / Math.cos(Math.PI / 8),
          stroke:
            stroke ||
            new style.Stroke({
              color: fillColor,
              width: radius / 2,
            }),
          rotation: rotationRadians,
        });

      case 'cross2': // cross2 is used by QGIS for the x symbol.
      case 'x':
        return new style.RegularShape({
          angle: Math.PI / 4,
          fill: fill,
          points: 4,
          radius: Math.sqrt(2.0) * radius,
          radius2: 0,
          stroke:
            stroke ||
            new style.Stroke({
              color: fillColor,
              width: radius / 2,
            }),
          rotation: rotationRadians,
        });

      case 'diamond':
        return new style.RegularShape({
          fill: fill,
          points: 4,
          radius: radius,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'horline':
        return new style.RegularShape({
          fill: fill,
          points: 2,
          radius: radius,
          angle: Math.PI / 2,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'line':
        return new style.RegularShape({
          fill: fill,
          points: 2,
          radius: radius,
          angle: 0,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'backslash':
        return new style.RegularShape({
          fill: fill,
          points: 2,
          radius: radius * Math.sqrt(2),
          angle: -Math.PI / 4,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'slash':
        return new style.RegularShape({
          fill: fill,
          points: 2,
          radius: radius * Math.sqrt(2),
          angle: Math.PI / 4,
          stroke: stroke,
          rotation: rotationRadians,
        });

      default:
        // Default is `square`
        return new style.RegularShape({
          angle: Math.PI / 4,
          fill: fill,
          points: 4,
          // For square, scale radius so the height of the square equals the given size.
          radius: radius * Math.sqrt(2.0),
          stroke: stroke,
          rotation: rotationRadians,
        });
    }
  }

  /* eslint-disable import/prefer-default-export */

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

    var styleParams = stroke.styling || {};

    // Options that have a default value.
    var strokeColor = evaluate(styleParams.stroke, null, null, '#000000');

    var strokeOpacity = evaluate(styleParams.strokeOpacity, null, null, 1.0);

    var strokeWidth = evaluate(styleParams.strokeWidth, null, null, 1.0);

    var strokeLineDashOffset = evaluate(
      styleParams.strokeDashoffset,
      null,
      null,
      0.0
    );

    var strokeOptions = {
      color: getOLColorString(strokeColor, strokeOpacity),
      width: strokeWidth,
      lineDashOffset: strokeLineDashOffset,
    };

    // Optional parameters that will be added to stroke options when present in SLD.
    var strokeLineJoin = evaluate(styleParams.strokeLinejoin, null, null);
    if (strokeLineJoin !== null) {
      strokeOptions.lineJoin = strokeLineJoin;
    }

    var strokeLineCap = evaluate(styleParams.strokeLinecap, null, null);
    if (strokeLineCap !== null) {
      strokeOptions.lineCap = strokeLineCap;
    }

    var strokeDashArray = evaluate(styleParams.strokeDasharray, null, null);
    if (strokeDashArray !== null) {
      strokeOptions.lineDash = strokeDashArray.split(' ');
    }

    return new style.Stroke(strokeOptions);
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

    var styleParams = fill.styling || {};

    var fillColor = evaluate(styleParams.fill, null, null, '#808080');

    var fillOpacity = evaluate(styleParams.fillOpacity, null, null, 1.0);

    return new style.Fill({ color: getOLColorString(fillColor, fillOpacity) });
  }

  /**
   * Change OL Style fill properties for dynamic symbolizer style parameters.
   * Modification happens in-place on the given style instance.
   * @private
   * @param {ol/style/Style} olStyle OL Style instance.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature|GeoJSON} feature OL Feature instance or GeoJSON feature object.
   * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
   * @returns {bool} Returns true if any property-dependent fill style changes have been made.
   */
  function applyDynamicFillStyling(
    olStyle,
    symbolizer,
    feature,
    getProperty
  ) {
    var olFill = olStyle.getFill();
    if (!olFill) {
      return false;
    }

    if (typeof getProperty !== 'function') {
      return false;
    }

    var somethingChanged = false;

    var fill = symbolizer.fill || {};
    var styling = fill.styling || {};

    // Change fill color if either color or opacity is property based.
    if (
      isDynamicExpression(styling.fill) ||
      isDynamicExpression(styling.fillOpacity)
    ) {
      var fillColor = evaluate(styling.fill, feature, getProperty, '#808080');
      var fillOpacity = evaluate(
        styling.fillOpacity,
        feature,
        getProperty,
        1.0
      );
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
   * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
   * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
   */
  function applyDynamicStrokeStyling(
    olStyle,
    symbolizer,
    feature,
    getProperty
  ) {
    var olStroke = olStyle.getStroke();
    if (!olStroke) {
      return false;
    }

    if (typeof getProperty !== 'function') {
      return false;
    }

    var somethingChanged = false;

    var stroke = symbolizer.stroke || {};
    var styling = stroke.styling || {};

    // Change stroke width if it's property based.
    if (isDynamicExpression(styling.strokeWidth)) {
      var strokeWidth = evaluate(
        styling.strokeWidth,
        feature,
        getProperty,
        1.0
      );
      olStroke.setWidth(strokeWidth);
      somethingChanged = true;
    }

    // Change stroke color if either color or opacity is property based.
    if (
      isDynamicExpression(styling.stroke) ||
      isDynamicExpression(styling.strokeOpacity)
    ) {
      var strokeColor = evaluate(
        styling.stroke,
        feature,
        getProperty,
        '#000000'
      );
      var strokeOpacity = evaluate(
        styling.strokeOpacity,
        feature,
        getProperty,
        1.0
      );
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
   * @param {Function} getProperty Property getter (feature, propertyName) => propertyValue.
   * @returns {bool} Returns true if any property-dependent stroke style changes have been made.
   */
  function applyDynamicTextStyling(
    olStyle,
    symbolizer,
    feature,
    getProperty
  ) {
    var olText = olStyle.getText();
    if (!olText) {
      return false;
    }

    if (typeof getProperty !== 'function') {
      return false;
    }

    // Text fill style has to be applied to text color, so it has to be set as olText stroke.
    if (
      symbolizer.fill &&
      symbolizer.fill.styling &&
      (isDynamicExpression(symbolizer.fill.styling.fill) ||
        isDynamicExpression(symbolizer.fill.styling.fillOpacity))
    ) {
      var textStrokeSymbolizer = {
        stroke: {
          styling: {
            stroke: symbolizer.fill.styling.fill,
            strokeOpacity: symbolizer.fill.styling.fillOpacity,
          },
        },
      };
      applyDynamicStrokeStyling(
        olText,
        textStrokeSymbolizer,
        feature,
        getProperty
      );
    }

    // Halo fill has to be applied as olText fill.
    if (
      symbolizer.halo &&
      symbolizer.halo.fill &&
      symbolizer.halo.fill.styling &&
      (isDynamicExpression(symbolizer.halo.fill.styling.fill) ||
        isDynamicExpression(symbolizer.halo.fill.styling.fillOpacity))
    ) {
      applyDynamicFillStyling(olText, symbolizer.halo, feature, getProperty);
    }

    // Halo radius has to be applied as olText.stroke width.
    if (symbolizer.halo && isDynamicExpression(symbolizer.halo.radius)) {
      var haloRadius = evaluate(
        symbolizer.halo.radius,
        feature,
        getProperty,
        1.0
      );
      var olStroke = olText.getStroke();
      if (olStroke) {
        var haloStrokeWidth =
          (haloRadius === 2 || haloRadius === 4
            ? haloRadius - 0.00001
            : haloRadius) * 2;
        olStroke.setWidth(haloStrokeWidth);
      }
    }

    return false;
  }

  var defaultMarkFill = getSimpleFill({ styling: { fill: '#888888' } });
  var defaultMarkStroke = getSimpleStroke({ styling: { stroke: {} } });

  /**
   * @private
   * @param  {PointSymbolizer} pointsymbolizer [description]
   * @return {object} openlayers style
   */
  function pointStyle(pointsymbolizer) {
    var style$1 = pointsymbolizer.graphic;

    // If the point size is a dynamic expression, use the default point size and update in-place later.
    var pointSizeValue = evaluate(style$1.size, null, null, DEFAULT_MARK_SIZE);

    // If the point rotation is a dynamic expression, use 0 as default rotation and update in-place later.
    var rotationDegrees = evaluate(style$1.rotation, null, null, 0.0);

    if (style$1.externalgraphic && style$1.externalgraphic.onlineresource) {
      // For external graphics: the default size is the native image size.
      // In that case, set pointSizeValue to null, so no scaling is calculated for the image.
      if (!style$1.size) {
        pointSizeValue = null;
      }

      var imageUrl = style$1.externalgraphic.onlineresource;

      // Use fallback point styles when image hasn't been loaded yet.
      switch (getImageLoadingState(imageUrl)) {
        case IMAGE_LOADED:
          return createCachedImageStyle(
            imageUrl,
            pointSizeValue,
            rotationDegrees
          );
        case IMAGE_LOADING:
          return imageLoadingPointStyle;
        case IMAGE_ERROR:
          return imageErrorPointStyle;
        default:
          // A symbolizer should have loading state metadata, but return IMAGE_LOADING just in case.
          return imageLoadingPointStyle;
      }
    }

    if (style$1.mark) {
      var ref = style$1.mark;
      var wellknownname = ref.wellknownname;
      var olFill = getSimpleFill(style$1.mark.fill);
      var olStroke = getSimpleStroke(style$1.mark.stroke);

      return new style.Style({
        // Note: size will be set dynamically later.
        image: getWellKnownSymbol(
          wellknownname,
          pointSizeValue,
          olStroke,
          olFill,
          rotationDegrees
        ),
      });
    }

    // SLD spec: when no ExternalGraphic or Mark is specified,
    // use a square of 6 pixels with 50% gray fill and a black outline.
    return new style.Style({
      image: getWellKnownSymbol(
        'square',
        pointSizeValue,
        defaultMarkStroke,
        defaultMarkFill,
        rotationDegrees
      ),
    });
  }

  var cachedPointStyle = memoizeStyleFunction(pointStyle);

  /**
   * @private
   * Get an OL point style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPointStyle(symbolizer, feature, getProperty) {
    // According to SLD spec, when a point symbolizer has no Graphic, nothing will be rendered.
    if (!(symbolizer && symbolizer.graphic)) {
      return emptyStyle;
    }

    var olStyle = cachedPointStyle(symbolizer);

    // Reset previous calculated point geometry left by evaluating point style for a line or polygon feature.
    olStyle.setGeometry(null);

    var olImage = olStyle.getImage();

    // Apply dynamic values to the cached OL style instance before returning it.

    var graphic = symbolizer.graphic;

    // Calculate size and rotation values first.
    var size = graphic.size;
    var rotation = graphic.rotation;
    var sizeValue =
      Number(evaluate(size, feature, getProperty)) || DEFAULT_MARK_SIZE;
    var rotationDegrees =
      Number(evaluate(rotation, feature, getProperty)) || 0.0;

    // --- Update dynamic size ---
    if (isDynamicExpression(size)) {
      if (graphic.externalgraphic && graphic.externalgraphic.onlineresource) {
        var height = olImage.getSize()[1];
        var scale = sizeValue / height || 1;
        olImage.setScale(scale);
      } else if (graphic.mark && graphic.mark.wellknownname === 'circle') {
        // Note: only ol/style/Circle has a setter for radius. RegularShape does not.
        olImage.setRadius(sizeValue * 0.5);
      } else {
        // For a non-Circle RegularShape, create a new olImage in order to update the size.
        olImage = getWellKnownSymbol(
          (graphic.mark && graphic.mark.wellknownname) || 'square',
          sizeValue,
          // Note: re-use stroke and fill instances for a (small?) performance gain.
          olImage.getStroke(),
          olImage.getFill(),
          rotationDegrees
        );
        olStyle.setImage(olImage);
      }
    }

    // --- Update dynamic rotation ---
    if (isDynamicExpression(rotation)) {
      // Note: OL angles are in radians.
      var rotationRadians = (Math.PI * rotationDegrees) / 180.0;
      olImage.setRotation(rotationRadians);
    }

    // --- Update stroke and fill ---
    if (graphic.mark) {
      var strokeChanged = applyDynamicStrokeStyling(
        olImage,
        graphic.mark,
        feature,
        getProperty
      );

      var fillChanged = applyDynamicFillStyling(
        olImage,
        graphic.mark,
        feature,
        getProperty
      );

      if (strokeChanged || fillChanged) {
        // Create a new olImage in order to force a re-render to see the style changes.
        olImage = getWellKnownSymbol(
          (graphic.mark && graphic.mark.wellknownname) || 'square',
          sizeValue,
          olImage.getStroke(),
          olImage.getFill(),
          rotationDegrees
        );
        olStyle.setImage(olImage);
      }
    }

    // Update displacement
    var displacement = graphic.displacement;
    if (displacement) {
      var displacementx = displacement.displacementx;
      var displacementy = displacement.displacementy;
      if (
        typeof displacementx !== 'undefined' ||
        typeof displacementy !== 'undefined'
      ) {
        var dx = evaluate(displacementx, feature, getProperty) || 0.0;
        var dy = evaluate(displacementy, feature, getProperty) || 0.0;
        if (dx !== 0.0 || dy !== 0.0) {
          olImage.setDisplacement([dx, dy]);
        }
      }
    }

    return olStyle;
  }

  function calculatePointsDistance(coord1, coord2) {
    var dx = coord1[0] - coord2[0];
    var dy = coord1[1] - coord2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  function calculateSplitPointCoords(startCoord, endCoord, distanceFromStart) {
    var distanceBetweenNodes = calculatePointsDistance(startCoord, endCoord);
    var d = distanceFromStart / distanceBetweenNodes;
    var x = startCoord[0] + (endCoord[0] - startCoord[0]) * d;
    var y = startCoord[1] + (endCoord[1] - startCoord[1]) * d;
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
    var dX = p2[0] - p1[0];
    var dY = p2[1] - p1[1];
    var angle = -Math.atan2(invertY ? -dY : dY, dX);
    return angle;
  }

  // eslint-disable-next-line import/prefer-default-export
  function splitLineString(geometry, graphicSpacing, options) {
    if ( options === void 0 ) options = {};

    var coords = geometry.getCoordinates();

    // Handle degenerate cases.
    // LineString without points
    if (coords.length === 0) {
      return [];
    }

    // LineString containing only one point.
    if (coords.length === 1) {
      return [( coords[0] ).concat( [0])];
    }

    // Handle first point placement case.
    if (options.placement === PLACEMENT_FIRSTPOINT) {
      var p1 = coords[0];
      var p2 = coords[1];
      return [[p1[0], p1[1], calculateAngle(p1, p2, options.invertY)]];
    }

    // Handle last point placement case.
    if (options.placement === PLACEMENT_LASTPOINT) {
      var p1$1 = coords[coords.length - 2];
      var p2$1 = coords[coords.length - 1];
      return [[p2$1[0], p2$1[1], calculateAngle(p1$1, p2$1, options.invertY)]];
    }

    var totalLength = geometry.getLength();
    var gapSize = Math.max(graphicSpacing, 0.1); // 0.1 px minimum gap size to prevent accidents.

    // Measure along line to place the next point.
    // Can start at a nonzero value if initialGap is used.
    var nextPointMeasure = options.initialGap || 0.0;
    var pointIndex = 0;
    var currentSegmentStart = [].concat( coords[0] );
    var currentSegmentEnd = [].concat( coords[1] );

    // Cumulative measure of the line where each segment's length is added in succession.
    var cumulativeMeasure = 0;

    var splitPoints = [];

    // Keep adding points until the next point measure lies beyond the line length.
    while (nextPointMeasure <= totalLength) {
      var currentSegmentLength = calculatePointsDistance(
        currentSegmentStart,
        currentSegmentEnd
      );
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
        var distanceFromSegmentStart = nextPointMeasure - cumulativeMeasure;
        var splitPointCoords = calculateSplitPointCoords(
          currentSegmentStart,
          currentSegmentEnd,
          distanceFromSegmentStart
        );
        var angle = calculateAngle(
          currentSegmentStart,
          currentSegmentEnd,
          options.invertY
        );
        if (
          !options.extent ||
          extent.containsCoordinate(options.extent, splitPointCoords)
        ) {
          splitPointCoords.push(angle);
          splitPoints.push(splitPointCoords);
        }
        nextPointMeasure += gapSize;
      }
    }

    return splitPoints;
  }

  // A flag to prevent multiple renderer patches.
  var rendererPatched = false;
  function patchRenderer(renderer) {
    if (rendererPatched) {
      return;
    }

    // Add setImageStyle2 function that does the same as setImageStyle, except that it sets rotation
    // to a given value instead of taking it from imageStyle.getRotation().
    // This fixes a problem with re-use of the (cached) image style instance when drawing
    // many points inside a single line feature that are aligned according to line segment direction.
    var rendererProto = Object.getPrototypeOf(renderer);
    // eslint-disable-next-line
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
  function renderStrokeMarks(
    render,
    pixelCoords,
    graphicSpacing,
    pointStyle,
    pixelRatio,
    options
  ) {
    if (!pixelCoords) {
      return;
    }

    // The first element of the first pixelCoords entry should be a number (x-coordinate of first point).
    // If it's an array instead, then we're dealing with a multiline or (multi)polygon.
    // In that case, recursively call renderStrokeMarks for each child coordinate array.
    if (Array.isArray(pixelCoords[0][0])) {
      pixelCoords.forEach(function (pixelCoordsChildArray) {
        renderStrokeMarks(
          render,
          pixelCoordsChildArray,
          graphicSpacing,
          pointStyle,
          pixelRatio,
          options
        );
      });
      return;
    }

    // Line should be a proper line with at least two coordinates.
    if (pixelCoords.length < 2) {
      return;
    }

    // Don't render anything when the pointStyle has no image.
    var image = pointStyle.getImage();
    if (!image) {
      return;
    }

    var splitPoints = splitLineString(
      new geom.LineString(pixelCoords),
      graphicSpacing * pixelRatio,
      {
        invertY: true, // Pixel y-coordinates increase downwards in screen space.
        extent: render.extent_,
        placement: options.placement,
        initialGap: options.initialGap,
      }
    );

    splitPoints.forEach(function (point) {
      var splitPointAngle = image.getRotation() + point[2];
      render.setImageStyle2(image, splitPointAngle);
      render.drawPoint(new geom.Point([point[0] / pixelRatio, point[1] / pixelRatio]));
    });
  }

  /**
   * Create a renderer function for renderining GraphicStroke marks
   * to be used inside an OpenLayers Style.renderer function.
   * @private
   * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
   * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
   * @returns {ol/style/Style~RenderFunction} A style renderer function (pixelCoords, renderState) => void.
   */
  function getGraphicStrokeRenderer(linesymbolizer, getProperty) {
    if (!(linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke)) {
      throw new Error(
        'getGraphicStrokeRenderer error: symbolizer.stroke.graphicstroke null or undefined.'
      );
    }

    var ref = linesymbolizer.stroke;
    var graphicstroke = ref.graphicstroke;

    var options = {
      placement: PLACEMENT_DEFAULT,
    };

    // QGIS vendor options to override graphicstroke symbol placement.
    if (linesymbolizer.vendoroptions) {
      if (linesymbolizer.vendoroptions.placement === 'firstPoint') {
        options.placement = PLACEMENT_FIRSTPOINT;
      } else if (linesymbolizer.vendoroptions.placement === 'lastPoint') {
        options.placement = PLACEMENT_LASTPOINT;
      }
    }

    return function (pixelCoords, renderState) {
      // Abort when feature geometry is (Multi)Point.
      var geometryType = renderState.feature.getGeometry().getType();
      if (geometryType === 'Point' || geometryType === 'MultiPoint') {
        return;
      }

      var pixelRatio = renderState.pixelRatio || 1.0;

      // TODO: Error handling, alternatives, etc.
      var render$1 = render.toContext(renderState.context);
      patchRenderer(render$1);

      var defaultGraphicSize = DEFAULT_MARK_SIZE;
      if (graphicstroke.graphic && graphicstroke.graphic.externalgraphic) {
        defaultGraphicSize = DEFAULT_EXTERNALGRAPHIC_SIZE;
      }

      var pointStyle = getPointStyle(
        graphicstroke,
        renderState.feature,
        getProperty
      );

      // Calculate graphic spacing.
      // Graphic spacing equals the center-to-center distance of graphics along the line.
      // If there's no gap, segment length will be equal to graphic size.
      var graphicSizeExpression =
        (graphicstroke.graphic && graphicstroke.graphic.size) ||
        defaultGraphicSize;
      var graphicSize = Number(
        evaluate(
          graphicSizeExpression,
          renderState.feature,
          getProperty,
          defaultGraphicSize
        )
      );

      var graphicSpacing = calculateGraphicSpacing(linesymbolizer, graphicSize);
      options.initialGap = getInitialGapSize(linesymbolizer);

      renderStrokeMarks(
        render$1,
        pixelCoords,
        graphicSpacing,
        pointStyle,
        pixelRatio,
        options
      );
    };
  }

  /**
   * Create an OpenLayers style for rendering line symbolizers with a GraphicStroke.
   * @private
   * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
   * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
   * @returns {ol/style/Style} An OpenLayers style instance.
   */
  function getGraphicStrokeStyle(linesymbolizer, getProperty) {
    if (!(linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke)) {
      throw new Error(
        'getGraphicStrokeStyle error: linesymbolizer.stroke.graphicstroke null or undefined.'
      );
    }

    return new style.Style({
      renderer: getGraphicStrokeRenderer(linesymbolizer, getProperty),
    });
  }

  /**
   * @private
   * @param  {object} symbolizer SLD symbolizer object.
   * @return {object} OpenLayers style instance corresponding to the stroke of the given symbolizer.
   */
  function lineStyle(symbolizer) {
    if (symbolizer.stroke && symbolizer.stroke.graphicstroke) {
      return getGraphicStrokeStyle(symbolizer);
    }

    return new style.Style({
      stroke: getSimpleStroke(symbolizer.stroke),
    });
  }

  var cachedLineStyle = memoizeStyleFunction(lineStyle);

  /**
   * @private
   * Get an OL line style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getLineStyle(symbolizer, feature, getProperty) {
    var olStyle = cachedLineStyle(symbolizer);

    // Apply dynamic properties.
    applyDynamicStrokeStyling(olStyle, symbolizer, feature, getProperty);

    return olStyle;
  }

  var dense1Pixels = [[1, 1]];
  var dense2Pixels = [
    [0, 0],
    [2, 2] ];
  var dense3Pixels = [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 3],
    [2, 0],
    [0, 2] ];
  var dense4Pixels = [
    [0, 0],
    [1, 1] ];

  function fillPixels(context, xyCoords) {
    xyCoords.forEach(function (ref) {
      var x = ref[0];
      var y = ref[1];

      context.fillRect(x, y, 1, 1);
    });
  }

  function clearPixels(context, xyCoords) {
    xyCoords.forEach(function (ref) {
      var x = ref[0];
      var y = ref[1];

      context.clearRect(x, y, 1, 1);
    });
  }

  function createCanvasPattern(canvas) {
    var context = canvas.getContext('2d');

    // Scale pixel pattern according to device pixel ratio if necessary.
    if (has.DEVICE_PIXEL_RATIO === 1) {
      return context.createPattern(canvas, 'repeat');
    }

    var scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = canvas.width * has.DEVICE_PIXEL_RATIO;
    scaledCanvas.height = canvas.height * has.DEVICE_PIXEL_RATIO;

    var scaledContext = scaledCanvas.getContext('2d');
    scaledContext.imageSmoothingEnabled = false;
    scaledContext.drawImage(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height,
      0,
      0,
      scaledCanvas.width,
      scaledCanvas.height
    );

    return scaledContext.createPattern(scaledCanvas, 'repeat');
  }

  function createPixelPattern(size, color, pixels) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext('2d');

    context.fillStyle = color;
    fillPixels(context, pixels);

    return createCanvasPattern(canvas);
  }

  function createInversePixelPattern(size, color, pixels) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var context = canvas.getContext('2d');

    context.fillStyle = color;
    context.fillRect(0, 0, size, size);
    clearPixels(context, pixels);

    return createCanvasPattern(canvas);
  }

  function getQGISBrushFill(brushName, fillColor) {
    var fill = null;
    switch (brushName) {
      case 'brush://dense1':
        fill = new style.Fill({
          color: createInversePixelPattern(4, fillColor, dense1Pixels),
        });
        break;

      case 'brush://dense2':
        fill = new style.Fill({
          color: createInversePixelPattern(4, fillColor, dense2Pixels),
        });
        break;

      case 'brush://dense3':
        fill = new style.Fill({
          color: createInversePixelPattern(4, fillColor, dense3Pixels),
        });
        break;

      case 'brush://dense4':
        fill = new style.Fill({
          color: createPixelPattern(2, fillColor, dense4Pixels),
        });
        break;

      case 'brush://dense5':
        fill = new style.Fill({
          color: createPixelPattern(4, fillColor, dense3Pixels),
        });
        break;

      case 'brush://dense6':
        fill = new style.Fill({
          color: createPixelPattern(4, fillColor, dense2Pixels),
        });
        break;

      case 'brush://dense7':
        fill = new style.Fill({
          color: createPixelPattern(4, fillColor, dense1Pixels),
        });
        break;

      default:
        fill = new style.Fill({ color: fillColor });
        break;
    }

    return fill;
  }

  /* eslint-disable function-call-argument-newline */

  function createPattern(graphic) {
    var ref = getCachedImage(
      graphic.externalgraphic.onlineresource
    );
    var image = ref.image;
    var width = ref.width;
    var height = ref.height;
    var cnv = document.createElement('canvas');
    var ctx = cnv.getContext('2d');

    // Calculate image scale factor.
    var imageRatio = has.DEVICE_PIXEL_RATIO;
    if (graphic.size && height !== graphic.size) {
      imageRatio *= graphic.size / height;
    }

    // Draw image to canvas directly if no scaling necessary.
    if (imageRatio === 1) {
      return ctx.createPattern(image, 'repeat');
    }

    // Scale the image by drawing onto a temp canvas.
    var tempCanvas = document.createElement('canvas');
    var tCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width * imageRatio;
    tempCanvas.height = height * imageRatio;
    // prettier-ignore
    tCtx.drawImage(
      image,
      0, 0, width, height,
      0, 0, width * imageRatio, height * imageRatio
    );

    return ctx.createPattern(tempCanvas, 'repeat');
  }

  function getExternalGraphicFill(symbolizer) {
    var ref = symbolizer.fill.graphicfill;
    var graphic = ref.graphic;
    var fillImageUrl = graphic.externalgraphic.onlineresource;

    // Use fallback style when graphicfill image hasn't been loaded yet.
    switch (getImageLoadingState(fillImageUrl)) {
      case IMAGE_LOADED:
        return new style.Fill({
          color: createPattern(symbolizer.fill.graphicfill.graphic),
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
    var newFill = JSON.parse(JSON.stringify(graphicfill));
    var graphic = newFill.graphic;
    var oriSize = Number(graphic.size) || DEFAULT_MARK_SIZE;
    graphic.size = scaleFactor * oriSize;
    var mark = graphic.mark;
    if (mark && mark.stroke) {
      // Apply SLD defaults to stroke parameters.
      // Todo: do this at the SLDReader parsing stage already.
      if (!mark.stroke.styling) {
        mark.stroke.styling = {
          stroke: '#000000',
          strokeWidth: 1.0,
        };
      }

      if (!mark.stroke.styling.strokeWidth) {
        mark.stroke.styling.strokeWidth =
          Number(mark.stroke.styling.strokeWidth) || 1;
      }

      // If original stroke width is 1 or less, do not scale it.
      // This gives better visual results than using a stroke width of 2 and downsizing.
      var oriStrokeWidth = mark.stroke.styling.strokeWidth;
      if (oriStrokeWidth > 1) {
        mark.stroke.styling.strokeWidth = scaleFactor * oriStrokeWidth;
      }
    }

    return newFill;
  }

  function getMarkGraphicFill(symbolizer) {
    var ref = symbolizer.fill;
    var graphicfill = ref.graphicfill;
    var graphic = graphicfill.graphic;
    var mark = graphic.mark;
    var ref$1 = mark || {};
    var wellknownname = ref$1.wellknownname;

    // If it's a QGIS brush fill, use direct pixel manipulation to create the fill.
    if (wellknownname && wellknownname.indexOf('brush://') === 0) {
      var brushFillColor = '#000000';
      if (mark.fill && mark.fill.styling && mark.fill.styling.fill) {
        brushFillColor = mark.fill.styling.fill;
      }
      return getQGISBrushFill(wellknownname, brushFillColor);
    }

    // Create mark graphic fill by drawing a single mark on a square canvas.
    var graphicSize = Number(graphic.size) || DEFAULT_MARK_SIZE;
    var canvasSize = graphicSize * has.DEVICE_PIXEL_RATIO;
    var fill = null;

    // The graphic symbol will be rendered at a larger size and then scaled back to the graphic size.
    // This is done to mitigate visual artifacts that occur when drawing between pixels.
    var scaleFactor = 2.0;

    try {
      var scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = canvasSize * scaleFactor;
      scaledCanvas.height = canvasSize * scaleFactor;
      var context = scaledCanvas.getContext('2d');

      // Point symbolizer function expects an object with a .graphic property.
      // The point symbolizer is stored as graphicfill in the polygon symbolizer.
      var scaledGraphicFill = scaleMarkGraphicFill(graphicfill, scaleFactor);
      var pointStyle = getPointStyle(scaledGraphicFill);

      // Let OpenLayers draw a point with the given point style on the temp canvas.
      // Note: OL rendering context size params are always in css pixels, while the temp canvas may
      // be larger depending on the device pixel ratio.
      var olContext = render.toContext(context, {
        size: [graphicSize * scaleFactor, graphicSize * scaleFactor],
      });

      // Disable image smoothing to ensure crisp graphic fill pattern.
      context.imageSmoothingEnabled = false;

      // Let OpenLayers draw the symbol to the canvas directly.
      olContext.setStyle(pointStyle);

      var centerX = scaleFactor * (graphicSize / 2);
      var centerY = scaleFactor * (graphicSize / 2);
      olContext.drawGeometry(new geom.Point([centerX, centerY]));

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
        olContext.drawGeometry(
          new geom.Point([centerX - scaleFactor * graphicSize, centerY])
        );
        olContext.drawGeometry(
          new geom.Point([centerX + scaleFactor * graphicSize, centerY])
        );
        olContext.drawGeometry(
          new geom.Point([centerX, centerY - scaleFactor * graphicSize])
        );
        olContext.drawGeometry(
          new geom.Point([centerX, centerY + scaleFactor * graphicSize])
        );
      }

      // Downscale the drawn mark back to original graphic size.
      var patternCanvas = document.createElement('canvas');
      patternCanvas.width = canvasSize;
      patternCanvas.height = canvasSize;
      var patternContext = patternCanvas.getContext('2d');
      patternContext.drawImage(
        scaledCanvas,
        0,
        0,
        canvasSize * scaleFactor,
        canvasSize * scaleFactor,
        0,
        0,
        canvasSize,
        canvasSize
      );

      // Turn the generated image into a repeating pattern, just like a regular image fill.
      var pattern = patternContext.createPattern(patternCanvas, 'repeat');
      fill = new style.Fill({
        color: pattern,
      });
    } catch (e) {
      // Default black fill as backup plan.
      fill = new style.Fill({
        color: '#000000',
      });
    }

    return fill;
  }

  function polygonStyle(symbolizer) {
    var fillImageUrl =
      symbolizer.fill &&
      symbolizer.fill.graphicfill &&
      symbolizer.fill.graphicfill.graphic &&
      symbolizer.fill.graphicfill.graphic.externalgraphic &&
      symbolizer.fill.graphicfill.graphic.externalgraphic.onlineresource;

    var fillMark =
      symbolizer.fill &&
      symbolizer.fill.graphicfill &&
      symbolizer.fill.graphicfill.graphic &&
      symbolizer.fill.graphicfill.graphic.mark;

    var polygonFill = null;
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
    if (symbolizer.stroke && symbolizer.stroke.graphicstroke) {
      var renderGraphicStroke = getGraphicStrokeRenderer(symbolizer);
      return new style.Style({
        renderer: function (pixelCoords, renderState) {
          // First render the fill (if any).
          if (polygonFill) {
            var feature = renderState.feature;
            var context = renderState.context;
            var render$1 = render.toContext(context);
            render$1.setFillStrokeStyle(polygonFill, undefined);
            var geometryType = feature.getGeometry().getType();
            if (geometryType === 'Polygon') {
              render$1.drawPolygon(new geom.Polygon(pixelCoords));
            } else if (geometryType === 'MultiPolygon') {
              render$1.drawMultiPolygon(new geom.MultiPolygon(pixelCoords));
            }
          }

          // Then, render the graphic stroke.
          renderGraphicStroke(pixelCoords, renderState);
        },
      });
    }

    var polygonStroke = getSimpleStroke(symbolizer.stroke);

    return new style.Style({
      fill: polygonFill,
      stroke: polygonStroke,
    });
  }

  var cachedPolygonStyle = memoizeStyleFunction(polygonStyle);

  /**
   * @private
   * Get an OL line style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPolygonStyle(symbolizer, feature, getProperty) {
    var olStyle = cachedPolygonStyle(symbolizer);

    // Apply dynamic properties.
    applyDynamicFillStyling(olStyle, symbolizer, feature, getProperty);
    applyDynamicStrokeStyling(olStyle, symbolizer, feature, getProperty);

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
    if (!(textsymbolizer && textsymbolizer.label)) {
      return emptyStyle;
    }

    // If the label is dynamic, set text to empty string.
    // In that case, text will be set at runtime.
    var labelText = evaluate(textsymbolizer.label, null, null, '');

    var fontStyling = textsymbolizer.font
      ? textsymbolizer.font.styling || {}
      : {};
    var fontFamily = evaluate(fontStyling.fontFamily, null, null, 'sans-serif');
    var fontSize = evaluate(fontStyling.fontSize, null, null, 10);
    var fontStyle = evaluate(fontStyling.fontStyle, null, null, '');
    var fontWeight = evaluate(fontStyling.fontWeight, null, null, '');
    var olFontString = fontStyle + " " + fontWeight + " " + fontSize + "px " + fontFamily;

    var pointplacement =
      textsymbolizer &&
      textsymbolizer.labelplacement &&
      textsymbolizer.labelplacement.pointplacement
        ? textsymbolizer.labelplacement.pointplacement
        : {};

    // If rotation is dynamic, default to 0. Rotation will be set at runtime.
    var labelRotationDegrees = evaluate(
      pointplacement.rotation,
      null,
      null,
      0.0
    );

    var displacement =
      pointplacement && pointplacement.displacement
        ? pointplacement.displacement
        : {};
    var offsetX = evaluate(displacement.displacementx, null, null, 0.0);
    // Positive offsetY shifts the label downwards. Positive displacementY in SLD means shift upwards.
    var offsetY = -evaluate(displacement.displacementy, null, null, 0.0);

    // OpenLayers does not support fractional alignment, so snap the anchor to the most suitable option.
    var anchorpoint = (pointplacement && pointplacement.anchorpoint) || {};

    var textAlign = 'center';
    var anchorPointX = evaluate(anchorpoint.anchorpointx, null, null, NaN);
    if (anchorPointX < 0.25) {
      textAlign = 'left';
    } else if (anchorPointX > 0.75) {
      textAlign = 'right';
    }

    var textBaseline = 'middle';
    var anchorPointY = evaluate(anchorpoint.anchorpointy, null, null, NaN);
    if (anchorPointY < 0.25) {
      textBaseline = 'bottom';
    } else if (anchorPointY > 0.75) {
      textBaseline = 'top';
    }

    var fillStyling = textsymbolizer.fill ? textsymbolizer.fill.styling : {};
    var textFillColor = evaluate(fillStyling.fill, null, null, '#000000');
    var textFillOpacity = evaluate(fillStyling.fillOpacity, null, null, 1.0);

    // Assemble text style options.
    var textStyleOptions = {
      text: labelText,
      font: olFontString,
      offsetX: offsetX,
      offsetY: offsetY,
      rotation: (Math.PI * labelRotationDegrees) / 180.0,
      textAlign: textAlign,
      textBaseline: textBaseline,
      fill: new style.Fill({
        color: getOLColorString(textFillColor, textFillOpacity),
      }),
    };

    // Convert SLD halo to text symbol stroke.
    if (textsymbolizer.halo) {
      var haloStyling =
        textsymbolizer.halo && textsymbolizer.halo.fill
          ? textsymbolizer.halo.fill.styling
          : {};
      var haloFillColor = evaluate(haloStyling.fill, null, null, '#FFFFFF');
      var haloFillOpacity = evaluate(haloStyling.fillOpacity, null, null, 1.0);
      var haloRadius = evaluate(textsymbolizer.halo.radius, null, null, 1.0);
      textStyleOptions.stroke = new style.Stroke({
        color: getOLColorString(haloFillColor, haloFillOpacity),
        // wrong position width radius equal to 2 or 4
        width:
          (haloRadius === 2 || haloRadius === 4
            ? haloRadius - 0.00001
            : haloRadius) * 2,
      });
    }

    return new style.Style({
      text: new style.Text(textStyleOptions),
    });
  }

  var cachedTextStyle = memoizeStyleFunction(textStyle);

  /**
   * @private
   * Get an OL text style instance for a feature according to a symbolizer.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getTextStyle(symbolizer, feature, getProperty) {
    var olStyle = cachedTextStyle(symbolizer);
    var olText = olStyle.getText();
    if (!olText) {
      return olStyle;
    }

    // Read text from feature and set it on the text style instance.
    var label = symbolizer.label;
    var labelplacement = symbolizer.labelplacement;

    // Set text only if the label expression is dynamic.
    if (isDynamicExpression(label)) {
      var labelText = evaluate(label, feature, getProperty, '');
      // Important! OpenLayers expects the text property to always be a string.
      olText.setText(labelText.toString());
    }

    // Set rotation if expression is dynamic.
    if (labelplacement) {
      var pointPlacementRotation =
        (labelplacement.pointplacement &&
          labelplacement.pointplacement.rotation) ||
        0.0;
      if (isDynamicExpression(pointPlacementRotation)) {
        var labelRotationDegrees = evaluate(
          pointPlacementRotation,
          feature,
          getProperty,
          0.0
        );
        olText.setRotation((Math.PI * labelRotationDegrees) / 180.0); // OL rotation is in radians.
      }
    }

    // Set line or point placement according to geometry type.
    var geometry = feature.getGeometry
      ? feature.getGeometry()
      : feature.geometry;
    var geometryType = geometry.getType ? geometry.getType() : geometry.type;
    var lineplacement =
      symbolizer &&
      symbolizer.labelplacement &&
      symbolizer.labelplacement.lineplacement
        ? symbolizer.labelplacement.lineplacement
        : null;
    var placement =
      geometryType !== 'point' && lineplacement ? 'line' : 'point';
    olText.setPlacement(placement);

    // Apply dynamic style properties.
    applyDynamicTextStyling(olStyle, symbolizer, feature, getProperty);

    // Adjust font if one or more font svgparameters are dynamic.
    if (symbolizer.font && symbolizer.font.styling) {
      var fontStyling = symbolizer.font.styling || {};
      if (
        isDynamicExpression(fontStyling.fontFamily) ||
        isDynamicExpression(fontStyling.fontStyle) ||
        isDynamicExpression(fontStyling.fontWeight) ||
        isDynamicExpression(fontStyling.fontSize)
      ) {
        var fontFamily = evaluate(
          fontStyling.fontFamily,
          feature,
          getProperty,
          'sans-serif'
        );
        var fontStyle = evaluate(
          fontStyling.fontStyle,
          feature,
          getProperty,
          ''
        );
        var fontWeight = evaluate(
          fontStyling.fontWeight,
          feature,
          getProperty,
          ''
        );
        var fontSize = evaluate(fontStyling.fontSize, feature, getProperty, 10);
        var olFontString = fontStyle + " " + fontWeight + " " + fontSize + "px " + fontFamily;
        olText.setFont(olFontString);
      }
    }

    return olStyle;
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
    var splitPoints = splitLineString(geometry, geometry.getLength() / 2);
    var ref = splitPoints[1];
    var x = ref[0];
    var y = ref[1];
    return [x, y];
  }

  /**
   * @private
   * Get an OL point style instance for a line feature according to a symbolizer.
   * The style will render a point on the middle of the line.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getLinePointStyle(symbolizer, feature) {
    if (typeof feature.getGeometry !== 'function') {
      return null;
    }

    var geom$1 = feature.getGeometry();
    if (!geom$1) {
      return null;
    }

    var pointStyle = null;
    var geomType = geom$1.getType();
    if (geomType === 'LineString') {
      pointStyle = getPointStyle(symbolizer, feature);
      pointStyle.setGeometry(new geom.Point(getLineMidpoint(geom$1)));
    } else if (geomType === 'MultiLineString') {
      var lineStrings = geom$1.getLineStrings();
      var multiPointCoords = lineStrings.map(getLineMidpoint);
      pointStyle = getPointStyle(symbolizer, feature);
      pointStyle.setGeometry(new geom.MultiPoint(multiPointCoords));
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
    var ref = geometry.getInteriorPoint().getCoordinates();
    var x = ref[0];
    var y = ref[1];
    return [x, y];
  }

  /**
   * @private
   * Get an OL point style instance for a line feature according to a symbolizer.
   * The style will render a point on the middle of the line.
   * @param {object} symbolizer SLD symbolizer object.
   * @param {ol/Feature} feature OpenLayers Feature.
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPolygonPointStyle(symbolizer, feature) {
    if (typeof feature.getGeometry !== 'function') {
      return null;
    }

    var geom$1 = feature.getGeometry();
    if (!geom$1) {
      return null;
    }

    var pointStyle = null;
    var geomType = geom$1.getType();
    if (geomType === 'Polygon') {
      pointStyle = getPointStyle(symbolizer, feature);
      pointStyle.setGeometry(new geom.Point(getInteriorPoint(geom$1)));
    } else if (geomType === 'MultiPolygon') {
      var polygons = geom$1.getPolygons();
      var multiPointCoords = polygons.map(getInteriorPoint);
      pointStyle = getPointStyle(symbolizer, feature);
      pointStyle.setGeometry(new geom.MultiPoint(multiPointCoords));
    }

    return pointStyle;
  }

  var defaultStyles = [defaultPointStyle];

  /**
   * @private
   * Convert symbolizers together with the feature to OL style objects and append them to the OL styles array.
   * @example appendStyles(styles, point[j], feature, getPointStyle);
   * @param {Array<ol/style>} styles Array of OL styles.
   * @param {Array<object>} symbolizers Array of feature symbolizers.
   * @param {ol/feature} feature OpenLayers feature.
   * @param {Function} styleFunction Function for getting the OL style object. Signature (symbolizer, feature) => OL style.
   * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
   */
  function appendStyles(
    styles,
    symbolizers,
    feature,
    styleFunction,
    getProperty
  ) {
    (symbolizers || []).forEach(function (symbolizer) {
      var olStyle = styleFunction(symbolizer, feature, getProperty);
      if (olStyle) {
        styles.push(olStyle);
      }
    });
  }

  /**
   * Create openlayers style
   * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
   * @param {object} categorizedSymbolizers Symbolizers categorized by type, e.g. .pointSymbolizers = [array of point symbolizer objects].
   * @param {object|Feature} feature {@link http://geojson.org|geojson}
   *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
   * @param {Function} getProperty A property getter: (feature, propertyName) => property value.
   * @param {object} [options] Optional options object.
   * @param {boolean} [options.strictGeometryMatch] Default false. When true, only apply symbolizers to the corresponding geometry type.
   * E.g. point symbolizers will not be applied to lines and polygons. Default false (according to SLD spec).
   * @param {boolean} [options.useFallbackStyles] Default true. When true, provides default OL styles as fallback for unknown geometry types.
   * @return ol.style.Style or array of it
   */
  function OlStyler(
    categorizedSymbolizers,
    feature,
    getProperty,
    options
  ) {
    if ( options === void 0 ) options = {};

    var polygonSymbolizers = categorizedSymbolizers.polygonSymbolizers;
    var lineSymbolizers = categorizedSymbolizers.lineSymbolizers;
    var pointSymbolizers = categorizedSymbolizers.pointSymbolizers;
    var textSymbolizers = categorizedSymbolizers.textSymbolizers;

    var defaultOptions = {
      strictGeometryMatch: false,
      useFallbackStyles: true,
    };

    var styleOptions = Object.assign({}, defaultOptions, options);

    var geometry = feature.getGeometry
      ? feature.getGeometry()
      : feature.geometry;
    var geometryType = geometry.getType ? geometry.getType() : geometry.type;

    var styles = [];
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        appendStyles(
          styles,
          pointSymbolizers,
          feature,
          getPointStyle,
          getProperty
        );
        appendStyles(styles, textSymbolizers, feature, getTextStyle, getProperty);
        break;

      case 'LineString':
      case 'MultiLineString':
        appendStyles(styles, lineSymbolizers, feature, getLineStyle, getProperty);
        if (!styleOptions.strictGeometryMatch) {
          appendStyles(
            styles,
            pointSymbolizers,
            feature,
            getLinePointStyle,
            getProperty
          );
        }
        appendStyles(styles, textSymbolizers, feature, getTextStyle, getProperty);
        break;

      case 'Polygon':
      case 'MultiPolygon':
        appendStyles(
          styles,
          polygonSymbolizers,
          feature,
          getPolygonStyle,
          getProperty
        );
        if (!styleOptions.strictGeometryMatch) {
          appendStyles(
            styles,
            lineSymbolizers,
            feature,
            getLineStyle,
            getProperty
          );
        }
        appendStyles(
          styles,
          pointSymbolizers,
          feature,
          getPolygonPointStyle,
          getProperty
        );
        appendStyles(styles, textSymbolizers, feature, getTextStyle, getProperty);
        break;

      default:
        if (styleOptions.useFallbackStyles) {
          styles = defaultStyles;
        }
    }

    // Set z-index of styles explicitly to fix a bug where GraphicStroke is always rendered above a line symbolizer.
    styles.forEach(function (style, index) { return style.setZIndex(index); });

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
  function createOlStyleFunction(featureTypeStyle, options) {
    if ( options === void 0 ) options = {};

    var imageLoadedCallback = options.imageLoadedCallback || (function () {});

    // Keep track of whether a callback has been registered per image url.
    var callbackRef = {};

    return function (feature, mapResolution) {
      // Determine resolution in meters/pixel.
      var resolution =
        typeof options.convertResolution === 'function'
          ? options.convertResolution(mapResolution)
          : mapResolution;

      var getProperty =
        typeof options.getProperty === 'function'
          ? options.getProperty
          : getOlFeatureProperty;

      // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
      var rules = getRules(featureTypeStyle, feature, resolution, {
        getProperty: getProperty,
        getFeatureId: getOlFeatureId,
      });

      // Start loading images for external graphic symbolizers and when loaded:
      // * update symbolizers to use the cached image.
      // * call imageLoadedCallback with the image url.
      processExternalGraphicSymbolizers(
        rules,
        featureTypeStyle,
        imageLoadedCallback,
        callbackRef
      );

      // Convert style rules to style rule lookup categorized by geometry type.
      var categorizedSymbolizers = categorizeSymbolizers(rules);

      // Determine style rule array.
      var olStyles = OlStyler(categorizedSymbolizers, feature, getProperty);

      return olStyles;
    };
  }

  /**
   * Create an array of OpenLayers style instances for features with the chosen geometry type from a style rule.
   * Since this function creates a static OpenLayers style and not a style function,
   * usage of this function is only suitable for simple symbolizers that do not depend on feature properties
   * and do not contain external graphics. External graphic marks will be shown as a grey circle instead.
   * @param {StyleRule} styleRule Feature Type Style Rule object.
   * @param {string} geometryType One of 'Point', 'LineString' or 'Polygon'
   * @returns {Array<ol.Style>} An array of OpenLayers style instances.
   * @example
   * myOlVectorLayer.setStyle(SLDReader.createOlStyle(featureTypeStyle.rules[0], 'Point');
   */
  function createOlStyle(styleRule, geometryType) {
    var categorizedSymbolizers = categorizeSymbolizers([styleRule]);

    var olStyles = OlStyler(
      categorizedSymbolizers,
      { geometry: { type: geometryType } },
      function () { return null; },
      { strictGeometryMatch: true, useFallbackStyles: false }
    );

    return olStyles.filter(function (style) { return style !== null; });
  }

  /**
   *
   * @param {any} input Input value.
   * @returns The string representation of the input value.
   * It will always return a valid string and return an empty string for null and undefined values.
   * Other types of input will be returned as their type name.
   */
  // eslint-disable-next-line import/prefer-default-export
  function asString(input) {
    if (input === null) {
      return '';
    }
    var inputType = typeof input;
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

  // The functions below are taken from the Geoserver function list.
  // https://docs.geoserver.org/latest/en/user/filter/function_reference.html#string-functions
  // Note: implementation details may be different from Geoserver implementations.
  // SLDReader function parameters are not strictly typed and will convert inputs in a sensible manner.

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
    var startIndex = Number(start);
    var lengthInt = Number(length);
    if (Number.isNaN(startIndex)) {
      return '';
    }

    // Note: implementation specification taken from https://docs.qgis.org/3.28/en/docs/user_manual/expressions/functions_list.html#substr
    var text = asString(input);
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
    var text = asString(input);
    var beginIndex = Number(begin);
    var endIndex = Number(end);
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
    var text = asString(input);
    var beginIndex = Number(begin);
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
   * @returns {number} The dimension of the geometry. Will return 0 for GeometryCollection or unknown type.
   */
  function dimension(olGeometry) {
    switch (geometryType(olGeometry)) {
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
        return 0;
    }
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
    var inputArgs = [], len = arguments.length;
    while ( len-- ) inputArgs[ len ] = arguments[ len ];

    var test = inputArgs[0];
    var candidates = inputArgs.slice(1);
    // Compare test with candidates as string.
    var testString = asString(test);
    return candidates.some(function (candidate) { return asString(candidate) === testString; });
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
    for (var k = 2; k <= 10; k += 1) {
      registerFunction(("in" + k), stringIn);
    }

    // Math operators as functions
    registerFunction('__fe:Add__', function (a, b) { return Number(a) + Number(b); });
    registerFunction('__fe:Sub__', function (a, b) { return Number(a) - Number(b); });
    registerFunction('__fe:Mul__', function (a, b) { return Number(a) * Number(b); });
    registerFunction('__fe:Div__', function (a, b) { return Number(a) / Number(b); });
  }

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
  exports.registerFunction = registerFunction;

}));
