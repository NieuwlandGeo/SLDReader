(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ol/style'), require('ol/render'), require('ol/geom'), require('ol/extent')) :
  typeof define === 'function' && define.amd ? define(['exports', 'ol/style', 'ol/render', 'ol/geom', 'ol/extent'], factory) :
  (global = global || self, factory(global.SLDReader = {}, global.ol.style, global.ol.render, global.ol.geom, global.ol.extent));
}(this, (function (exports, style, render, geom, extent) { 'use strict';

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

  /**
   * @private
   * @param {string} localName
   *
   * @return null|string
   */
  function getChildTextContent(node, localName) {
    var propertyNameElement = node
      .getElementsByTagNameNS(node.namespaceURI, localName)
      .item(0);
    if (!propertyNameElement) {
      return null;
    }
    if (propertyNameElement.parentNode !== node) {
      throw new Error('Expected direct descant');
    }
    return propertyNameElement ? propertyNameElement.textContent.trim() : null;
  }

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
  function createComparison(element) {
    if (BINARY_COMPARISON_NAMES.includes(element.localName)) {
      return createBinaryFilterComparison(element);
    }
    if (element.localName === 'PropertyIsBetween') {
      return createIsBetweenComparison(element);
    }
    if (element.localName === 'PropertyIsNull') {
      return createIsNullComparison(element);
    }
    if (element.localName === 'PropertyIsLike') {
      return createIsLikeComparison(element);
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
  function createBinaryFilterComparison(element) {
    var propertyname = getChildTextContent(element, 'PropertyName');
    var literal = getChildTextContent(element, 'Literal');

    return {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      propertyname: propertyname,
      literal: literal,
    };
  }

  /**
   * factory for element type PropertyIsLikeType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsLikeComparison(element) {
    var propertyname = getChildTextContent(element, 'PropertyName');
    var literal = getChildTextContent(element, 'Literal');
    return {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      propertyname: propertyname,
      literal: literal,
      wildcard: element.getAttribute('wildCard'),
      singlechar: element.getAttribute('singleChar'),
      escapechar: element.getAttribute('escapeChar'),
    };
  }
  /**
   * factory for element type PropertyIsNullType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsNullComparison(element) {
    var propertyname = getChildTextContent(element, 'PropertyName');

    return {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      propertyname: propertyname,
    };
  }
  /**
   * factory for element type PropertyIsBetweenType
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createIsBetweenComparison(element) {
    var propertyname = getChildTextContent(element, 'PropertyName');
    var lowerboundary = getChildTextContent(element, 'LowerBoundary');
    var upperboundary = getChildTextContent(element, 'UpperBoundary');
    return {
      type: TYPE_COMPARISON,
      operator: element.localName.toLowerCase(),
      lowerboundary: lowerboundary,
      upperboundary: upperboundary,
      propertyname: propertyname,
    };
  }

  /**
   * Factory for and/or filter
   * @private
   * @param {Element} element
   *
   * @return {object}
   */
  function createBinaryLogic(element) {
    var predicates = [];
    for (var n = element.firstElementChild; n; n = n.nextElementSibling) {
      if (isComparison(n)) {
        predicates.push(createComparison(n));
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
  function createUnaryLogic(element) {
    var predicate = null;
    var childElement = element.firstElementChild;
    if (childElement && isComparison(childElement)) {
      predicate = createComparison(childElement);
    }
    if (childElement && isBinary(childElement)) {
      predicate = createBinaryLogic(childElement);
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
  function createFilter(element) {
    var filter = {};
    for (var n = element.firstElementChild; n; n = n.nextElementSibling) {
      if (isComparison(n)) {
        filter = createComparison(n);
      }
      if (isBinary(n)) {
        filter = createBinaryLogic(n);
      }
      if (n.localName.toLowerCase() === 'not') {
        filter = createUnaryLogic(n);
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
    var property = prop.toLowerCase();
    obj[property] = obj[property] || [];
    var item = {};
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
    var property = prop.toLowerCase();
    var item = {};
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
    var property = prop.toLowerCase();
    obj[property] = {};
    readNode(node, obj[property]);
  }

  /**
   * Assigns textcontnet to obj.prop
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
  function addFilterExpressionProp(node, obj, prop, skipEmptyNodes) {
    if ( skipEmptyNodes === void 0 ) skipEmptyNodes = true;

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

    var property = prop.toLowerCase();

    // If expression children are all literals, concatenate them into a string.
    var allLiteral = childExpressions.every(
      function (childExpression) { return childExpression.type === 'literal'; }
    );

    if (allLiteral) {
      obj[property] = childExpressions
        .map(function (expression) { return expression.value; })
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
   * @param  {String} prop
   */
  function parameters(element, obj, prop) {
    var propnames = {
      CssParameter: 'styling',
      SvgParameter: 'styling',
      VendorOption: 'vendoroption',
    };
    var propname = propnames[prop] || 'styling';
    obj[propname] = obj[propname] || {};
    var name = element
      .getAttribute('name')
      .toLowerCase()
      .replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });
    obj[propname][name] = element.textContent.trim();
  }

  var FilterParsers = {
    Filter: function (element, obj) {
      obj.filter = createFilter(element);
    },
    ElseFilter: function (element, obj) {
      obj.elsefilter = true;
    },
  };

  var SymbParsers = {
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
    Mark: addProp,
    Label: function (node, obj, prop) { return addFilterExpressionProp(node, obj, prop, false); },
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
    OnlineResource: function (element, obj) {
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
    MaxScaleDenominator: addPropWithTextContent,
    MinScaleDenominator: addPropWithTextContent},
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

  function propertyIsLessThan(comparison, value) {
    return (
      // Todo: support string comparison as well
      typeof value !== 'undefined' && Number(value) < Number(comparison.literal)
    );
  }

  function propertyIsBetween(comparison, value) {
    // Todo: support string comparison as well
    var lowerBoundary = Number(comparison.lowerboundary);
    var upperBoundary = Number(comparison.upperboundary);
    var numericValue = Number(value);
    return numericValue >= lowerBoundary && numericValue <= upperBoundary;
  }

  function propertyIsEqualTo(comparison, value) {
    if (typeof value === 'undefined') {
      return false;
    }
    /* eslint-disable-next-line eqeqeq */
    return value == comparison.literal;
  }

  function propertyIsNull(comparison, value) {
    /* eslint-disable-next-line eqeqeq */
    return value == null;
  }

  /**
   * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
   * @private
   * @param {object} comparison filter object for operator 'propertyislike'
   * @param {string|number} value Feature property value.
   * @param {object} getProperty A function with parameters (feature, propertyName) to extract
   * the value of a property from a feature.
   */
  function propertyIsLike(comparison, value) {
    var pattern = comparison.literal;

    if (typeof value === 'undefined') {
      return false;
    }

    // Create regex string from match pattern.
    var wildcard = comparison.wildcard;
    var singlechar = comparison.singlechar;
    var escapechar = comparison.escapechar;

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

    var rex = new RegExp(patternAsRegex);
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
    var value = getProperty(feature, comparison.propertyname);

    switch (comparison.operator) {
      case 'propertyislessthan':
        return propertyIsLessThan(comparison, value);
      case 'propertyisequalto':
        return propertyIsEqualTo(comparison, value);
      case 'propertyislessthanorequalto':
        return (
          propertyIsEqualTo(comparison, value) ||
          propertyIsLessThan(comparison, value)
        );
      case 'propertyisnotequalto':
        return !propertyIsEqualTo(comparison, value);
      case 'propertyisgreaterthan':
        return (
          !propertyIsLessThan(comparison, value) &&
          !propertyIsEqualTo(comparison, value)
        );
      case 'propertyisgreaterthanorequalto':
        return (
          !propertyIsLessThan(comparison, value) ||
          propertyIsEqualTo(comparison, value)
        );
      case 'propertyisbetween':
        return propertyIsBetween(comparison, value);
      case 'propertyisnull':
        return propertyIsNull(comparison, value);
      case 'propertyislike':
        return propertyIsLike(comparison, value);
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
   * @param {string} [name] of style
   * @return {object} the style from layer.styles matching the name
   */
  function getStyle(layer, name) {
    if (name) {
      return layer.styles.find(function (s) { return s.name === name; });
    }
    return layer.styles.find(function (s) { return s.default; });
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

    var result = [];
    for (var j = 0; j < featureTypeStyle.rules.length; j += 1) {
      var rule = featureTypeStyle.rules[j];
      if (scaleSelector(rule, resolution)) {
        if (rule.filter && filterSelector(rule.filter, feature, options)) {
          result.push(rule);
        } else if (rule.elsefilter && result.length === 0) {
          result.push(rule);
        } else if (!rule.elsefilter && !rule.filter) {
          result.push(rule);
        }
      }
    }
    return result;
  }

  /**
   * Get all symbolizers inside a given rule.
   * Note: this will be a mix of Point/Line/Polygon/Text symbolizers.
   * @param {object} rule SLD rule object.
   * @returns {Array<object>} Array of all symbolizers in a rule.
   */
  function getRuleSymbolizers(rule) {
    // Helper for adding a symbolizer to a list when the symbolizer can be an array of symbolizers.
    // Todo: refactor style reader, so symbolizer is always an array.
    function addSymbolizer(list, symbolizer) {
      if (!symbolizer) {
        return;
      }
      if (Array.isArray(symbolizer)) {
        Array.prototype.push.apply(list, symbolizer);
        return;
      }
      list.push(symbolizer);
    }

    var allSymbolizers = [];
    addSymbolizer(allSymbolizers, rule.pointsymbolizer);
    addSymbolizer(allSymbolizers, rule.linesymbolizer);
    addSymbolizer(allSymbolizers, rule.polygonsymbolizer);
    addSymbolizer(allSymbolizers, rule.textsymbolizer);

    return allSymbolizers;
  }

  /**
   * Gets a nested property from an object according to a property path.
   * Note: path fragments may not contain a ".".
   * Note: returns undefined if input obj is falsy.
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
   * @return {GeometryStyles}
   */
  function getGeometryStyles(rules) {
    var result = {
      polygon: [],
      line: [],
      point: [],
      text: [],
    };
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].polygonsymbolizer) {
        result.polygon.push(rules[i].polygonsymbolizer);
      }
      if (rules[i].linesymbolizer && rules[i].linesymbolizer) {
        result.line.push(rules[i].linesymbolizer);
      }
      if (rules[i].pointsymbolizer) {
        var ref = rules[i];
        var pointsymbolizer = ref.pointsymbolizer;
        result.point.push(pointsymbolizer);
      }
      if (rules[i].textsymbolizer) {
        var ref$1 = rules[i];
        var textsymbolizer = ref$1.textsymbolizer;
        result.text.push(textsymbolizer);
      }
    }
    return result;
  }

  /**
   * @typedef GeometryStyles
   * @name GeometryStyles
   * @description contains for each geometry type the symbolizer from an array of rules
   * @property {PolygonSymbolizer[]} polygon polygonsymbolizers
   * @property {LineSymbolizer[]} line linesymbolizers
   * @property {PointSymbolizer[]} point pointsymbolizers, same as graphic prop from PointSymbolizer
   */

  var IMAGE_LOADING = 'IMAGE_LOADING';
  var IMAGE_LOADED = 'IMAGE_LOADED';
  var IMAGE_ERROR = 'IMAGE_ERROR';

  // SLD Spec: Default size for Marks without Size should be 6 pixels.
  var DEFAULT_MARK_SIZE = 6; // pixels
  // SLD Spec: Default size for ExternalGraphic with an unknown native size,
  // like SVG without dimensions, should be 16 pixels.
  var DEFAULT_EXTERNALGRAPHIC_SIZE = 16; // pixels

  /* eslint-disable no-continue */

  // These are possible locations for an external graphic inside a symbolizer.
  var externalGraphicPaths = [
    'graphic.externalgraphic',
    'stroke.graphicstroke.graphic.externalgraphic',
    'fill.graphicfill.graphic.externalgraphic' ];

  /**
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
   * Load and cache an image that's used as externalGraphic inside one or more symbolizers inside a feature type style object.
   * When the image is loaded, the symbolizers with ExternalGraphics pointing to the image are invalidated,
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
    var image = new Image();

    image.onload = function () {
      setCachedImage(imageUrl, {
        url: imageUrl,
        image: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setImageLoadingState(imageUrl, IMAGE_LOADED);
      invalidateExternalGraphics(featureTypeStyle, imageUrl);
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback(imageUrl);
      }
    };

    image.onerror = function () {
      setImageLoadingState(imageUrl, IMAGE_ERROR);
      invalidateExternalGraphics(featureTypeStyle, imageUrl);
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback();
      }
    };

    image.src = imageUrl;
    setImageLoadingState(imageUrl, IMAGE_LOADING);
    invalidateExternalGraphics(featureTypeStyle, imageUrl);
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
    imageLoadedCallback
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
          if (!imageLoadingState) {
            // Start loading the image and set image load state on the symbolizer.
            setImageLoadingState(imageUrl, IMAGE_LOADING);
            loadExternalGraphic(imageUrl, featureTypeStyle, imageLoadedCallback);
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
      radius1: 8,
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
   * @private
   * Function to memoize style conversion functions that convert sld symbolizers to OpenLayers style instances.
   * The memoized version of the style converter returns the same OL style instance if the symbolizer is the same object.
   * Uses a WeakMap internally.
   * Note: This only works for constant symbolizers.
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
   * @private
   * Convert a hex color (like #AABBCC) to an rgba-string.
   * @param  {string} hex   eg #AA00FF
   * @param  {Number} alpha eg 0.5
   * @return {string}       rgba(0,0,0,0)
   */
  function hexToRGB(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    if (alpha) {
      return ("rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")");
    }
    return ("rgb(" + r + ", " + g + ", " + b + ")");
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

    var radius = 0.5 * size;
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
          radius1: radius,
          radius2: radius / 2.5,
          stroke: stroke,
          rotation: rotationRadians,
        });

      case 'cross':
        return new style.RegularShape({
          fill: fill,
          points: 4,
          radius1: radius,
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
          fill: fill,
          points: 8,
          radius: radius,
          stroke:
            stroke ||
            new style.Stroke({
              color: fillColor,
              width: radius / 2,
            }),
          rotation: rotationRadians,
        });

      case 'x':
        return new style.RegularShape({
          angle: Math.PI / 4,
          fill: fill,
          points: 4,
          radius1: radius,
          radius2: 0,
          stroke:
            stroke ||
            new style.Stroke({
              color: fillColor,
              width: radius / 2,
            }),
          rotation: rotationRadians,
        });

      default:
        // Default is `square`
        return new style.RegularShape({
          angle: Math.PI / 4,
          fill: fill,
          points: 4,
          // For square, scale radius so the height of the square equals the given size.
          radius1: radius * Math.sqrt(2.0),
          stroke: stroke,
          rotation: rotationRadians,
        });
    }
  }

  // This module contains an evaluate function that takes an SLD expression and a feature and outputs the value for that feature.
  // Constant expressions are returned as-is.

  /**
   * @private
   * Evaluate the value of a sub-expression.
   * @param {object} childExpression SLD object expression child.
   * @param {ol/feature} feature OpenLayers feature instance.feature.
   */
  function evaluateChildExpression(childExpression, feature) {
    // For now, the only valid child types are 'propertyname' and 'literal'.
    // Todo: add,sub,mul,div. Maybe a few functions as well.
    if (childExpression.type === 'literal') {
      return childExpression.value;
    }

    if (childExpression.type === 'propertyname') {
      return feature.get(childExpression.value);
    }

    return null;
  }

  /**
   * @private
   * This function takes an SLD expression and an OL feature and outputs the expression value for that feature.
   * Constant expressions are returned as-is.
   * @param {object|string} expression SLD object expression.
   * @param {ol/feature} feature OpenLayers feature instance.
   */
  function evaluate(expression, feature) {
    // The only compound expressions have type: 'expression'.
    // If it does not have this type, it's probably a plain string (or number).
    if (expression.type !== 'expression') {
      return expression;
    }

    // Evaluate the child expression when there is only one child.
    if (expression.children.length === 1) {
      return evaluateChildExpression(expression.children[0], feature);
    }

    // In case of multiple child expressions, concatenate the evaluated child results.
    var childValues = [];
    for (var k = 0; k < expression.children.length; k += 1) {
      childValues.push(evaluateChildExpression(expression.children[k], feature));
    }
    return childValues.join('');
  }

  /**
   * @private
   * Utility function for evaluating dynamic expressions without a feature.
   * If the expression is static, the expression value will be returned.
   * If the expression is dynamic, defaultValue will be returned.
   * If the expression is falsy, defaultValue will be returned.
   * @param {object|string} expression SLD object expression (or string).
   * @param {any} defaultValue Default value.
   * @returns {any} The value of a static expression or default value if the expression is dynamic.
   */
  function expressionOrDefault(expression, defaultValue) {
    if (!expression) {
      return defaultValue;
    }

    if (expression.type === 'expression') {
      return defaultValue;
    }

    return expression;
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
    return new style.Stroke({
      color:
        styleParams.strokeOpacity &&
        styleParams.stroke &&
        styleParams.stroke.slice(0, 1) === '#'
          ? hexToRGB(styleParams.stroke, styleParams.strokeOpacity)
          : styleParams.stroke || 'black',
      width: styleParams.strokeWidth || 1,
      lineCap: styleParams.strokeLinecap,
      lineDash:
        styleParams.strokeDasharray && styleParams.strokeDasharray.split(' '),
      lineDashOffset: styleParams.strokeDashoffset,
      lineJoin: styleParams.strokeLinejoin,
    });
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

    return new style.Fill({
      color:
        styleParams.fillOpacity &&
        styleParams.fill &&
        styleParams.fill.slice(0, 1) === '#'
          ? hexToRGB(styleParams.fill, styleParams.fillOpacity)
          : styleParams.fill || 'black',
    });
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
    var pointSizeValue = expressionOrDefault(style$1.size, DEFAULT_MARK_SIZE);

    // If the point rotation is a dynamic expression, use 0 as default rotation and update in-place later.
    var rotationDegrees = expressionOrDefault(style$1.rotation, 0.0);

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
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getPointStyle(symbolizer, feature) {
    // According to SLD spec, when a point symbolizer has no Graphic, nothing will be rendered.
    if (!(symbolizer && symbolizer.graphic)) {
      return emptyStyle;
    }

    var olStyle = cachedPointStyle(symbolizer);
    var olImage = olStyle.getImage();

    // Apply dynamic values to the cached OL style instance before returning it.

    // --- Update dynamic size ---
    var graphic = symbolizer.graphic;
    var size = graphic.size;
    if (size && size.type === 'expression') {
      var sizeValue = Number(evaluate(size, feature)) || DEFAULT_MARK_SIZE;

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
          olImage.getFill()
        );
        olStyle.setImage(olImage);
      }
    }

    // --- Update dynamic rotation ---
    var rotation = graphic.rotation;
    if (rotation && rotation.type === 'expression') {
      var rotationDegrees = Number(evaluate(rotation, feature)) || 0.0;
      // Note: OL angles are in radians.
      var rotationRadians = (Math.PI * rotationDegrees) / 180.0;
      olImage.setRotation(rotationRadians);
    }

    return olStyle;
  }

  function splitLineString(geometry, minSegmentLength, options) {
    function calculatePointsDistance(coord1, coord2) {
      var dx = coord1[0] - coord2[0];
      var dy = coord1[1] - coord2[1];
      return Math.sqrt(dx * dx + dy * dy);
    }

    function calculateSplitPointCoords(
      startNode,
      nextNode,
      distanceBetweenNodes,
      distanceToSplitPoint
    ) {
      var d = distanceToSplitPoint / distanceBetweenNodes;
      var x = nextNode[0] + (startNode[0] - nextNode[0]) * d;
      var y = nextNode[1] + (startNode[1] - nextNode[1]) * d;
      return [x, y];
    }

    function calculateAngle(startNode, nextNode, alwaysUp) {
      var x = startNode[0] - nextNode[0];
      var y = startNode[1] - nextNode[1];
      var angle = Math.atan(x / y);
      if (!alwaysUp) {
        if (y > 0) {
          angle += Math.PI;
        } else if (x < 0) {
          angle += Math.PI * 2;
        }
        // angle = y > 0 ? angle + Math.PI : x < 0 ? angle + Math.PI * 2 : angle;
      }
      return angle;
    }

    var splitPoints = [];
    var coords = geometry.getCoordinates();

    var coordIndex = 0;
    var startPoint = coords[coordIndex];
    var nextPoint = coords[coordIndex + 1];
    var angle = calculateAngle(startPoint, nextPoint, options.alwaysUp);

    var n = Math.ceil(geometry.getLength() / minSegmentLength);
    var segmentLength = geometry.getLength() / n;
    var currentSegmentLength = options.midPoints
      ? segmentLength / 2
      : segmentLength;

    for (var i = 0; i <= n; i += 1) {
      var distanceBetweenPoints = calculatePointsDistance(
        startPoint,
        nextPoint
      );
      currentSegmentLength += distanceBetweenPoints;

      if (currentSegmentLength < segmentLength) {
        coordIndex += 1;
        if (coordIndex < coords.length - 1) {
          startPoint = coords[coordIndex];
          nextPoint = coords[coordIndex + 1];
          angle = calculateAngle(startPoint, nextPoint, options.alwaysUp);
          i -= 1;
          // continue;
        } else {
          if (!options.midPoints) {
            var splitPointCoords = nextPoint;
            if (
              !options.extent ||
              extent.containsCoordinate(options.extent, splitPointCoords)
            ) {
              splitPointCoords.push(angle);
              splitPoints.push(splitPointCoords);
            }
          }
          break;
        }
      } else {
        var distanceToSplitPoint = currentSegmentLength - segmentLength;
        var splitPointCoords$1 = calculateSplitPointCoords(
          startPoint,
          nextPoint,
          distanceBetweenPoints,
          distanceToSplitPoint
        );
        startPoint = splitPointCoords$1.slice();
        if (
          !options.extent ||
          extent.containsCoordinate(options.extent, splitPointCoords$1)
        ) {
          splitPointCoords$1.push(angle);
          splitPoints.push(splitPointCoords$1);
        }
        currentSegmentLength = 0;
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
   * @param {ol/render/canvas/Immediate} render Instance of CanvasImmediateRenderer used to paint stroke marks directly to the canvas.
   * @param {Array<Array<number>>} pixelCoords A line as array of [x,y] point coordinate arrays in pixel space.
   * @param {number} minSegmentLength Minimum segment length in pixels for distributing stroke marks along the line.
   * @param {ol/style/Style} pointStyle OpenLayers style instance used for rendering stroke marks.
   * @param {number} pixelRatio Ratio of device pixels to css pixels.
   * @returns {void}
   */
  function renderStrokeMarks(render, pixelCoords, minSegmentLength, pointStyle, pixelRatio) {
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
          minSegmentLength,
          pointStyle,
          pixelRatio
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
      minSegmentLength * pixelRatio,
      { alwaysUp: true, midPoints: false, extent: render.extent_ }
    );

    splitPoints.forEach(function (point) {
      var splitPointAngle = image.getRotation() - point[2];
      render.setImageStyle2(image, splitPointAngle);
      render.drawPoint(new geom.Point([point[0] / pixelRatio, point[1] / pixelRatio]));
    });
  }

  /**
   * Create a renderer function for renderining GraphicStroke marks
   * to be used inside an OpenLayers Style.renderer function.
   * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
   * @returns {ol/style/Style~RenderFunction} A style renderer function (pixelCoords, renderState) => void.
   */
  function getGraphicStrokeRenderer(linesymbolizer) {
    if (!(linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke)) {
      throw new Error(
        'getGraphicStrokeRenderer error: symbolizer.stroke.graphicstroke null or undefined.'
      );
    }

    var ref = linesymbolizer.stroke;
    var graphicstroke = ref.graphicstroke;
    var styling = ref.styling;
    // Use strokeDasharray to space graphics. First digit represents size of graphic, second the relative space, e.g.
    // size = 20, dash = [2 6] -> 2 ~ 20 then 6 ~ 60, total segment length should be 20 + 60 = 80
    var multiplier = 1; // default, i.e. a segment is the size of the graphic (without stroke/outline).
    if (styling && styling.strokeDasharray) {
      var dash = styling.strokeDasharray.split(' ');
      if (dash.length >= 2 && dash[0] !== 0) {
        multiplier = dash[1] / dash[0] + 1;
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

      var pointStyle = getPointStyle(graphicstroke, renderState.feature);
      var graphicSize =
        (graphicstroke.graphic && graphicstroke.graphic.size) ||
        defaultGraphicSize;
      var pointSize = Number(evaluate(graphicSize, renderState.feature));
      var minSegmentLength = multiplier * pointSize;

      renderStrokeMarks(render$1, pixelCoords, minSegmentLength, pointStyle, pixelRatio);
    };
  }

  /**
   * Create an OpenLayers style for rendering line symbolizers with a GraphicStroke.
   * @param {LineSymbolizer} linesymbolizer SLD line symbolizer object.
   * @returns {ol/style/Style} An OpenLayers style instance.
   */
  function getGraphicStrokeStyle(linesymbolizer) {
    if (!(linesymbolizer.stroke && linesymbolizer.stroke.graphicstroke)) {
      throw new Error(
        'getGraphicStrokeStyle error: linesymbolizer.stroke.graphicstroke null or undefined.'
      );
    }

    return new style.Style({
      renderer: getGraphicStrokeRenderer(linesymbolizer),
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
  function getLineStyle(symbolizer) {
    return cachedLineStyle(symbolizer);
  }

  function createPattern(graphic) {
    var ref = getCachedImage(
      graphic.externalgraphic.onlineresource
    );
    var image = ref.image;
    var width = ref.width;
    var height = ref.height;

    var imageRatio = 1;
    if (graphic.size && height !== graphic.size) {
      imageRatio = graphic.size / height;
    }
    var cnv = document.createElement('canvas');
    var ctx = cnv.getContext('2d');
    if (imageRatio === 1) {
      return ctx.createPattern(image, 'repeat');
    }
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

  function polygonStyle(symbolizer) {
    var fillImageUrl =
      symbolizer.fill &&
      symbolizer.fill.graphicfill &&
      symbolizer.fill.graphicfill.graphic &&
      symbolizer.fill.graphicfill.graphic.externalgraphic &&
      symbolizer.fill.graphicfill.graphic.externalgraphic.onlineresource;

    if (fillImageUrl) {
      // Use fallback style when graphicfill image hasn't been loaded yet.
      switch (getImageLoadingState(fillImageUrl)) {
        case IMAGE_LOADED:
          return new style.Style({
            fill: new style.Fill({
              color: createPattern(symbolizer.fill.graphicfill.graphic),
            }),
          });
        case IMAGE_LOADING:
          return imageLoadingPolygonStyle;
        case IMAGE_ERROR:
          return imageErrorPolygonStyle;
        default:
          // Load state of an image should be known at this time, but return 'loading' style as fallback.
          return imageLoadingPolygonStyle;
      }
    }

    var polygonFill = getSimpleFill(symbolizer.fill);

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
  function getPolygonStyle(symbolizer) {
    return cachedPolygonStyle(symbolizer);
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
    var labelText = expressionOrDefault(textsymbolizer.label, '');

    var fill = textsymbolizer.fill ? textsymbolizer.fill.styling : {};
    var halo =
      textsymbolizer.halo && textsymbolizer.halo.fill
        ? textsymbolizer.halo.fill.styling
        : {};
    var haloRadius =
      textsymbolizer.halo && textsymbolizer.halo.radius
        ? parseFloat(textsymbolizer.halo.radius)
        : 1;
    var ref =
      textsymbolizer.font && textsymbolizer.font.styling
        ? textsymbolizer.font.styling
        : {};
    var fontFamily = ref.fontFamily; if ( fontFamily === void 0 ) fontFamily = 'sans-serif';
    var fontSize = ref.fontSize; if ( fontSize === void 0 ) fontSize = 10;
    var fontStyle = ref.fontStyle; if ( fontStyle === void 0 ) fontStyle = '';
    var fontWeight = ref.fontWeight; if ( fontWeight === void 0 ) fontWeight = '';

    var pointplacement =
      textsymbolizer &&
      textsymbolizer.labelplacement &&
      textsymbolizer.labelplacement.pointplacement
        ? textsymbolizer.labelplacement.pointplacement
        : {};

    // If rotation is dynamic, default to 0. Rotation will be set at runtime.
    var labelRotationDegrees = expressionOrDefault(
      pointplacement.rotation,
      0.0
    );

    var displacement =
      pointplacement && pointplacement.displacement
        ? pointplacement.displacement
        : {};
    var offsetX = displacement.displacementx ? displacement.displacementx : 0;
    var offsetY = displacement.displacementy ? displacement.displacementy : 0;

    // Assemble text style options.
    var textStyleOptions = {
      text: labelText,
      font: (fontStyle + " " + fontWeight + " " + fontSize + "px " + fontFamily),
      offsetX: Number(offsetX),
      offsetY: Number(offsetY),
      rotation: (Math.PI * labelRotationDegrees) / 180.0,
      textAlign: 'center',
      textBaseline: 'middle',
      fill: new style.Fill({
        color:
          fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
            ? hexToRGB(fill.fill, fill.fillOpacity)
            : fill.fill,
      }),
    };

    // Convert SLD halo to text symbol stroke.
    if (textsymbolizer.halo) {
      textStyleOptions.stroke = new style.Stroke({
        color:
          halo.fillOpacity && halo.fill && halo.fill.slice(0, 1) === '#'
            ? hexToRGB(halo.fill, halo.fillOpacity)
            : halo.fill,
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
   * @returns {ol/Style} OpenLayers style instance.
   */
  function getTextStyle(symbolizer, feature) {
    var olStyle = cachedTextStyle(symbolizer);
    var olText = olStyle.getText();
    if (!olText) {
      return olStyle;
    }

    // Read text from feature and set it on the text style instance.
    var label = symbolizer.label;
    var labelplacement = symbolizer.labelplacement;

    // Set text only if the label expression is dynamic.
    if (label && label.type === 'expression') {
      var labelText = evaluate(label, feature);
      // Important! OpenLayers expects the text property to always be a string.
      olText.setText(labelText.toString());
    }

    // Set rotation if expression is dynamic.
    if (labelplacement) {
      var pointPlacementRotation =
        (labelplacement.pointplacement &&
          labelplacement.pointplacement.rotation) ||
        0.0;
      if (pointPlacementRotation.type === 'expression') {
        var labelRotationDegrees = evaluate(pointPlacementRotation, feature);
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

    return olStyle;
  }

  var defaultStyles = [defaultPointStyle];

  /**
   * @private
   * Convert symbolizers together with the feature to OL style objects and append them to the styles array.
   * @example appendStyle(styles, point[j], feature, getPointStyle);
   * @param {Array<ol/style>} styles Array of OL styles.
   * @param {object|Array<object>} symbolizers Feature symbolizer object, or array of feature symbolizers.
   * @param {ol/feature} feature OpenLayers feature.
   * @param {Function} styleFunction Function for getting the OL style object. Signature (symbolizer, feature) => OL style.
   */
  function appendStyle(styles, symbolizers, feature, styleFunction) {
    if (Array.isArray(symbolizers)) {
      for (var k = 0; k < symbolizers.length; k += 1) {
        styles.push(styleFunction(symbolizers[k], feature));
      }
    } else {
      styles.push(styleFunction(symbolizers, feature));
    }
  }

  /**
   * Create openlayers style
   * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
   * @param {GeometryStyles} GeometryStyles rulesconverter
   * @param {object|Feature} feature {@link http://geojson.org|geojson}
   *  or {@link https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html|ol/Feature} Changed in 0.0.04 & 0.0.5!
   * @return ol.style.Style or array of it
   */
  function OlStyler(GeometryStyles, feature) {
    var polygon = GeometryStyles.polygon;
    var line = GeometryStyles.line;
    var point = GeometryStyles.point;
    var text = GeometryStyles.text;

    var geometry = feature.getGeometry
      ? feature.getGeometry()
      : feature.geometry;
    var geometryType = geometry.getType ? geometry.getType() : geometry.type;

    var styles = [];
    switch (geometryType) {
      case 'Point':
      case 'MultiPoint':
        for (var j = 0; j < point.length; j += 1) {
          appendStyle(styles, point[j], feature, getPointStyle);
        }
        for (var j$1 = 0; j$1 < text.length; j$1 += 1) {
          styles.push(getTextStyle(text[j$1], feature));
        }
        break;

      case 'LineString':
      case 'MultiLineString':
        for (var j$2 = 0; j$2 < line.length; j$2 += 1) {
          appendStyle(styles, line[j$2], feature, getLineStyle);
        }
        for (var j$3 = 0; j$3 < text.length; j$3 += 1) {
          styles.push(getTextStyle(text[j$3], feature));
        }
        break;

      case 'Polygon':
      case 'MultiPolygon':
        for (var i = 0; i < polygon.length; i += 1) {
          appendStyle(styles, polygon[i], feature, getPolygonStyle);
        }
        for (var j$4 = 0; j$4 < text.length; j$4 += 1) {
          styles.push(getTextStyle(text[j$4], feature));
        }
        break;

      default:
        styles = defaultStyles;
    }

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
   * @returns {Function} A function that can be set as style function on an OpenLayers vector style layer.
   * @example
   * myOlVectorLayer.setStyle(SLDReader.createOlStyleFunction(featureTypeStyle, {
   *   imageLoadedCallback: () => { myOlVectorLayer.changed(); }
   * }));
   */
  function createOlStyleFunction(featureTypeStyle, options) {
    if ( options === void 0 ) options = {};

    var imageLoadedCallback = options.imageLoadedCallback || (function () {});

    return function (feature, mapResolution) {
      // Determine resolution in meters/pixel.
      var resolution =
        typeof options.convertResolution === 'function'
          ? options.convertResolution(mapResolution)
          : mapResolution;

      // Determine applicable style rules for the feature, taking feature properties and current resolution into account.
      var rules = getRules(featureTypeStyle, feature, resolution, {
        getProperty: getOlFeatureProperty,
        getFeatureId: getOlFeatureId,
      });

      // Start loading images for external graphic symbolizers and when loaded:
      // * update symbolizers to use the cached image.
      // * call imageLoadedCallback with the image url.
      processExternalGraphicSymbolizers(
        rules,
        featureTypeStyle,
        imageLoadedCallback
      );

      // Convert style rules to style rule lookup categorized by geometry type.
      var geometryStyles = getGeometryStyles(rules);

      // Determine style rule array.
      var olStyles = OlStyler(geometryStyles, feature);

      return olStyles;
    };
  }

  exports.OlStyler = OlStyler;
  exports.Reader = Reader;
  exports.createOlStyleFunction = createOlStyleFunction;
  exports.getByPath = getByPath;
  exports.getGeometryStyles = getGeometryStyles;
  exports.getLayer = getLayer;
  exports.getLayerNames = getLayerNames;
  exports.getRuleSymbolizers = getRuleSymbolizers;
  exports.getRules = getRules;
  exports.getStyle = getStyle;
  exports.getStyleNames = getStyleNames;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
