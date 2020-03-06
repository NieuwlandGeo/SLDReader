(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ol/style')) :
  typeof define === 'function' && define.amd ? define(['exports', 'ol/style'], factory) :
  (global = global || self, factory(global.SLDReader = {}, global.ol.style));
}(this, (function (exports, style) { 'use strict';

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
   * @param  {[type]} element          [description]
   * @param  {[type]} obj              [description]
   * @param  {String} [propname='css'] [description]
   * @return {[type]}                  [description]
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
    Filter: addProp,
    ElseFilter: function (element, obj) {
      obj.elsefilter = true;
    },
    Or: function (element, obj) {
      obj.type = 'or';
      obj.predicates = [];
      readNodeArray(element, obj, 'predicates');
    },
    And: function (element, obj) {
      obj.type = 'and';
      obj.predicates = [];
      readNodeArray(element, obj, 'predicates');
    },
    Not: function (element, obj) {
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
    PropertyIsNull: addFilterComparison,
    PropertyIsLike: function (element, obj, prop) {
      addFilterComparison(element, obj, prop);
      obj.wildcard = element.getAttribute('wildCard');
      obj.singlechar = element.getAttribute('singleChar');
      obj.escapechar = element.getAttribute('escapeChar');
    },
    PropertyName: addPropWithTextContent,
    Literal: addPropWithTextContent,
    LowerBoundary: function (element, obj, prop) { return addPropWithTextContent(element, obj, prop, true); },
    UpperBoundary: function (element, obj, prop) { return addPropWithTextContent(element, obj, prop, true); },
    FeatureId: function (element, obj) {
      obj.type = 'featureid';
      obj.fids = obj.fids || [];
      obj.fids.push(element.getAttribute('fid'));
    },
  };

  var SymbParsers = {
    PolygonSymbolizer: addPropOrArray,
    LineSymbolizer: addPropOrArray,
    PointSymbolizer: addPropOrArray,
    TextSymbolizer: addPropOrArray,
    Fill: addProp,
    Stroke: addProp,
    GraphicFill: addProp,
    Graphic: addProp,
    ExternalGraphic: addProp,
    Mark: addProp,
    Label: addFilterExpressionProp,
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
   * Parse all children of an element as an array in obj[prop]
   * @private
   * @param {Element} node parent xml element
   * @param {object} obj the object to modify
   * @param {string} prop the name of the array prop to fill with parsed child nodes
   * @return {void}
   */
  function readNodeArray(node, obj, prop) {
    var property = prop.toLowerCase();
    obj[property] = [];
    for (var n = node.firstElementChild; n; n = n.nextElementSibling) {
      if (parsers[n.localName]) {
        var childObj = {};
        parsers[n.localName](n, childObj, n.localName);
        obj[property].push(childObj);
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

  var IMAGE_LOADING = 'IMAGE_LOADING';
  var IMAGE_LOADED = 'IMAGE_LOADED';
  var IMAGE_ERROR = 'IMAGE_ERROR';

  var DEFAULT_POINT_SIZE = 20; // pixels

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

  /* eslint-disable no-underscore-dangle */

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

  /* eslint-disable no-continue */

  /* eslint-disable no-underscore-dangle */
  // Global image cache. A map of image Url -> {
  //   url: image url,
  //   image: an Image instance containing image data,
  //   width: image width in pixels,
  //   height: image height in pixels
  // }
  var imageCache = {};

  function setCachedImage(url, imageData) {
    imageCache[url] = imageData;
  }

  function getCachedImage(url) {
    return imageCache[url];
  }

  function getCachedImageUrls() {
    return Object.keys(imageCache);
  }

  /**
   * @private
   * Updates the __loadingState metadata for the symbolizers with the new imageLoadState, if
   * the external graphic is matching the image url.
   * This action replaces symbolizers with new symbolizers if they get a new __loadingState.
   * @param {object} featureTypeStyle A feature type style object.
   * @param {string} imageUrl The image url.
   * @param {string} imageLoadState One of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'.
   */
  function updateExternalGraphicRule(rule, imageUrl, imageLoadState) {
    // for pointsymbolizer
    if (rule.pointsymbolizer && rule.pointsymbolizer.graphic) {
      var ref = rule.pointsymbolizer;
      var graphic = ref.graphic;
      var externalgraphic = graphic.externalgraphic;
      if (
        externalgraphic &&
        externalgraphic.onlineresource === imageUrl &&
        rule.pointsymbolizer.__loadingState !== imageLoadState
      ) {
        rule.pointsymbolizer = Object.assign({}, rule.pointsymbolizer,
          {__loadingState: imageLoadState});
      }
    }
    // for polygonsymbolizer
    if (
      rule.polygonsymbolizer &&
      rule.polygonsymbolizer.fill &&
      rule.polygonsymbolizer.fill.graphicfill &&
      rule.polygonsymbolizer.fill.graphicfill.graphic
    ) {
      var ref$1 = rule.polygonsymbolizer.fill.graphicfill;
      var graphic$1 = ref$1.graphic;
      var ref$2 = graphic$1;
      var externalgraphic$1 = ref$2.externalgraphic;
      if (
        externalgraphic$1 &&
        externalgraphic$1.onlineresource === imageUrl &&
        rule.polygonsymbolizer.__loadingState !== imageLoadState
      ) {
        rule.polygonsymbolizer = Object.assign({}, rule.polygonsymbolizer,
          {__loadingState: imageLoadState});
      }
    }
  }

  /**
   * @private
   * Go through all rules with an external graphic matching the image url
   * and update the __loadingState metadata for the symbolizers with the new imageLoadState.
   * This action replaces symbolizers with new symbolizers if they get a new __loadingState.
   * @param {object} featureTypeStyle A feature type style object.
   * @param {string} imageUrl The image url.
   * @param {string} imageLoadState One of 'IMAGE_LOADING', 'IMAGE_LOADED', 'IMAGE_ERROR'.
   */
  function updateExternalGraphicRules(
    featureTypeStyle,
    imageUrl,
    imageLoadState
  ) {
    // Go through all rules with an external graphic matching the image url
    // and update the __loadingState metadata for the symbolizers with the new imageLoadState.
    if (!featureTypeStyle.rules) {
      return;
    }

    featureTypeStyle.rules.forEach(function (rule) {
      updateExternalGraphicRule(rule, imageUrl, imageLoadState);
    });
  }

  /**
   * @private
   * Load and cache an image that's used as externalGraphic inside one or more symbolizers inside a feature type style object.
   * When the image is loaded, it's put into the cache, the __loadingStaet inside the featureTypeStyle symbolizers are updated,
   * and the imageLoadedCallback is called with the loaded image url.
   * @param {url} imageUrl Image url.
   * @param {string} imageLoadState One of IMAGE_LOADING, IMAGE_LOADED or IMAGE_ERROR.
   * @param {object} featureTypeStyle Feature type style object.
   * @param {Function} imageLoadedCallback Will be called with the image url when image
   * has loaded. Will be called with undefined if the loading the image resulted in an error.
   */
  function loadExternalGraphic(
    imageUrl,
    imageLoadState,
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
      updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_LOADED);
      imageLoadState[imageUrl] = IMAGE_LOADED;
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback(imageUrl);
      }
    };

    image.onerror = function () {
      updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_ERROR);
      imageLoadState[imageUrl] = IMAGE_ERROR;
      if (typeof imageLoadedCallback === 'function') {
        imageLoadedCallback();
      }
    };

    image.src = imageUrl;
    updateExternalGraphicRules(featureTypeStyle, imageUrl, IMAGE_LOADING);
  }

  /**
   * @private
   * Start loading images used in rules that have a pointsymbolizer with an externalgraphic.
   * On image load start or load end, update __loadingState metadata of the symbolizers for that image url.
   * @param {Array<object>} rules Array of SLD rule objects that pass the filter for a single feature.
   * @param {FeatureTypeStyle} featureTypeStyle The feature type style object for a layer.
   * @param {object} imageLoadState Cache of image load state: imageUrl -> IMAGE_LOADING | IMAGE_LOADED | IMAGE_ERROR.
   * @param {Function} imageLoadedCallback Function to call when an image has loaded.
   */
  function processExternalGraphicSymbolizers(
    rules,
    featureTypeStyle,
    imageLoadState,
    imageLoadedCallback
  ) {
    // If a feature has an external graphic point or polygon symbolizer, the external image may
    // * have never been requested before.
    //   --> set __loadingState IMAGE_LOADING on the symbolizer and start loading the image.
    //       When loading is complete, replace all symbolizers using that image inside the featureTypeStyle
    //       with new symbolizers with a new __loadingState. Also call options.imageLoadCallback if one has been provided.
    // * be loading.
    //   --> set __loadingState IMAGE_LOADING on the symbolizer if not already so.
    // * be loaded and therefore present in the image cache.
    //   --> set __loadingState IMAGE_LOADED on the symbolizer if not already so.
    // * be in error. Error is a kind of loaded, but with an error icon style.
    //   --> set __loadingState IMAGE_ERROR on the symbolizer if not already so.
    for (var k = 0; k < rules.length; k += 1) {
      var rule = rules[k];

      var symbolizer = (void 0);
      var exgraphic = (void 0);

      if (
        rule.pointsymbolizer &&
        rule.pointsymbolizer.graphic &&
        rule.pointsymbolizer.graphic.externalgraphic
      ) {
        symbolizer = rule.pointsymbolizer;
        exgraphic = rule.pointsymbolizer.graphic.externalgraphic;
      } else if (
        rule.polygonsymbolizer &&
        rule.polygonsymbolizer.fill &&
        rule.polygonsymbolizer.fill.graphicfill &&
        rule.polygonsymbolizer.fill.graphicfill.graphic &&
        rule.polygonsymbolizer.fill.graphicfill.graphic.externalgraphic
      ) {
        symbolizer = rule.polygonsymbolizer;
        exgraphic =
          rule.polygonsymbolizer.fill.graphicfill.graphic.externalgraphic;
      } else {
        continue;
      }

      var imageUrl = exgraphic.onlineresource;
      if (!(imageUrl in imageLoadState)) {
        // Start loading the image and set image load state on the symbolizer.
        imageLoadState[imageUrl] = IMAGE_LOADING;
        loadExternalGraphic(
          imageUrl,
          imageLoadState,
          featureTypeStyle,
          imageLoadedCallback
        );
      } else if (
        // Change image load state on the symbolizer if it has changed in the meantime.
        symbolizer.__loadingState !== imageLoadState[imageUrl]
      ) {
        updateExternalGraphicRule(rule, imageUrl, imageLoadState[imageUrl]);
      }
    }
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

      if (!olStyle) {
        olStyle = styleFunction(symbolizer);
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

  /* eslint-disable no-underscore-dangle */

  /**
   * @private
   * Get OL Fill instance for SLD mark object.
   * @param {object} mark SLD mark object.
   */
  function getMarkFill(mark) {
    var fill = mark.fill;
    var fillColor = (fill && fill.styling && fill.styling.fill) || 'blue';
    return new style.Fill({
      color: fillColor,
    });
  }

  /**
   * @private
   * Get OL Stroke instance for SLD mark object.
   * @param {object} mark SLD mark object.
   */
  function getMarkStroke(mark) {
    var stroke = mark.stroke;

    var olStroke;
    if (stroke && stroke.styling && !(Number(stroke.styling.strokeWidth) === 0)) {
      var ref = stroke.styling;
      var cssStroke = ref.stroke;
      var cssStrokeWidth = ref.strokeWidth;
      olStroke = new style.Stroke({
        color: cssStroke || 'black',
        width: cssStrokeWidth || 2,
      });
    }

    return olStroke;
  }

  /**
   * @private
   * @param  {PointSymbolizer} pointsymbolizer [description]
   * @return {object} openlayers style
   */
  function pointStyle(pointsymbolizer) {
    var style$1 = pointsymbolizer.graphic;

    // If the point size is a dynamic expression, use the default point size and update in-place later.
    var pointSizeValue = expressionOrDefault(style$1.size, DEFAULT_POINT_SIZE);

    // If the point rotation is a dynamic expression, use 0 as default rotation and update in-place later.
    var rotationDegrees = expressionOrDefault(style$1.rotation, 0.0);

    if (style$1.externalgraphic && style$1.externalgraphic.onlineresource) {
      // Check symbolizer metadata to see if the image has already been loaded.
      switch (pointsymbolizer.__loadingState) {
        case IMAGE_LOADED:
          return createCachedImageStyle(
            style$1.externalgraphic.onlineresource,
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
      var olFill = getMarkFill(style$1.mark);
      var olStroke = getMarkStroke(style$1.mark);

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

    return new style.Style({
      image: new style.Circle({
        radius: 4,
        fill: new style.Fill({
          color: 'blue',
        }),
      }),
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
    var olStyle = cachedPointStyle(symbolizer);
    var olImage = olStyle.getImage();

    // Apply dynamic values to the cached OL style instance before returning it.

    // --- Update dynamic size ---
    var graphic = symbolizer.graphic;
    var size = graphic.size;
    if (size && size.type === 'expression') {
      var sizeValue = Number(evaluate(size, feature)) || DEFAULT_POINT_SIZE;

      if (graphic.externalgraphic && graphic.externalgraphic.onlineresource) {
        var height = olImage.getSize()[1];
        var scale = sizeValue / height || 1;
        olImage.setScale(scale);
      }

      if (graphic.mark) {
        // Note: only ol/style/Circle has a setter for radius. RegularShape does not.
        if (graphic.mark.wellknownname === 'circle') {
          olImage.setRadius(sizeValue * 0.5);
        } else {
          // So, in the case of any other RegularShape, create a new shape instance.
          olStyle.setImage(
            getWellKnownSymbol(
              graphic.mark.wellknownname,
              sizeValue,
              // Note: re-use stroke and fill instances for a (small?) performance gain.
              olImage.getStroke(),
              olImage.getFill()
            )
          );
        }
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

  /**
   * @private
   * @param  {LineSymbolizer} linesymbolizer [description]
   * @return {object} openlayers style
   */
  function lineStyle(linesymbolizer) {
    var style$1 = {};
    if (linesymbolizer.stroke) {
      style$1 = linesymbolizer.stroke.styling;
    }
    return new style.Style({
      stroke: new style.Stroke({
        color:
          style$1.strokeOpacity && style$1.stroke && style$1.stroke.slice(0, 1) === '#'
            ? hexToRGB(style$1.stroke, style$1.strokeOpacity)
            : style$1.stroke || '#3399CC',
        width: style$1.strokeWidth || 1.25,
        lineCap: style$1.strokeLinecap && style$1.strokeLinecap,
        lineDash: style$1.strokeDasharray && style$1.strokeDasharray.split(' '),
        lineDashOffset: style$1.strokeDashoffset && style$1.strokeDashoffset,
        lineJoin: style$1.strokeLinejoin && style$1.strokeLinejoin,
      }),
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

  /* eslint-disable no-underscore-dangle */

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

  function polygonStyle(style$1) {
    if (
      style$1.fill &&
      style$1.fill.graphicfill &&
      style$1.fill.graphicfill.graphic &&
      style$1.fill.graphicfill.graphic.externalgraphic &&
      style$1.fill.graphicfill.graphic.externalgraphic.onlineresource
    ) {
      // Check symbolizer metadata to see if the image has already been loaded.
      switch (style$1.__loadingState) {
        case IMAGE_LOADED:
          return new style.Style({
            fill: new style.Fill({
              color: createPattern(style$1.fill.graphicfill.graphic),
            }),
          });
        case IMAGE_LOADING:
          return imageLoadingPolygonStyle;
        case IMAGE_ERROR:
          return imageErrorPolygonStyle;
        default:
          // A symbolizer should have loading state metadata, but return IMAGE_LOADING just in case.
          return imageLoadingPolygonStyle;
      }
    }

    var stroke = style$1.stroke && style$1.stroke.styling;
    var fill = style$1.fill && style$1.fill.styling;
    return new style.Style({
      fill:
        fill &&
        new style.Fill({
          color:
            fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
              ? hexToRGB(fill.fill, fill.fillOpacity)
              : fill.fill,
        }),
      stroke:
        stroke &&
        new style.Stroke({
          color:
            stroke.strokeOpacity &&
            stroke.stroke &&
            stroke.stroke.slice(0, 1) === '#'
              ? hexToRGB(stroke.stroke, stroke.strokeOpacity)
              : stroke.stroke || '#3399CC',
          width: stroke.strokeWidth || 1.25,
          lineCap: stroke.strokeLinecap && stroke.strokeLinecap,
          lineDash: stroke.strokeDasharray && stroke.strokeDasharray.split(' '),
          lineDashOffset: stroke.strokeDashoffset && stroke.strokeDashoffset,
          lineJoin: stroke.strokeLinejoin && stroke.strokeLinejoin,
        }),
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
      olText.setText(labelText);
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

    // Keep image loading state separate from image cache.
    // This makes it easier to detect whether a requested image is already loading.
    var imageLoadState = {};

    // Important: if image cache already has loaded images, mark these as loaded in imageLoadState!
    getCachedImageUrls().forEach(function (imageUrl) {
      imageLoadState[imageUrl] = IMAGE_LOADED;
    });

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
        imageLoadState,
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
  exports.getGeometryStyles = getGeometryStyles;
  exports.getLayer = getLayer;
  exports.getLayerNames = getLayerNames;
  exports.getRules = getRules;
  exports.getStyle = getStyle;
  exports.getStyleNames = getStyleNames;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
