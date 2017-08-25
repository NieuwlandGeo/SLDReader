(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SLDReader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _openlayers = (typeof window !== "undefined" ? window['ol'] : typeof global !== "undefined" ? global['ol'] : null);

var _openlayers2 = _interopRequireDefault(_openlayers);

var _Style2 = require('./Style');

var _Style3 = _interopRequireDefault(_Style2);

var _rulesConverter = require('./rulesConverter');

var _rulesConverter2 = _interopRequireDefault(_rulesConverter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The OlSLDStyle class is the entry point for openlayers users.
 */
var OlSLDStyle = function (_Style) {
  _inherits(OlSLDStyle, _Style);

  function OlSLDStyle() {
    _classCallCheck(this, OlSLDStyle);

    var _this = _possibleConstructorReturn(this, (OlSLDStyle.__proto__ || Object.getPrototypeOf(OlSLDStyle)).call(this));

    _this.styleFunction = _this.styleFunction.bind(_this);
    return _this;
  }

  /**
   * An ol.styleFunction
   * @param {ol.Feature} feature openlayers feature to style
   * @param {number} resolution views resolution in meters/px, recalculate if your
   * layer use different units!
   * @return {ol.style.Style} openlayers style
   */


  _createClass(OlSLDStyle, [{
    key: 'styleFunction',
    value: function styleFunction(feature, resolution) {
      var props = feature.getProperties();
      props.fid = feature.getId();
      var rules = this.getRules(props, resolution);
      var style = (0, _rulesConverter2.default)(rules);
      var fill = new _openlayers2.default.style.Fill({
        color: style.fillOpacity && style.fillColor && style.fillColor.slice(0, 1) === '#' ? hexToRGB(style.fillColor, style.fillOpacity) : style.fillColor
      });
      var stroke = new _openlayers2.default.style.Stroke({
        color: style.strokeColor,
        width: style.strokeWidth,
        lineCap: style.strokeLinecap && style.strokeDasharray,
        lineDash: style.strokeDasharray && style.strokeDasharray.split(' '),
        lineDashOffset: style.strokeDashoffset && style.strokeDashoffset,
        lineJoin: style.strokeLinejoin && style.strokeLinejoin
      });
      var styles = [new _openlayers2.default.style.Style({
        image: new _openlayers2.default.style.Circle({
          fill: fill,
          stroke: stroke,
          radius: 5
        }),
        fill: fill,
        stroke: stroke
      })];
      return styles;
    }
  }]);

  return OlSLDStyle;
}(_Style3.default);

exports.default = OlSLDStyle;

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
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  }
  return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

/**
 * Openlayers stylefunction
 * @external ol.StyleFunction
 * @see {@link http://openlayers.org/en/latest/apidoc/ol.html#.StyleFunction}
 */

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./Style":3,"./rulesConverter":5}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Reader;
function addPropArray(node, obj, prop) {
  var property = prop.toLowerCase();
  obj[property] = obj[property] || [];
  var item = {};
  readNode(node, item);
  obj[property].push(item);
}

function addProp(node, obj, prop) {
  var property = prop.toLowerCase();
  obj[property] = {};
  readNode(node, obj[property]);
}

function getText(element, tagName) {
  var collection = element.getElementsByTagName(tagName);
  return collection.length ? collection.item(0).textContent : '';
}

function getBool(element, tagName) {
  var collection = element.getElementsByTagName(tagName);
  if (collection.length) {
    return Boolean(collection.item(0).textContent);
  }
  return false;
}

var parsers = {
  NamedLayer: function NamedLayer(element, obj) {
    obj.layers = obj.layers || [];
    var layer = {
      // name: getText(element, 'sld:Name'),
      styles: []
    };
    readNode(element, layer);
    obj.layers.push(layer);
  },
  UserStyle: function UserStyle(element, obj) {
    var style = {
      // name: getText(element, 'sld:Name'),
      default: getBool(element, 'sld:IsDefault'),
      featuretypestyles: []
    };
    readNode(element, style);
    obj.styles.push(style);
  },
  FeatureTypeStyle: function FeatureTypeStyle(element, obj) {
    var featuretypestyle = {
      rules: []
    };
    readNode(element, featuretypestyle);
    obj.featuretypestyles.push(featuretypestyle);
  },
  Rule: function Rule(element, obj) {
    var rule = {};
    readNode(element, rule);
    obj.rules.push(rule);
  },
  Filter: function Filter(element, obj) {
    obj.filter = {};
    readNode(element, obj.filter);
  },
  ElseFilter: function ElseFilter(element, obj) {
    obj.elsefilter = true;
  },
  Or: addProp,
  And: addProp,
  Not: addProp,
  PropertyIsEqualTo: addPropArray,
  PropertyIsNotEqualTo: addPropArray,
  PropertyIsLessThan: addPropArray,
  PropertyIsLessThanOrEqualTo: addPropArray,
  PropertyIsGreaterThan: addPropArray,
  PropertyIsGreaterThanOrEqualTo: addPropArray,
  PropertyName: function PropertyName(element, obj) {
    obj.propertyname = element.textContent;
  },
  Literal: function Literal(element, obj) {
    obj.literal = element.textContent;
  },
  FeatureId: function FeatureId(element, obj) {
    obj.featureid = obj.featureid || [];
    obj.featureid.push(element.getAttribute('fid'));
  },
  Name: function Name(element, obj) {
    obj.name = element.textContent;
  },
  MaxScaleDenominator: function MaxScaleDenominator(element, obj) {
    obj.maxscaledenominator = element.textContent;
  },
  PolygonSymbolizer: addProp,
  LineSymbolizer: addProp,
  PointSymbolizer: addProp,
  Fill: addProp,
  Stroke: addProp,
  ExternalGraphic: addProp,
  OnlineResource: function OnlineResource(element) {
    return getText(element, 'sld:OnlineResource');
  },
  CssParameter: function CssParameter(element, obj) {
    obj.css = obj.css || [];
    obj.css.push({
      name: element.getAttribute('name'),
      value: element.textContent.trim()
    });
  }
};

function readNode(node, obj) {
  for (var n = node.firstElementChild; n; n = n.nextElementSibling) {
    if (parsers[n.localName]) {
      parsers[n.localName](n, obj, n.localName);
    }
  }
}

/**
 * Creates a object from an sld xml string, for internal usage
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
* @property {Filter} [filter]
* @property {boolean} [elsefilter]
* @property {integer} [minscaledenominator]
* @property {integer} [maxscaledenominator]
* @property {PolygonSymbolizer} [polygonsymbolizer]
* @property {LineSymbolizer}  [linesymbolizer]
* @property {PointSymbolizer} [pointsymbolizer]
* */

/**
* @typedef Filter
* @name Filter
* @description [ogc filters]( http://schemas.opengis.net/filter/1.1.0/filter.xsd) should have only one prop
* @property {array} [featureid] filter
* @property {object} [or]  filter
* @property {object} [and]  filter
* @property {object} [not]  filter
* @property {array} [propertyisequalto]  filter
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

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Reader = require('./Reader');

var _Reader2 = _interopRequireDefault(_Reader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Filters = {
  featureid: function featureid(value, props) {
    for (var i = 0; i < value.length; i += 1) {
      if (value[i] === props.fid) {
        return true;
      }
    }
    return false;
  },
  not: function not(value, props) {
    return !filterSelector(value, props);
  },
  or: function or(value, props) {
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i += 1) {
      if (value[keys[i]].length === 1 && filterSelector(value, props, i)) {
        return true;
      } else if (value[keys[i]].length !== 1) {
        throw new Error('multiple ops of same type not implemented yet');
      }
    }
    return false;
  },
  propertyisequalto: function propertyisequalto(value, props) {
    return props[value['0'].propertyname] && props[value['0'].propertyname] === value['0'].literal;
  },
  propertyislessthan: function propertyislessthan(value, props) {
    return props[value['0'].propertyname] && Number(props[value['0'].propertyname]) < Number(value['0'].literal);
  }
};

/**
 * [filterSelector description]
 * @private
 * @param  {Filter} filter
 * @param  {object} properties feature properties
 * @param {number} key index of property to use
 * @return {boolean}
 */
function filterSelector(filter, properties) {
  var key = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

  var type = Object.keys(filter)[key];
  if (Filters[type]) {
    if (Filters[type](filter[type], properties)) {
      return true;
    }
  } else {
    throw new Error('Unkown filter ' + type);
  }
  return false;
}

/**
 * [scaleSelector description]
 * The "standardized rendering pixel size" is defined to be 0.28mm × 0.28mm
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
 * Base class for library specific style classes
 * After creating an instance you should call the read method.
 */

var Style = function () {
  function Style() {
    _classCallCheck(this, Style);

    this.getRules = this.getRules.bind(this);
  }

  /**
   * Read xml file
   * @param  {string} sld xml string
   * @param {string} [layername] Select layer matching case insensitive, defaults to first layer
   * @param {string} [stylename] Select style case insensitive, defaults to first style
   * @return {void}
   */


  _createClass(Style, [{
    key: 'read',
    value: function read(sld, layername, stylename) {
      this.sld = (0, _Reader2.default)(sld);
      this.setStyle(layername, stylename);
    }

    /**
     * is layer defined in sld?
     * @return {Boolean} [description]
     */

  }, {
    key: 'hasLayer',
    value: function hasLayer(layername) {
      var index = this.sld.layers.findIndex(function (l) {
        return l.name.toLowerCase() === layername.toLowerCase();
      });
      return index > -1;
    }
    /**
     * Change selected layer and style from sld to use
     * @param {string} [layername]  Select layer matching lowercased layername
     * @param {string} [stylename] style to use
     */

  }, {
    key: 'setStyle',
    value: function setStyle(layername, stylename) {
      var filteredlayers = void 0;
      if (layername) {
        filteredlayers = this.sld.layers.filter(function (l) {
          return l.name.toLowerCase() === layername.toLowerCase();
        });
        if (!filteredlayers.length) {
          throw Error('layer ' + layername + ' not found in sld');
        }
      }
      this.layer = filteredlayers ? filteredlayers['0'] : this.sld.layers['0'];
      this.style = this.layer.styles.filter(function (s) {
        return stylename ? s.name.toLowerCase() === stylename.toLowerCase() : s.default;
      })['0'];
    }

    /**
     * get sld rules for feature
     * @param  {Object} properties feature properties
     * @param {number} resolution unit/px
     * @return {Rule} filtered sld rules
     */

  }, {
    key: 'getRules',
    value: function getRules(properties, resolution) {
      if (!this.style) {
        throw new Error('Set a style to use');
      }
      var result = [];
      var FeatureTypeStyleLength = this.style.featuretypestyles.length;
      for (var i = 0; i < FeatureTypeStyleLength; i += 1) {
        var fttypestyle = this.style.featuretypestyles[i];
        for (var j = 0; j < fttypestyle.rules.length; j += 1) {
          var rule = fttypestyle.rules[j];
          if (rule.filter && scaleSelector(rule, resolution) && filterSelector(rule.filter, properties)) {
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
  }]);

  return Style;
}();

exports.default = Style;

},{"./Reader":2}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OlSLDStyle = undefined;

var _OlSLDStyle = require('./OlSLDStyle');

var _OlSLDStyle2 = _interopRequireDefault(_OlSLDStyle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.OlSLDStyle = _OlSLDStyle2.default;

},{"./OlSLDStyle":1}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * @private
 * @param  {Rule[]} rules [description]
 * @return {object}       see leaflet path for inspiration
 */
function rulesConverter(rules) {
  var result = {};
  for (var i = 0; i < rules.length; i += 1) {
    if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer.fill) {
      var fill = rules[i].polygonsymbolizer.fill;
      fillRules(fill, result);
    }
    if (rules[i].polygonsymbolizer && rules[i].polygonsymbolizer.stroke) {
      var stroke = rules[i].polygonsymbolizer.stroke;
      strokeRules(stroke, result);
    }
    if (rules[i].linesymbolizer && rules[i].linesymbolizer.stroke) {
      var _stroke = rules[i].linesymbolizer.stroke;
      strokeRules(_stroke, result);
    }
  }
  return result;
}

function strokeRules(stroke, result) {
  for (var j = 0; j < stroke.css.length; j += 1) {
    switch (stroke.css[j].name) {
      case 'stroke':
        result.strokeColor = stroke.css[j].value;
        break;
      default:
        {
          var key = stroke.css[j].name.toLowerCase().replace(/-(.)/g, function (match, group1) {
            return group1.toUpperCase();
          });
          result[key] = stroke.css[j].value;
        }
    }
  }
}

/**
 * [fill description]
 * @private
 * @param  {object} fill [description]
 * @param {object} result props will be added to
 * @return {void}      [description]
 */
function fillRules(fill, result) {
  for (var j = 0; j < fill.css.length; j += 1) {
    switch (fill.css[j].name) {
      case 'fill':
        result.fillColor = fill.css[j].value;
        break;
      case 'fill-opacity':
        result.fillOpacity = fill.css[j].value;
        break;
      default:
    }
  }
}

exports.default = rulesConverter;

},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvT2xTTERTdHlsZS5qcyIsInNyYy9SZWFkZXIuanMiLCJzcmMvU3R5bGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvcnVsZXNDb252ZXJ0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FDSUE7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBR0E7OztJQUdNLFU7OztBQUNKLHdCQUFjO0FBQUE7O0FBQUE7O0FBRVosVUFBSyxhQUFMLEdBQXFCLE1BQUssYUFBTCxDQUFtQixJQUFuQixPQUFyQjtBQUZZO0FBR2I7O0FBRUQ7Ozs7Ozs7Ozs7O2tDQU9jLE8sRUFBUyxVLEVBQVk7QUFDakMsVUFBTSxRQUFRLFFBQVEsYUFBUixFQUFkO0FBQ0EsWUFBTSxHQUFOLEdBQVksUUFBUSxLQUFSLEVBQVo7QUFDQSxVQUFNLFFBQVEsS0FBSyxRQUFMLENBQWMsS0FBZCxFQUFxQixVQUFyQixDQUFkO0FBQ0EsVUFBTSxRQUFRLDhCQUFlLEtBQWYsQ0FBZDtBQUNBLFVBQU0sT0FBTyxvQ0FBVztBQUN0QixlQUFRLE1BQU0sV0FBTixJQUFxQixNQUFNLFNBQTNCLElBQXdDLE1BQU0sU0FBTixDQUFnQixLQUFoQixDQUFzQixDQUF0QixFQUF5QixDQUF6QixNQUFnQyxHQUF6RSxHQUNILFNBQVMsTUFBTSxTQUFmLEVBQTBCLE1BQU0sV0FBaEMsQ0FERyxHQUM0QyxNQUFNO0FBRm5DLE9BQVgsQ0FBYjtBQUlBLFVBQU0sU0FBUyxzQ0FBYTtBQUMxQixlQUFPLE1BQU0sV0FEYTtBQUUxQixlQUFPLE1BQU0sV0FGYTtBQUcxQixpQkFBVSxNQUFNLGFBQVAsSUFBeUIsTUFBTSxlQUhkO0FBSTFCLGtCQUFXLE1BQU0sZUFBUCxJQUEyQixNQUFNLGVBQU4sQ0FBc0IsS0FBdEIsQ0FBNEIsR0FBNUIsQ0FKWDtBQUsxQix3QkFBaUIsTUFBTSxnQkFBUCxJQUE0QixNQUFNLGdC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KGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgT2xTdHlsZSBmcm9tICdvbC9zdHlsZS9zdHlsZSc7XG5pbXBvcnQgT2xGaWxsIGZyb20gJ29sL3N0eWxlL2ZpbGwnO1xuaW1wb3J0IE9sQ2lyY2xlIGZyb20gJ29sL3N0eWxlL2NpcmNsZSc7XG5pbXBvcnQgT2xTdHJva2UgZnJvbSAnb2wvc3R5bGUvc3Ryb2tlJztcbmltcG9ydCBTdHlsZSBmcm9tICcuL1N0eWxlJztcbmltcG9ydCBydWxlc0NvbnZlcnRlciBmcm9tICcuL3J1bGVzQ29udmVydGVyJztcblxuXG4vKipcbiAqIFRoZSBPbFNMRFN0eWxlIGNsYXNzIGlzIHRoZSBlbnRyeSBwb2ludCBmb3Igb3BlbmxheWVycyB1c2Vycy5cbiAqL1xuY2xhc3MgT2xTTERTdHlsZSBleHRlbmRzIFN0eWxlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnN0eWxlRnVuY3Rpb24gPSB0aGlzLnN0eWxlRnVuY3Rpb24uYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBvbC5zdHlsZUZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7b2wuRmVhdHVyZX0gZmVhdHVyZSBvcGVubGF5ZXJzIGZlYXR1cmUgdG8gc3R5bGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc29sdXRpb24gdmlld3MgcmVzb2x1dGlvbiBpbiBtZXRlcnMvcHgsIHJlY2FsY3VsYXRlIGlmIHlvdXJcbiAgICogbGF5ZXIgdXNlIGRpZmZlcmVudCB1bml0cyFcbiAgICogQHJldHVybiB7b2wuc3R5bGUuU3R5bGV9IG9wZW5sYXllcnMgc3R5bGVcbiAgICovXG4gIHN0eWxlRnVuY3Rpb24oZmVhdHVyZSwgcmVzb2x1dGlvbikge1xuICAgIGNvbnN0IHByb3BzID0gZmVhdHVyZS5nZXRQcm9wZXJ0aWVzKCk7XG4gICAgcHJvcHMuZmlkID0gZmVhdHVyZS5nZXRJZCgpO1xuICAgIGNvbnN0IHJ1bGVzID0gdGhpcy5nZXRSdWxlcyhwcm9wcywgcmVzb2x1dGlvbik7XG4gICAgY29uc3Qgc3R5bGUgPSBydWxlc0NvbnZlcnRlcihydWxlcyk7ICAgIFxuICAgIGNvbnN0IGZpbGwgPSBuZXcgT2xGaWxsKHtcbiAgICAgIGNvbG9yOiAoc3R5bGUuZmlsbE9wYWNpdHkgJiYgc3R5bGUuZmlsbENvbG9yICYmIHN0eWxlLmZpbGxDb2xvci5zbGljZSgwLCAxKSA9PT0gJyMnKVxuICAgICAgICA/IGhleFRvUkdCKHN0eWxlLmZpbGxDb2xvciwgc3R5bGUuZmlsbE9wYWNpdHkpIDogc3R5bGUuZmlsbENvbG9yLFxuICAgIH0pO1xuICAgIGNvbnN0IHN0cm9rZSA9IG5ldyBPbFN0cm9rZSh7XG4gICAgICBjb2xvcjogc3R5bGUuc3Ryb2tlQ29sb3IsXG4gICAgICB3aWR0aDogc3R5bGUuc3Ryb2tlV2lkdGgsXG4gICAgICBsaW5lQ2FwOiAoc3R5bGUuc3Ryb2tlTGluZWNhcCkgJiYgc3R5bGUuc3Ryb2tlRGFzaGFycmF5LFxuICAgICAgbGluZURhc2g6IChzdHlsZS5zdHJva2VEYXNoYXJyYXkpICYmIHN0eWxlLnN0cm9rZURhc2hhcnJheS5zcGxpdCgnICcpLFxuICAgICAgbGluZURhc2hPZmZzZXQ6IChzdHlsZS5zdHJva2VEYXNob2Zmc2V0KSAmJiBzdHlsZS5zdHJva2VEYXNob2Zmc2V0LFxuICAgICAgbGluZUpvaW46IChzdHlsZS5zdHJva2VMaW5lam9pbikgJiYgc3R5bGUuc3Ryb2tlTGluZWpvaW4sXG4gICAgfSk7XG4gICAgY29uc3Qgc3R5bGVzID0gW1xuICAgICAgbmV3IE9sU3R5bGUoe1xuICAgICAgICBpbWFnZTogbmV3IE9sQ2lyY2xlKHtcbiAgICAgICAgICBmaWxsLFxuICAgICAgICAgIHN0cm9rZSxcbiAgICAgICAgICByYWRpdXM6IDUsXG4gICAgICAgIH0pLFxuICAgICAgICBmaWxsLFxuICAgICAgICBzdHJva2UsXG4gICAgICB9KSxcbiAgICBdO1xuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IE9sU0xEU3R5bGU7XG5cbi8qKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge3N0cmluZ30gaGV4ICAgZWcgI0FBMDBGRlxuICogQHBhcmFtICB7TnVtYmVyfSBhbHBoYSBlZyAwLjVcbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgcmdiYSgwLDAsMCwwKVxuICovXG5mdW5jdGlvbiBoZXhUb1JHQihoZXgsIGFscGhhKSB7XG4gIGNvbnN0IHIgPSBwYXJzZUludChoZXguc2xpY2UoMSwgMyksIDE2KTtcbiAgY29uc3QgZyA9IHBhcnNlSW50KGhleC5zbGljZSgzLCA1KSwgMTYpO1xuICBjb25zdCBiID0gcGFyc2VJbnQoaGV4LnNsaWNlKDUsIDcpLCAxNik7XG4gIGlmIChhbHBoYSkge1xuICAgIHJldHVybiBgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2FscGhhfSlgO1xuICB9XG4gIHJldHVybiBgcmdiKCR7cn0sICR7Z30sICR7Yn0pYDtcbn1cblxuIC8qKlxuICAqIE9wZW5sYXllcnMgc3R5bGVmdW5jdGlvblxuICAqIEBleHRlcm5hbCBvbC5TdHlsZUZ1bmN0aW9uXG4gICogQHNlZSB7QGxpbmsgaHR0cDovL29wZW5sYXllcnMub3JnL2VuL2xhdGVzdC9hcGlkb2Mvb2wuaHRtbCMuU3R5bGVGdW5jdGlvbn1cbiAgKi9cbiIsImZ1bmN0aW9uIGFkZFByb3BBcnJheShub2RlLCBvYmosIHByb3ApIHtcbiAgY29uc3QgcHJvcGVydHkgPSBwcm9wLnRvTG93ZXJDYXNlKCk7XG4gIG9ialtwcm9wZXJ0eV0gPSBvYmpbcHJvcGVydHldIHx8IFtdO1xuICBjb25zdCBpdGVtID0ge307XG4gIHJlYWROb2RlKG5vZGUsIGl0ZW0pO1xuICBvYmpbcHJvcGVydHldLnB1c2goaXRlbSk7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3Aobm9kZSwgb2JqLCBwcm9wKSB7XG4gIGNvbnN0IHByb3BlcnR5ID0gcHJvcC50b0xvd2VyQ2FzZSgpO1xuICBvYmpbcHJvcGVydHldID0ge307XG4gIHJlYWROb2RlKG5vZGUsIG9ialtwcm9wZXJ0eV0pO1xufVxuXG5mdW5jdGlvbiBnZXRUZXh0KGVsZW1lbnQsIHRhZ05hbWUpIHtcbiAgY29uc3QgY29sbGVjdGlvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSk7XG4gIHJldHVybiAoY29sbGVjdGlvbi5sZW5ndGgpID8gY29sbGVjdGlvbi5pdGVtKDApLnRleHRDb250ZW50IDogJyc7XG59XG5cbmZ1bmN0aW9uIGdldEJvb2woZWxlbWVudCwgdGFnTmFtZSkge1xuICBjb25zdCBjb2xsZWN0aW9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKTtcbiAgaWYgKGNvbGxlY3Rpb24ubGVuZ3RoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oY29sbGVjdGlvbi5pdGVtKDApLnRleHRDb250ZW50KTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmNvbnN0IHBhcnNlcnMgPSB7XG4gIE5hbWVkTGF5ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmoubGF5ZXJzID0gb2JqLmxheWVycyB8fCBbXTtcbiAgICBjb25zdCBsYXllciA9IHtcbiAgICAgIC8vIG5hbWU6IGdldFRleHQoZWxlbWVudCwgJ3NsZDpOYW1lJyksXG4gICAgICBzdHlsZXM6IFtdLFxuICAgIH07XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgbGF5ZXIpO1xuICAgIG9iai5sYXllcnMucHVzaChsYXllcik7XG4gIH0sXG4gIFVzZXJTdHlsZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgLy8gbmFtZTogZ2V0VGV4dChlbGVtZW50LCAnc2xkOk5hbWUnKSxcbiAgICAgIGRlZmF1bHQ6IGdldEJvb2woZWxlbWVudCwgJ3NsZDpJc0RlZmF1bHQnKSxcbiAgICAgIGZlYXR1cmV0eXBlc3R5bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIHN0eWxlKTtcbiAgICBvYmouc3R5bGVzLnB1c2goc3R5bGUpO1xuICB9LFxuICBGZWF0dXJlVHlwZVN0eWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXR5cGVzdHlsZSA9IHtcbiAgICAgIHJ1bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIGZlYXR1cmV0eXBlc3R5bGUpO1xuICAgIG9iai5mZWF0dXJldHlwZXN0eWxlcy5wdXNoKGZlYXR1cmV0eXBlc3R5bGUpO1xuICB9LFxuICBSdWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3QgcnVsZSA9IHt9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIHJ1bGUpO1xuICAgIG9iai5ydWxlcy5wdXNoKHJ1bGUpO1xuICB9LFxuICBGaWx0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZmlsdGVyID0ge307XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgb2JqLmZpbHRlcik7XG4gIH0sXG4gIEVsc2VGaWx0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZWxzZWZpbHRlciA9IHRydWU7XG4gIH0sXG4gIE9yOiBhZGRQcm9wLFxuICBBbmQ6IGFkZFByb3AsXG4gIE5vdDogYWRkUHJvcCxcbiAgUHJvcGVydHlJc0VxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc05vdEVxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0xlc3NUaGFuOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNMZXNzVGhhbk9yRXF1YWxUbzogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzR3JlYXRlclRoYW46IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0dyZWF0ZXJUaGFuT3JFcXVhbFRvOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5TmFtZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5wcm9wZXJ0eW5hbWUgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBMaXRlcmFsOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmxpdGVyYWwgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBGZWF0dXJlSWQ6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZmVhdHVyZWlkID0gb2JqLmZlYXR1cmVpZCB8fCBbXTtcbiAgICBvYmouZmVhdHVyZWlkLnB1c2goZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2ZpZCcpKTtcbiAgfSxcbiAgTmFtZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5uYW1lID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgTWF4U2NhbGVEZW5vbWluYXRvcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5tYXhzY2FsZWRlbm9taW5hdG9yID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgUG9seWdvblN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIExpbmVTeW1ib2xpemVyOiBhZGRQcm9wLFxuICBQb2ludFN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIEZpbGw6IGFkZFByb3AsXG4gIFN0cm9rZTogYWRkUHJvcCxcbiAgRXh0ZXJuYWxHcmFwaGljOiBhZGRQcm9wLFxuICBPbmxpbmVSZXNvdXJjZTogZWxlbWVudCA9PiBnZXRUZXh0KGVsZW1lbnQsICdzbGQ6T25saW5lUmVzb3VyY2UnKSxcbiAgQ3NzUGFyYW1ldGVyOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmNzcyA9IG9iai5jc3MgfHwgW107XG4gICAgb2JqLmNzcy5wdXNoKHtcbiAgICAgIG5hbWU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCduYW1lJyksXG4gICAgICB2YWx1ZTogZWxlbWVudC50ZXh0Q29udGVudC50cmltKCksXG4gICAgfSk7XG4gIH0sXG59O1xuXG5mdW5jdGlvbiByZWFkTm9kZShub2RlLCBvYmopIHtcbiAgZm9yIChsZXQgbiA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7IG47IG4gPSBuLm5leHRFbGVtZW50U2libGluZykge1xuICAgIGlmIChwYXJzZXJzW24ubG9jYWxOYW1lXSkge1xuICAgICAgcGFyc2Vyc1tuLmxvY2FsTmFtZV0obiwgb2JqLCBuLmxvY2FsTmFtZSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgb2JqZWN0IGZyb20gYW4gc2xkIHhtbCBzdHJpbmcsIGZvciBpbnRlcm5hbCB1c2FnZVxuICogQHBhcmFtICB7c3RyaW5nfSBzbGQgeG1sIHN0cmluZ1xuICogQHJldHVybiB7U3R5bGVkTGF5ZXJEZXNjcmlwdG9yfSAgb2JqZWN0IHJlcHJlc2VudGluZyBzbGQgc3R5bGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUmVhZGVyKHNsZCkge1xuICBjb25zdCByZXN1bHQgPSB7fTtcbiAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICBjb25zdCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHNsZCwgJ2FwcGxpY2F0aW9uL3htbCcpO1xuXG4gIGZvciAobGV0IG4gPSBkb2MuZmlyc3RDaGlsZDsgbjsgbiA9IG4ubmV4dFNpYmxpbmcpIHtcbiAgICByZXN1bHQudmVyc2lvbiA9IG4uZ2V0QXR0cmlidXRlKCd2ZXJzaW9uJyk7XG4gICAgcmVhZE5vZGUobiwgcmVzdWx0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbi8qKlxuICogQHR5cGVkZWYgU3R5bGVkTGF5ZXJEZXNjcmlwdG9yXG4gKiBAbmFtZSBTdHlsZWRMYXllckRlc2NyaXB0b3JcbiAqIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFN0eWxlZExheWVyRGVzY3JpcHRvciB7QGxpbmsgaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2xkLzEuMS9TdHlsZWRMYXllckRlc2NyaXB0b3IueHNkIHhzZH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2ZXJzaW9uIHNsZCB2ZXJzaW9uXG4gKiBAcHJvcGVydHkge0xheWVyW119IGxheWVycyBpbmZvIGV4dHJhY3RlZCBmcm9tIE5hbWVkTGF5ZXIgZWxlbWVudFxuICovXG5cbi8qKlxuKiBAdHlwZWRlZiBMYXllclxuKiBAbmFtZSBMYXllclxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBMYXllciwgdGhlIGFjdHVhbCBzdHlsZSBvYmplY3QgZm9yIGEgc2luZ2xlIGxheWVyXG4qIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lIGxheWVyIG5hbWVcbiogQHByb3BlcnR5IHtPYmplY3RbXX0gc3R5bGVzIFNlZSBleHBsYW5hdGlvbiBhdCBbR2Vvc2VydmVyIGRvY3NdKGh0dHA6Ly9kb2NzLmdlb3NlcnZlci5vcmcvc3RhYmxlL2VuL3VzZXIvc3R5bGluZy9zbGQvcmVmZXJlbmNlL3N0eWxlcy5odG1sKVxuKiBAcHJvcGVydHkge0Jvb2xlYW59IHN0eWxlc1tdLmRlZmF1bHRcbiogQHByb3BlcnR5IHtGZWF0dXJlVHlwZVN0eWxlW119IHN0eWxlc1tdLmZlYXR1cmV0eXBlc3R5bGVzXG4qL1xuXG4vKipcbiogQHR5cGVkZWYgRmVhdHVyZVR5cGVTdHlsZVxuKiBAbmFtZSBGZWF0dXJlVHlwZVN0eWxlXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIEZlYXR1cmVUeXBlU3R5bGU6IHtAbGluayBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9GZWF0dXJlU3R5bGUueHNkIHhzZH1cbiogQHByb3BlcnR5IHtSdWxlW119IHJ1bGVzXG4qL1xuXG5cbi8qKlxuKiBAdHlwZWRlZiBSdWxlXG4qIEBuYW1lIFJ1bGVcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgUnVsZSB0byBtYXRjaCBhIGZlYXR1cmU6IHtAbGluayBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9GZWF0dXJlU3R5bGUueHNkIHhzZH1cbiogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgcnVsZSBuYW1lXG4qIEBwcm9wZXJ0eSB7RmlsdGVyfSBbZmlsdGVyXVxuKiBAcHJvcGVydHkge2Jvb2xlYW59IFtlbHNlZmlsdGVyXVxuKiBAcHJvcGVydHkge2ludGVnZXJ9IFttaW5zY2FsZWRlbm9taW5hdG9yXVxuKiBAcHJvcGVydHkge2ludGVnZXJ9IFttYXhzY2FsZWRlbm9taW5hdG9yXVxuKiBAcHJvcGVydHkge1BvbHlnb25TeW1ib2xpemVyfSBbcG9seWdvbnN5bWJvbGl6ZXJdXG4qIEBwcm9wZXJ0eSB7TGluZVN5bWJvbGl6ZXJ9ICBbbGluZXN5bWJvbGl6ZXJdXG4qIEBwcm9wZXJ0eSB7UG9pbnRTeW1ib2xpemVyfSBbcG9pbnRzeW1ib2xpemVyXVxuKiAqL1xuXG4vKipcbiogQHR5cGVkZWYgRmlsdGVyXG4qIEBuYW1lIEZpbHRlclxuKiBAZGVzY3JpcHRpb24gW29nYyBmaWx0ZXJzXSggaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvZmlsdGVyLzEuMS4wL2ZpbHRlci54c2QpIHNob3VsZCBoYXZlIG9ubHkgb25lIHByb3BcbiogQHByb3BlcnR5IHthcnJheX0gW2ZlYXR1cmVpZF0gZmlsdGVyXG4qIEBwcm9wZXJ0eSB7b2JqZWN0fSBbb3JdICBmaWx0ZXJcbiogQHByb3BlcnR5IHtvYmplY3R9IFthbmRdICBmaWx0ZXJcbiogQHByb3BlcnR5IHtvYmplY3R9IFtub3RdICBmaWx0ZXJcbiogQHByb3BlcnR5IHthcnJheX0gW3Byb3BlcnR5aXNlcXVhbHRvXSAgZmlsdGVyXG4qICovXG5cblxuLyoqXG4qIEB0eXBlZGVmIFBvbHlnb25TeW1ib2xpemVyXG4qIEBuYW1lIFBvbHlnb25TeW1ib2xpemVyXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFtQb2x5Z29uU3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBmaWxsXG4qIEBwcm9wZXJ0eSB7YXJyYXl9IGZpbGwuY3NzXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBzdHJva2VcbiogQHByb3BlcnR5IHthcnJheX0gc3Ryb2tlLmNzc1xuKiAqL1xuXG4vKipcbiogQHR5cGVkZWYgTGluZVN5bWJvbGl6ZXJcbiogQG5hbWUgTGluZVN5bWJvbGl6ZXJcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgW0xpbmVTeW1ib2xpemVyXShodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9TeW1ib2xpemVyLnhzZClcbiogQHByb3BlcnR5IHtPYmplY3R9IHN0cm9rZVxuKiBAcHJvcGVydHkge2FycmF5fSBzdHJva2UuY3NzXG4qICovXG5cblxuLyoqXG4qIEB0eXBlZGVmIFBvaW50U3ltYm9saXplclxuKiBAbmFtZSBQb2ludFN5bWJvbGl6ZXJcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgW1BvaW50U3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBncmFwaGljXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBncmFwaGljLmV4dGVybmFsZ3JhcGhpY1xuKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhpYy5leHRlcm5hbGdyYXBoaWMub25saW5lcmVzb3VyY2VcbiogKi9cbiIsImltcG9ydCBSZWFkZXIgZnJvbSAnLi9SZWFkZXInO1xuXG5jb25zdCBGaWx0ZXJzID0ge1xuICBmZWF0dXJlaWQ6ICh2YWx1ZSwgcHJvcHMpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodmFsdWVbaV0gPT09IHByb3BzLmZpZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBub3Q6ICh2YWx1ZSwgcHJvcHMpID0+ICFmaWx0ZXJTZWxlY3Rvcih2YWx1ZSwgcHJvcHMpLFxuICBvcjogKHZhbHVlLCBwcm9wcykgPT4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodmFsdWVba2V5c1tpXV0ubGVuZ3RoID09PSAxICYmIGZpbHRlclNlbGVjdG9yKHZhbHVlLCBwcm9wcywgaSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlW2tleXNbaV1dLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ211bHRpcGxlIG9wcyBvZiBzYW1lIHR5cGUgbm90IGltcGxlbWVudGVkIHlldCcpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIHByb3BlcnR5aXNlcXVhbHRvOiAodmFsdWUsIHByb3BzKSA9PiAocHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdICYmXG4gICAgcHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdID09PSB2YWx1ZVsnMCddLmxpdGVyYWwpLFxuICBwcm9wZXJ0eWlzbGVzc3RoYW46ICh2YWx1ZSwgcHJvcHMpID0+IChwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0gJiZcbiAgICBOdW1iZXIocHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdKSA8IE51bWJlcih2YWx1ZVsnMCddLmxpdGVyYWwpKSxcbn07XG5cbi8qKlxuICogW2ZpbHRlclNlbGVjdG9yIGRlc2NyaXB0aW9uXVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge0ZpbHRlcn0gZmlsdGVyXG4gKiBAcGFyYW0gIHtvYmplY3R9IHByb3BlcnRpZXMgZmVhdHVyZSBwcm9wZXJ0aWVzXG4gKiBAcGFyYW0ge251bWJlcn0ga2V5IGluZGV4IG9mIHByb3BlcnR5IHRvIHVzZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gZmlsdGVyU2VsZWN0b3IoZmlsdGVyLCBwcm9wZXJ0aWVzLCBrZXkgPSAwKSB7XG4gIGNvbnN0IHR5cGUgPSBPYmplY3Qua2V5cyhmaWx0ZXIpW2tleV07XG4gIGlmIChGaWx0ZXJzW3R5cGVdKSB7XG4gICAgaWYgKEZpbHRlcnNbdHlwZV0oZmlsdGVyW3R5cGVdLCBwcm9wZXJ0aWVzKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5rb3duIGZpbHRlciAke3R5cGV9YCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFtzY2FsZVNlbGVjdG9yIGRlc2NyaXB0aW9uXVxuICogVGhlIFwic3RhbmRhcmRpemVkIHJlbmRlcmluZyBwaXhlbCBzaXplXCIgaXMgZGVmaW5lZCB0byBiZSAwLjI4bW0gw5cgMC4yOG1tXG4gKiBAcGFyYW0gIHtSdWxlfSBydWxlXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHJlc29sdXRpb24gIG0vcHhcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHNjYWxlU2VsZWN0b3IocnVsZSwgcmVzb2x1dGlvbikge1xuICBpZiAocnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQgJiYgcnVsZS5taW5zY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoKHJlc29sdXRpb24gLyAwLjAwMDI4KSA8IHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvciAmJlxuICAgICAgKHJlc29sdXRpb24gLyAwLjAwMDI4KSA+IHJ1bGUubWluc2NhbGVkZW5vbWluYXRvcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAocnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gKChyZXNvbHV0aW9uIC8gMC4wMDAyOCkgPCBydWxlLm1heHNjYWxlZGVub21pbmF0b3IpO1xuICB9XG4gIGlmIChydWxlLm1pbnNjYWxlZGVub21pbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAoKHJlc29sdXRpb24gLyAwLjAwMDI4KSA+IHJ1bGUubWluc2NhbGVkZW5vbWluYXRvcik7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBsaWJyYXJ5IHNwZWNpZmljIHN0eWxlIGNsYXNzZXNcbiAqIEFmdGVyIGNyZWF0aW5nIGFuIGluc3RhbmNlIHlvdSBzaG91bGQgY2FsbCB0aGUgcmVhZCBtZXRob2QuXG4gKi9cbmNsYXNzIFN0eWxlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmdldFJ1bGVzID0gdGhpcy5nZXRSdWxlcy5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgeG1sIGZpbGVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBzbGQgeG1sIHN0cmluZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xheWVybmFtZV0gU2VsZWN0IGxheWVyIG1hdGNoaW5nIGNhc2UgaW5zZW5zaXRpdmUsIGRlZmF1bHRzIHRvIGZpcnN0IGxheWVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbc3R5bGVuYW1lXSBTZWxlY3Qgc3R5bGUgY2FzZSBpbnNlbnNpdGl2ZSwgZGVmYXVsdHMgdG8gZmlyc3Qgc3R5bGVcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHJlYWQoc2xkLCBsYXllcm5hbWUsIHN0eWxlbmFtZSkge1xuICAgIHRoaXMuc2xkID0gUmVhZGVyKHNsZCk7XG4gICAgdGhpcy5zZXRTdHlsZShsYXllcm5hbWUsIHN0eWxlbmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogaXMgbGF5ZXIgZGVmaW5lZCBpbiBzbGQ/XG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIGhhc0xheWVyKGxheWVybmFtZSkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zbGQubGF5ZXJzLmZpbmRJbmRleChsID0+XG4gICAgICAobC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGxheWVybmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgcmV0dXJuIChpbmRleCA+IC0xKTtcbiAgfVxuICAvKipcbiAgICogQ2hhbmdlIHNlbGVjdGVkIGxheWVyIGFuZCBzdHlsZSBmcm9tIHNsZCB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYXllcm5hbWVdICBTZWxlY3QgbGF5ZXIgbWF0Y2hpbmcgbG93ZXJjYXNlZCBsYXllcm5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZW5hbWVdIHN0eWxlIHRvIHVzZVxuICAgKi9cbiAgc2V0U3R5bGUobGF5ZXJuYW1lLCBzdHlsZW5hbWUpIHtcbiAgICBsZXQgZmlsdGVyZWRsYXllcnM7XG4gICAgaWYgKGxheWVybmFtZSkge1xuICAgICAgZmlsdGVyZWRsYXllcnMgPSB0aGlzLnNsZC5sYXllcnMuZmlsdGVyKGwgPT5cbiAgICAgICAgKGwubmFtZS50b0xvd2VyQ2FzZSgpID09PSBsYXllcm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuICAgICAgaWYgKCFmaWx0ZXJlZGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoYGxheWVyICR7bGF5ZXJuYW1lfSBub3QgZm91bmQgaW4gc2xkYCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubGF5ZXIgPSAoZmlsdGVyZWRsYXllcnMpID8gZmlsdGVyZWRsYXllcnNbJzAnXSA6IHRoaXMuc2xkLmxheWVyc1snMCddO1xuICAgIHRoaXMuc3R5bGUgPSB0aGlzLmxheWVyLnN0eWxlcy5maWx0ZXIocyA9PiAoKHN0eWxlbmFtZSkgPyAocy5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IHN0eWxlbmFtZS50b0xvd2VyQ2FzZSgpKSA6IHMuZGVmYXVsdCkpWycwJ107XG4gIH1cblxuXG4gIC8qKlxuICAgKiBnZXQgc2xkIHJ1bGVzIGZvciBmZWF0dXJlXG4gICAqIEBwYXJhbSAge09iamVjdH0gcHJvcGVydGllcyBmZWF0dXJlIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc29sdXRpb24gdW5pdC9weFxuICAgKiBAcmV0dXJuIHtSdWxlfSBmaWx0ZXJlZCBzbGQgcnVsZXNcbiAgICovXG4gIGdldFJ1bGVzKHByb3BlcnRpZXMsIHJlc29sdXRpb24pIHtcbiAgICBpZiAoIXRoaXMuc3R5bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2V0IGEgc3R5bGUgdG8gdXNlJyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGNvbnN0IEZlYXR1cmVUeXBlU3R5bGVMZW5ndGggPSB0aGlzLnN0eWxlLmZlYXR1cmV0eXBlc3R5bGVzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEZlYXR1cmVUeXBlU3R5bGVMZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3QgZnR0eXBlc3R5bGUgPSB0aGlzLnN0eWxlLmZlYXR1cmV0eXBlc3R5bGVzW2ldO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBmdHR5cGVzdHlsZS5ydWxlcy5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICBjb25zdCBydWxlID0gZnR0eXBlc3R5bGUucnVsZXNbal07XG4gICAgICAgIGlmIChydWxlLmZpbHRlciAmJiBzY2FsZVNlbGVjdG9yKHJ1bGUsIHJlc29sdXRpb24pICYmXG4gICAgICAgICAgZmlsdGVyU2VsZWN0b3IocnVsZS5maWx0ZXIsIHByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2gocnVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZS5lbHNlZmlsdGVyICYmIHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXN1bHQucHVzaChydWxlKTtcbiAgICAgICAgfSBlbHNlIGlmICghcnVsZS5lbHNlZmlsdGVyICYmICFydWxlLmZpbHRlcikge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBTdHlsZTtcbiIsImltcG9ydCBPbFNMRFN0eWxlIGZyb20gJy4vT2xTTERTdHlsZSc7XG5cblxuZXhwb3J0IHsgT2xTTERTdHlsZSB9O1xuIiwiLyoqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7UnVsZVtdfSBydWxlcyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgIHNlZSBsZWFmbGV0IHBhdGggZm9yIGluc3BpcmF0aW9uXG4gKi9cbmZ1bmN0aW9uIHJ1bGVzQ29udmVydGVyKHJ1bGVzKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyICYmIHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLmZpbGwpIHtcbiAgICAgIGNvbnN0IGZpbGwgPSBydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplci5maWxsO1xuICAgICAgZmlsbFJ1bGVzKGZpbGwsIHJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplciAmJiBydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplci5zdHJva2UpIHtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLnN0cm9rZTtcbiAgICAgIHN0cm9rZVJ1bGVzKHN0cm9rZSwgcmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKHJ1bGVzW2ldLmxpbmVzeW1ib2xpemVyICYmIHJ1bGVzW2ldLmxpbmVzeW1ib2xpemVyLnN0cm9rZSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gcnVsZXNbaV0ubGluZXN5bWJvbGl6ZXIuc3Ryb2tlO1xuICAgICAgc3Ryb2tlUnVsZXMoc3Ryb2tlLCByZXN1bHQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBzdHJva2VSdWxlcyhzdHJva2UsIHJlc3VsdCkge1xuICBmb3IgKGxldCBqID0gMDsgaiA8IHN0cm9rZS5jc3MubGVuZ3RoOyBqICs9IDEpIHtcbiAgICBzd2l0Y2ggKHN0cm9rZS5jc3Nbal0ubmFtZSkge1xuICAgICAgY2FzZSAnc3Ryb2tlJzpcbiAgICAgICAgcmVzdWx0LnN0cm9rZUNvbG9yID0gc3Ryb2tlLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGNvbnN0IGtleSA9IHN0cm9rZS5jc3Nbal0ubmFtZS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLy0oLikvZywgKG1hdGNoLCBncm91cDEpID0+IGdyb3VwMS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgcmVzdWx0W2tleV0gPSBzdHJva2UuY3NzW2pdLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFtmaWxsIGRlc2NyaXB0aW9uXVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge29iamVjdH0gZmlsbCBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0ge29iamVjdH0gcmVzdWx0IHByb3BzIHdpbGwgYmUgYWRkZWQgdG9cbiAqIEByZXR1cm4ge3ZvaWR9ICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBmaWxsUnVsZXMoZmlsbCwgcmVzdWx0KSB7XG4gIGZvciAobGV0IGogPSAwOyBqIDwgZmlsbC5jc3MubGVuZ3RoOyBqICs9IDEpIHtcbiAgICBzd2l0Y2ggKGZpbGwuY3NzW2pdLm5hbWUpIHtcbiAgICAgIGNhc2UgJ2ZpbGwnOlxuICAgICAgICByZXN1bHQuZmlsbENvbG9yID0gZmlsbC5jc3Nbal0udmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZmlsbC1vcGFjaXR5JzpcbiAgICAgICAgcmVzdWx0LmZpbGxPcGFjaXR5ID0gZmlsbC5jc3Nbal0udmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBydWxlc0NvbnZlcnRlcjtcbiJdfQ==
