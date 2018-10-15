(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ol/style/style'), require('ol/style/fill'), require('ol/style/stroke'), require('ol/style/circle'), require('ol/style/icon'), require('ol/style/regularshape')) :
  typeof define === 'function' && define.amd ? define(['exports', 'ol/style/style', 'ol/style/fill', 'ol/style/stroke', 'ol/style/circle', 'ol/style/icon', 'ol/style/regularshape'], factory) :
  (factory((global.SLDReader = {}),global.ol.style.Style,global.ol.style.Fill,global.ol.style.Stroke,global.ol.style.Circle,global.ol.style.Icon,global.ol.style.RegularShape));
}(this, (function (exports,Style,Fill,Stroke,Circle,Icon,RegularShape) { 'use strict';

  Style = Style && Style.hasOwnProperty('default') ? Style['default'] : Style;
  Fill = Fill && Fill.hasOwnProperty('default') ? Fill['default'] : Fill;
  Stroke = Stroke && Stroke.hasOwnProperty('default') ? Stroke['default'] : Stroke;
  Circle = Circle && Circle.hasOwnProperty('default') ? Circle['default'] : Circle;
  Icon = Icon && Icon.hasOwnProperty('default') ? Icon['default'] : Icon;
  RegularShape = RegularShape && RegularShape.hasOwnProperty('default') ? RegularShape['default'] : RegularShape;

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
    var propname = prop === 'SvgParameter' ? 'svg' : 'css';
    obj[propname] = obj[propname] || {};
    var name = element
      .getAttribute('name')
      .toLowerCase()
      .replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });
    obj[propname][name] = element.textContent.trim();
  }

  /**
   * Each propname is a tag in the sld that should be converted to plain object
   * @private
   * @type {Object}
   */
  var parsers = {
    NamedLayer: function (element, obj) {
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
    Name: addPropWithTextContent,
    MaxScaleDenominator: addPropWithTextContent,
    MinScaleDenominator: addPropWithTextContent,
    PolygonSymbolizer: addProp,
    LineSymbolizer: addProp,
    PointSymbolizer: addProp,
    TextSymbolizer: addProp,
    Fill: addProp,
    Stroke: addProp,
    Graphic: addProp,
    ExternalGraphic: addProp,
    Mark: addProp,
    Size: addPropWithTextContent,
    WellKnownName: addPropWithTextContent,
    OnlineResource: function (element, obj) {
      obj.onlineresource = element.getAttribute('xlink:href');
    },
    CssParameter: parameters,
    SvgParameter: parameters,
  };

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

  /**
   * @private
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

  function polygonStyle(style) {
    var stroke = {};
    if (style.stroke) {
      stroke = style.stroke.css || style.stroke.svg;
    }
    var fill = {};
    if (style.fill) {
      fill = style.fill.css || style.fill.svg;
    }
    return new Style({
      fill:
        fill &&
        new Fill({
          color:
            fill.fillOpacity && fill.fill && fill.fill.slice(0, 1) === '#'
              ? hexToRGB(fill.fill, fill.fillOpacity)
              : fill.fill,
        }),
      stroke:
        stroke &&
        new Stroke({
          color: stroke.stroke || '#3399CC',
          width: stroke.strokeWidth || 1.25,
          lineCap: stroke.strokeLinecap && stroke.strokeLinecap,
          lineDash: stroke.strokeDasharray && stroke.strokeDasharray.split(' '),
          lineDashOffset: stroke.strokeDashoffset && stroke.strokeDashoffset,
          lineJoin: stroke.strokeLinejoin && stroke.strokeLinejoin,
        }),
    });
  }

  /**
   * @private
   * @param  {LineSymbolizer} linesymbolizer [description]
   * @return {object} openlayers style
   */
  function lineStyle(linesymbolizer) {
    var style = {};
    if (linesymbolizer.stroke) {
      style = linesymbolizer.stroke.css || linesymbolizer.stroke.svg;
    }
    return new Style({
      stroke: new Stroke({
        color: style.stroke || '#3399CC',
        width: style.strokeWidth || 1.25,
        lineCap: style.strokeLinecap && style.strokeLinecap,
        lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
        lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
        lineJoin: style.strokeLinejoin && style.strokeLinejoin,
      }),
    });
  }

  function pointStyle(pointsymbolizer) {
    var style = pointsymbolizer.graphic;
    if (style.externalgraphic && style.externalgraphic.onlineresource) {
      return new Style({
        image: new Icon({ src: style.externalgraphic.onlineresource }),
      });
    }
    var fill = new Fill({
      color: 'black',
    });
    var stroke = new Stroke({
      color: 'black',
      width: 2,
    });
    if (style.mark && style.mark.wellknownname === 'cross') {
      return new Style({
        image: new RegularShape({
          fill: fill,
          stroke: stroke,
          points: 4,
          radius: style.size || 10,
          radius2: 0,
          angle: 0,
        }),
      });
    }
    if (style.mark && style.mark.wellknownname === 'x') {
      return new Style({
        image: new RegularShape({
          fill: fill,
          stroke: stroke,
          points: 4,
          radius: style.size || 10,
          radius2: 0,
          angle: 45,
        }),
      });
    }
    if (style.mark && style.mark.wellknownname === 'star') {
      return new Style({
        image: new RegularShape({
          fill: fill,
          stroke: stroke,
          points: 5,
          radius: style.size || 10,
          radius2: 4,
          angle: 45,
        }),
      });
    }
    return new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: 'blue',
        }),
      }),
    });
  }

  /**
   * Create openlayers style
   * @example OlStyler(getGeometryStyles(rules), geojson.geometry.type);
   * @param {GeometryStyles} GeometryStyles rulesconverter
   * @param {string} type geometry type, @see {@link http://geojson.org|geojson}
   * @return ol.style.Style or array of it
   */
  function OlStyler(GeometryStyles, type) {
    if ( type === void 0 ) type = 'Polygon';

    var polygon = GeometryStyles.polygon;
    var line = GeometryStyles.line;
    var point = GeometryStyles.point;
    var styles = [];
    switch (type) {
      case 'Polygon':
      case 'MultiPolygon':
        for (var i = 0; i < polygon.length; i += 1) {
          styles.push(polygonStyle(polygon[i]));
        }
        break;
      case 'LineString':
      case 'MultiLineString':
        for (var j = 0; j < line.length; j += 1) {
          styles.push(lineStyle(line[j]));
        }
        break;
      case 'Point':
      case 'MultiPoint':
        for (var j$1 = 0; j$1 < point.length; j$1 += 1) {
          styles.push(pointStyle(point[j$1]));
        }
        break;
      default:
        styles = [
          new Style({
            image: new Circle({
              radius: 2,
              fill: new Fill({
                color: 'blue',
              }),
            }),
          }) ];
    }
    return styles;
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

  function propertyIsLessThan(comparison, feature) {
    return (
      feature.properties[comparison.propertyname] &&
      Number(feature.properties[comparison.propertyname]) < Number(comparison.literal)
    );
  }

  function propertyIsBetween(comparison, feature) {
    // Todo: support string comparison as well
    var lowerBoundary = Number(comparison.lowerboundary);
    var upperBoundary = Number(comparison.upperboundary);
    var value = Number(feature.properties[comparison.propertyname]);
    return value >= lowerBoundary && value <= upperBoundary;
  }

  function propertyIsEqualTo(comparison, feature) {
    if (!(comparison.propertyname in feature.properties)) {
      return false;
    }
    /* eslint-disable-next-line eqeqeq */
    return feature.properties[comparison.propertyname] == comparison.literal;
  }

  /**
   * A very basic implementation of a PropertyIsLike by converting match pattern to a regex.
   * @private
   * @param {object} comparison filter object for operator 'propertyislike'
   * @param {object} feature the feature to test
   */
  function propertyIsLike(comparison, feature) {
    var pattern = comparison.literal;
    var value = feature.properties && feature.properties[comparison.propertyname];

    if (!value) {
      return false;
    }

    // Create regex string from match pattern.
    var wildcard = comparison.wildcard;
    var singlechar = comparison.singlechar;
    var escapechar = comparison.escapechar;

    // Replace wildcard by '.*'
    var patternAsRegex = pattern.replace(new RegExp(("[" + wildcard + "]"), 'g'), '.*');

    // Replace single char match by '.'
    patternAsRegex = patternAsRegex.replace(new RegExp(("[" + singlechar + "]"), 'g'), '.');

    // Replace escape char by '\' if escape char is not already '\'.
    if (escapechar !== '\\') {
      patternAsRegex = patternAsRegex.replace(new RegExp(("[" + escapechar + "]"), 'g'), '\\');
    }

    // Bookend the regular expression.
    patternAsRegex = "^" + patternAsRegex + "$";

    var rex = new RegExp(patternAsRegex);
    return rex.test(value);
  }

  /**
   * [doComparison description]
   * @private
   * @param  {Comparison} comparison [description]
   * @param  {object} feature    geojson
   * @return {bool}  does feature fullfill comparison
   */
  function doComparison(comparison, feature) {
    switch (comparison.operator) {
      case 'propertyislessthan':
        return propertyIsLessThan(comparison, feature);
      case 'propertyisequalto':
        return propertyIsEqualTo(comparison, feature);
      case 'propertyislessthanorequalto':
        return propertyIsEqualTo(comparison, feature) || propertyIsLessThan(comparison, feature);
      case 'propertyisnotequalto':
        return !propertyIsEqualTo(comparison, feature);
      case 'propertyisgreaterthan':
        return !propertyIsLessThan(comparison, feature) && !propertyIsEqualTo(comparison, feature);
      case 'propertyisgreaterthanorequalto':
        return !propertyIsLessThan(comparison, feature) || propertyIsEqualTo(comparison, feature);
      case 'propertyisbetween':
        return propertyIsBetween(comparison, feature);
      case 'propertyislike':
        return propertyIsLike(comparison, feature);
      default:
        throw new Error(("Unkown comparison operator " + (comparison.operator)));
    }
  }

  function doFIDFilter(fids, feature) {
    for (var i = 0; i < fids.length; i += 1) {
      if (fids[i] === feature.id) {
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
   * @return {boolean}
   */
  function filterSelector(filter, feature) {
    var type = filter.type;
    switch (type) {
      case 'featureid':
        return doFIDFilter(filter.fids, feature);

      case 'comparison':
        return doComparison(filter, feature);

      case 'and': {
        if (!filter.predicates) {
          throw new Error('And filter must have predicates array.');
        }

        // And without predicates should return false.
        if (filter.predicates.length === 0) {
          return false;
        }

        return filter.predicates.every(function (predicate) { return filterSelector(predicate, feature); });
      }

      case 'or': {
        if (!filter.predicates) {
          throw new Error('Or filter must have predicates array.');
        }

        return filter.predicates.some(function (predicate) { return filterSelector(predicate, feature); });
      }

      case 'not': {
        if (!filter.predicate) {
          throw new Error('Not filter must have predicate.');
        }

        return !filterSelector(filter.predicate, feature);
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
    if (rule.maxscaledenominator !== undefined && rule.minscaledenominator !== undefined) {
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
   * getlayer with name
   * @param  {StyledLayerDescriptor} sld       [description]
   * @param  {string} layername [description]
   * @return {Layer}           [description]
   */
  function getLayer(sld, layername) {
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
   * @param {string} name of style
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
   * getRules(style.featuretypestyles['0'], geojson,resolution);
   * @param  {FeatureTypeStyle} featureTypeStyle
   * @param  {object} feature geojson
   * @param  {number} resolution m/px
   * @return {Rule[]}
   */
  function getRules(featureTypeStyle, feature, resolution) {
    var result = [];
    for (var j = 0; j < featureTypeStyle.rules.length; j += 1) {
      var rule = featureTypeStyle.rules[j];
      if (rule.filter && scaleSelector(rule, resolution) && filterSelector(rule.filter, feature)) {
        result.push(rule);
      } else if (rule.elsefilter && result.length === 0) {
        result.push(rule);
      } else if (!rule.elsefilter && !rule.filter) {
        result.push(rule);
      }
    }
    return result;
  }

  exports.Reader = Reader;
  exports.getGeometryStyles = getGeometryStyles;
  exports.OlStyler = OlStyler;
  exports.getLayerNames = getLayerNames;
  exports.getLayer = getLayer;
  exports.getStyleNames = getStyleNames;
  exports.getStyle = getStyle;
  exports.getRules = getRules;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
