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
        color: style.fillColor && hexToRGB(style.fillColor, style.fillOpacity)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvT2xTTERTdHlsZS5qcyIsInNyYy9SZWFkZXIuanMiLCJzcmMvU3R5bGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvcnVsZXNDb252ZXJ0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FDSUE7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBR0E7OztJQUdNLFU7OztBQUNKLHdCQUFjO0FBQUE7O0FBQUE7O0FBRVosVUFBSyxhQUFMLEdBQXFCLE1BQUssYUFBTCxDQUFtQixJQUFuQixPQUFyQjtBQUZZO0FBR2I7O0FBRUQ7Ozs7Ozs7Ozs7O2tDQU9jLE8sRUFBUyxVLEVBQVk7QUFDakMsVUFBTSxRQUFRLFFBQVEsYUFBUixFQUFkO0FBQ0EsWUFBTSxHQUFOLEdBQVksUUFBUSxLQUFSLEVBQVo7QUFDQSxVQUFNLFFBQVEsS0FBSyxRQUFMLENBQWMsS0FBZCxFQUFxQixVQUFyQixDQUFkO0FBQ0EsVUFBTSxRQUFRLDhCQUFlLEtBQWYsQ0FBZDtBQUNBLFVBQU0sT0FBTyxvQ0FBVztBQUN0QixlQUFRLE1BQU0sU0FBUCxJQUFxQixTQUFTLE1BQU0sU0FBZixFQUEwQixNQUFNLFdBQWhDO0FBRE4sT0FBWCxDQUFiO0FBR0EsVUFBTSxTQUFTLHNDQUFhO0FBQzFCLGVBQU8sTUFBTSxXQURhO0FBRTFCLGVBQU8sTUFBTSxXQUZhO0FBRzFCLGlCQUFVLE1BQU0sYUFBUCxJQUF5QixNQUFNLGVBSGQ7QUFJMUIsa0JBQVcsTUFBTSxlQUFQLElBQTJCLE1BQU0sZUFBTixDQUFzQixLQUF0QixDQUE0QixHQUE1QixDQUpYO0FBSzFCLHdCQUFpQixNQUFNLGdCQUFQLElBQTRCLE1BQU0sZ0JBTHhCO0FBTTFCLGtCQUFXLE1BQU0sY0FBUCxJQUEwQixNQUFNO0FBTmhCLE9BQWIsQ0FBZjtBQVFBLFVBQU0sU0FBUyxDQUNiLHFDQUFZO0FBQ1YsZUFBTyxzQ0FBYTtB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LE9BQU8sR0FBUCxDQUFXLE1BQS9CLEVBQXVDLEtBQUssQ0FBNUMsRUFBK0M7QUFDN0MsWUFBUSxPQUFPLEdBQVAsQ0FBVyxDQUFYLEVBQWMsSUFBdEI7QUFDRSxXQUFLLFFBQUw7QUFDRSxlQUFPLFdBQVAsR0FBcUIsT0FBTyxHQUFQLENBQVcsQ0FBWCxFQUFjLEtBQW5DO0FBQ0E7QUFDRjtBQUFTO0FBQ1AsY0FBTSxNQUFNLE9BQU8sR0FBUCxDQUFXLENBQVgsRUFBYyxJQUFkLENBQW1CLFdBQW5CLEdBQWlDLE9BQWpDLENBQXlDLE9BQXpDLEVBQWtELFVBQUMsS0FBRCxFQUFRLE1BQVI7QUFBQSxtQkFBbUIsT0FBTyxXQUFQLEVBQW5CO0FBQUEsV0FBbEQsQ0FBWjtBQUNBLGlCQUFPLEdBQVAsSUFBYyxPQUFPLEdBQVAsQ0FBVyxDQUFYLEVBQWMsS0FBNUI7QUFDRDtBQVBIO0FBU0Q7QUFDRjs7QUFFRDs7Ozs7OztBQU9BLFNBQVMsU0FBVCxDQUFtQixJQUFuQixFQUF5QixNQUF6QixFQUFpQztBQUMvQixPQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxHQUFMLENBQVMsTUFBN0IsRUFBcUMsS0FBSyxDQUExQyxFQUE2QztBQUMzQyxZQUFRLEtBQUssR0FBTCxDQUFTLENBQVQsRUFBWSxJQUFwQjtBQUNFLFdBQUssTUFBTDtBQUNFLGVBQU8sU0FBUCxHQUFtQixLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksS0FBL0I7QUFDQTtBQUNGLFdBQUssY0FBTDtBQUNFLGVBQU8sV0FBUCxHQUFxQixLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksS0FBakM7QUFDQTtBQUNGO0FBUEY7QUFTRDtBQUNGOztrQkFHYyxjIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBPbFN0eWxlIGZyb20gJ29sL3N0eWxlL3N0eWxlJztcbmltcG9ydCBPbEZpbGwgZnJvbSAnb2wvc3R5bGUvZmlsbCc7XG5pbXBvcnQgT2xDaXJjbGUgZnJvbSAnb2wvc3R5bGUvY2lyY2xlJztcbmltcG9ydCBPbFN0cm9rZSBmcm9tICdvbC9zdHlsZS9zdHJva2UnO1xuaW1wb3J0IFN0eWxlIGZyb20gJy4vU3R5bGUnO1xuaW1wb3J0IHJ1bGVzQ29udmVydGVyIGZyb20gJy4vcnVsZXNDb252ZXJ0ZXInO1xuXG5cbi8qKlxuICogVGhlIE9sU0xEU3R5bGUgY2xhc3MgaXMgdGhlIGVudHJ5IHBvaW50IGZvciBvcGVubGF5ZXJzIHVzZXJzLlxuICovXG5jbGFzcyBPbFNMRFN0eWxlIGV4dGVuZHMgU3R5bGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuc3R5bGVGdW5jdGlvbiA9IHRoaXMuc3R5bGVGdW5jdGlvbi5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIG9sLnN0eWxlRnVuY3Rpb25cbiAgICogQHBhcmFtIHtvbC5GZWF0dXJlfSBmZWF0dXJlIG9wZW5sYXllcnMgZmVhdHVyZSB0byBzdHlsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzb2x1dGlvbiB2aWV3cyByZXNvbHV0aW9uIGluIG1ldGVycy9weCwgcmVjYWxjdWxhdGUgaWYgeW91clxuICAgKiBsYXllciB1c2UgZGlmZmVyZW50IHVuaXRzIVxuICAgKiBAcmV0dXJuIHtvbC5zdHlsZS5TdHlsZX0gb3BlbmxheWVycyBzdHlsZVxuICAgKi9cbiAgc3R5bGVGdW5jdGlvbihmZWF0dXJlLCByZXNvbHV0aW9uKSB7XG4gICAgY29uc3QgcHJvcHMgPSBmZWF0dXJlLmdldFByb3BlcnRpZXMoKTtcbiAgICBwcm9wcy5maWQgPSBmZWF0dXJlLmdldElkKCk7XG4gICAgY29uc3QgcnVsZXMgPSB0aGlzLmdldFJ1bGVzKHByb3BzLCByZXNvbHV0aW9uKTtcbiAgICBjb25zdCBzdHlsZSA9IHJ1bGVzQ29udmVydGVyKHJ1bGVzKTtcbiAgICBjb25zdCBmaWxsID0gbmV3IE9sRmlsbCh7XG4gICAgICBjb2xvcjogKHN0eWxlLmZpbGxDb2xvcikgJiYgaGV4VG9SR0Ioc3R5bGUuZmlsbENvbG9yLCBzdHlsZS5maWxsT3BhY2l0eSksXG4gICAgfSk7XG4gICAgY29uc3Qgc3Ryb2tlID0gbmV3IE9sU3Ryb2tlKHtcbiAgICAgIGNvbG9yOiBzdHlsZS5zdHJva2VDb2xvcixcbiAgICAgIHdpZHRoOiBzdHlsZS5zdHJva2VXaWR0aCxcbiAgICAgIGxpbmVDYXA6IChzdHlsZS5zdHJva2VMaW5lY2FwKSAmJiBzdHlsZS5zdHJva2VEYXNoYXJyYXksXG4gICAgICBsaW5lRGFzaDogKHN0eWxlLnN0cm9rZURhc2hhcnJheSkgJiYgc3R5bGUuc3Ryb2tlRGFzaGFycmF5LnNwbGl0KCcgJyksXG4gICAgICBsaW5lRGFzaE9mZnNldDogKHN0eWxlLnN0cm9rZURhc2hvZmZzZXQpICYmIHN0eWxlLnN0cm9rZURhc2hvZmZzZXQsXG4gICAgICBsaW5lSm9pbjogKHN0eWxlLnN0cm9rZUxpbmVqb2luKSAmJiBzdHlsZS5zdHJva2VMaW5lam9pbixcbiAgICB9KTtcbiAgICBjb25zdCBzdHlsZXMgPSBbXG4gICAgICBuZXcgT2xTdHlsZSh7XG4gICAgICAgIGltYWdlOiBuZXcgT2xDaXJjbGUoe1xuICAgICAgICAgIGZpbGwsXG4gICAgICAgICAgc3Ryb2tlLFxuICAgICAgICAgIHJhZGl1czogNSxcbiAgICAgICAgfSksXG4gICAgICAgIGZpbGwsXG4gICAgICAgIHN0cm9rZSxcbiAgICAgIH0pLFxuICAgIF07XG4gICAgcmV0dXJuIHN0eWxlcztcbiAgfVxuXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgT2xTTERTdHlsZTtcblxuLyoqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7c3RyaW5nfSBoZXggICBlZyAjQUEwMEZGXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGFscGhhIGVnIDAuNVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICByZ2JhKDAsMCwwLDApXG4gKi9cbmZ1bmN0aW9uIGhleFRvUkdCKGhleCwgYWxwaGEpIHtcbiAgY29uc3QgciA9IHBhcnNlSW50KGhleC5zbGljZSgxLCAzKSwgMTYpO1xuICBjb25zdCBnID0gcGFyc2VJbnQoaGV4LnNsaWNlKDMsIDUpLCAxNik7XG4gIGNvbnN0IGIgPSBwYXJzZUludChoZXguc2xpY2UoNSwgNyksIDE2KTtcbiAgaWYgKGFscGhhKSB7XG4gICAgcmV0dXJuIGByZ2JhKCR7cn0sICR7Z30sICR7Yn0sICR7YWxwaGF9KWA7XG4gIH1cbiAgcmV0dXJuIGByZ2IoJHtyfSwgJHtnfSwgJHtifSlgO1xufVxuXG4gLyoqXG4gICogT3BlbmxheWVycyBzdHlsZWZ1bmN0aW9uXG4gICogQGV4dGVybmFsIG9sLlN0eWxlRnVuY3Rpb25cbiAgKiBAc2VlIHtAbGluayBodHRwOi8vb3BlbmxheWVycy5vcmcvZW4vbGF0ZXN0L2FwaWRvYy9vbC5odG1sIy5TdHlsZUZ1bmN0aW9ufVxuICAqL1xuIiwiZnVuY3Rpb24gYWRkUHJvcEFycmF5KG5vZGUsIG9iaiwgcHJvcCkge1xuICBjb25zdCBwcm9wZXJ0eSA9IHByb3AudG9Mb3dlckNhc2UoKTtcbiAgb2JqW3Byb3BlcnR5XSA9IG9ialtwcm9wZXJ0eV0gfHwgW107XG4gIGNvbnN0IGl0ZW0gPSB7fTtcbiAgcmVhZE5vZGUobm9kZSwgaXRlbSk7XG4gIG9ialtwcm9wZXJ0eV0ucHVzaChpdGVtKTtcbn1cblxuZnVuY3Rpb24gYWRkUHJvcChub2RlLCBvYmosIHByb3ApIHtcbiAgY29uc3QgcHJvcGVydHkgPSBwcm9wLnRvTG93ZXJDYXNlKCk7XG4gIG9ialtwcm9wZXJ0eV0gPSB7fTtcbiAgcmVhZE5vZGUobm9kZSwgb2JqW3Byb3BlcnR5XSk7XG59XG5cbmZ1bmN0aW9uIGdldFRleHQoZWxlbWVudCwgdGFnTmFtZSkge1xuICBjb25zdCBjb2xsZWN0aW9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKTtcbiAgcmV0dXJuIChjb2xsZWN0aW9uLmxlbmd0aCkgPyBjb2xsZWN0aW9uLml0ZW0oMCkudGV4dENvbnRlbnQgOiAnJztcbn1cblxuZnVuY3Rpb24gZ2V0Qm9vbChlbGVtZW50LCB0YWdOYW1lKSB7XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpO1xuICBpZiAoY29sbGVjdGlvbi5sZW5ndGgpIHtcbiAgICByZXR1cm4gQm9vbGVhbihjb2xsZWN0aW9uLml0ZW0oMCkudGV4dENvbnRlbnQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuY29uc3QgcGFyc2VycyA9IHtcbiAgTmFtZWRMYXllcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5sYXllcnMgPSBvYmoubGF5ZXJzIHx8IFtdO1xuICAgIGNvbnN0IGxheWVyID0ge1xuICAgICAgLy8gbmFtZTogZ2V0VGV4dChlbGVtZW50LCAnc2xkOk5hbWUnKSxcbiAgICAgIHN0eWxlczogW10sXG4gICAgfTtcbiAgICByZWFkTm9kZShlbGVtZW50LCBsYXllcik7XG4gICAgb2JqLmxheWVycy5wdXNoKGxheWVyKTtcbiAgfSxcbiAgVXNlclN0eWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICAvLyBuYW1lOiBnZXRUZXh0KGVsZW1lbnQsICdzbGQ6TmFtZScpLFxuICAgICAgZGVmYXVsdDogZ2V0Qm9vbChlbGVtZW50LCAnc2xkOklzRGVmYXVsdCcpLFxuICAgICAgZmVhdHVyZXR5cGVzdHlsZXM6IFtdLFxuICAgIH07XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgc3R5bGUpO1xuICAgIG9iai5zdHlsZXMucHVzaChzdHlsZSk7XG4gIH0sXG4gIEZlYXR1cmVUeXBlU3R5bGU6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBjb25zdCBmZWF0dXJldHlwZXN0eWxlID0ge1xuICAgICAgcnVsZXM6IFtdLFxuICAgIH07XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgZmVhdHVyZXR5cGVzdHlsZSk7XG4gICAgb2JqLmZlYXR1cmV0eXBlc3R5bGVzLnB1c2goZmVhdHVyZXR5cGVzdHlsZSk7XG4gIH0sXG4gIFJ1bGU6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBjb25zdCBydWxlID0ge307XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgcnVsZSk7XG4gICAgb2JqLnJ1bGVzLnB1c2gocnVsZSk7XG4gIH0sXG4gIEZpbHRlcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5maWx0ZXIgPSB7fTtcbiAgICByZWFkTm9kZShlbGVtZW50LCBvYmouZmlsdGVyKTtcbiAgfSxcbiAgRWxzZUZpbHRlcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5lbHNlZmlsdGVyID0gdHJ1ZTtcbiAgfSxcbiAgT3I6IGFkZFByb3AsXG4gIEFuZDogYWRkUHJvcCxcbiAgTm90OiBhZGRQcm9wLFxuICBQcm9wZXJ0eUlzRXF1YWxUbzogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzTm90RXF1YWxUbzogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzTGVzc1RoYW46IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0xlc3NUaGFuT3JFcXVhbFRvOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNHcmVhdGVyVGhhbjogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzR3JlYXRlclRoYW5PckVxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlOYW1lOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLnByb3BlcnR5bmFtZSA9IGVsZW1lbnQudGV4dENvbnRlbnQ7XG4gIH0sXG4gIExpdGVyYWw6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmoubGl0ZXJhbCA9IGVsZW1lbnQudGV4dENvbnRlbnQ7XG4gIH0sXG4gIEZlYXR1cmVJZDogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5mZWF0dXJlaWQgPSBvYmouZmVhdHVyZWlkIHx8IFtdO1xuICAgIG9iai5mZWF0dXJlaWQucHVzaChlbGVtZW50LmdldEF0dHJpYnV0ZSgnZmlkJykpO1xuICB9LFxuICBOYW1lOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLm5hbWUgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBNYXhTY2FsZURlbm9taW5hdG9yOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLm1heHNjYWxlZGVub21pbmF0b3IgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBQb2x5Z29uU3ltYm9saXplcjogYWRkUHJvcCxcbiAgTGluZVN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIFBvaW50U3ltYm9saXplcjogYWRkUHJvcCxcbiAgRmlsbDogYWRkUHJvcCxcbiAgU3Ryb2tlOiBhZGRQcm9wLFxuICBFeHRlcm5hbEdyYXBoaWM6IGFkZFByb3AsXG4gIE9ubGluZVJlc291cmNlOiBlbGVtZW50ID0+IGdldFRleHQoZWxlbWVudCwgJ3NsZDpPbmxpbmVSZXNvdXJjZScpLFxuICBDc3NQYXJhbWV0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouY3NzID0gb2JqLmNzcyB8fCBbXTtcbiAgICBvYmouY3NzLnB1c2goe1xuICAgICAgbmFtZTogZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ25hbWUnKSxcbiAgICAgIHZhbHVlOiBlbGVtZW50LnRleHRDb250ZW50LnRyaW0oKSxcbiAgICB9KTtcbiAgfSxcbn07XG5cbmZ1bmN0aW9uIHJlYWROb2RlKG5vZGUsIG9iaikge1xuICBmb3IgKGxldCBuID0gbm9kZS5maXJzdEVsZW1lbnRDaGlsZDsgbjsgbiA9IG4ubmV4dEVsZW1lbnRTaWJsaW5nKSB7XG4gICAgaWYgKHBhcnNlcnNbbi5sb2NhbE5hbWVdKSB7XG4gICAgICBwYXJzZXJzW24ubG9jYWxOYW1lXShuLCBvYmosIG4ubG9jYWxOYW1lKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBvYmplY3QgZnJvbSBhbiBzbGQgeG1sIHN0cmluZywgZm9yIGludGVybmFsIHVzYWdlXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHNsZCB4bWwgc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHlsZWRMYXllckRlc2NyaXB0b3J9ICBvYmplY3QgcmVwcmVzZW50aW5nIHNsZCBzdHlsZVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBSZWFkZXIoc2xkKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG4gIGNvbnN0IGRvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoc2xkLCAnYXBwbGljYXRpb24veG1sJyk7XG5cbiAgZm9yIChsZXQgbiA9IGRvYy5maXJzdENoaWxkOyBuOyBuID0gbi5uZXh0U2libGluZykge1xuICAgIHJlc3VsdC52ZXJzaW9uID0gbi5nZXRBdHRyaWJ1dGUoJ3ZlcnNpb24nKTtcbiAgICByZWFkTm9kZShuLCByZXN1bHQpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxuLyoqXG4gKiBAdHlwZWRlZiBTdHlsZWRMYXllckRlc2NyaXB0b3JcbiAqIEBuYW1lIFN0eWxlZExheWVyRGVzY3JpcHRvclxuICogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgU3R5bGVkTGF5ZXJEZXNjcmlwdG9yIHtAbGluayBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zbGQvMS4xL1N0eWxlZExheWVyRGVzY3JpcHRvci54c2QgeHNkfVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnNpb24gc2xkIHZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7TGF5ZXJbXX0gbGF5ZXJzIGluZm8gZXh0cmFjdGVkIGZyb20gTmFtZWRMYXllciBlbGVtZW50XG4gKi9cblxuLyoqXG4qIEB0eXBlZGVmIExheWVyXG4qIEBuYW1lIExheWVyXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIExheWVyLCB0aGUgYWN0dWFsIHN0eWxlIG9iamVjdCBmb3IgYSBzaW5nbGUgbGF5ZXJcbiogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgbGF5ZXIgbmFtZVxuKiBAcHJvcGVydHkge09iamVjdFtdfSBzdHlsZXMgU2VlIGV4cGxhbmF0aW9uIGF0IFtHZW9zZXJ2ZXIgZG9jc10oaHR0cDovL2RvY3MuZ2Vvc2VydmVyLm9yZy9zdGFibGUvZW4vdXNlci9zdHlsaW5nL3NsZC9yZWZlcmVuY2Uvc3R5bGVzLmh0bWwpXG4qIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gc3R5bGVzW10uZGVmYXVsdFxuKiBAcHJvcGVydHkge0ZlYXR1cmVUeXBlU3R5bGVbXX0gc3R5bGVzW10uZmVhdHVyZXR5cGVzdHlsZXNcbiovXG5cbi8qKlxuKiBAdHlwZWRlZiBGZWF0dXJlVHlwZVN0eWxlXG4qIEBuYW1lIEZlYXR1cmVUeXBlU3R5bGVcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgRmVhdHVyZVR5cGVTdHlsZToge0BsaW5rIGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NlLzEuMS4wL0ZlYXR1cmVTdHlsZS54c2QgeHNkfVxuKiBAcHJvcGVydHkge1J1bGVbXX0gcnVsZXNcbiovXG5cblxuLyoqXG4qIEB0eXBlZGVmIFJ1bGVcbiogQG5hbWUgUnVsZVxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBSdWxlIHRvIG1hdGNoIGEgZmVhdHVyZToge0BsaW5rIGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NlLzEuMS4wL0ZlYXR1cmVTdHlsZS54c2QgeHNkfVxuKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZSBydWxlIG5hbWVcbiogQHByb3BlcnR5IHtGaWx0ZXJ9IFtmaWx0ZXJdXG4qIEBwcm9wZXJ0eSB7Ym9vbGVhbn0gW2Vsc2VmaWx0ZXJdXG4qIEBwcm9wZXJ0eSB7aW50ZWdlcn0gW21pbnNjYWxlZGVub21pbmF0b3JdXG4qIEBwcm9wZXJ0eSB7aW50ZWdlcn0gW21heHNjYWxlZGVub21pbmF0b3JdXG4qIEBwcm9wZXJ0eSB7UG9seWdvblN5bWJvbGl6ZXJ9IFtwb2x5Z29uc3ltYm9saXplcl1cbiogQHByb3BlcnR5IHtMaW5lU3ltYm9saXplcn0gIFtsaW5lc3ltYm9saXplcl1cbiogQHByb3BlcnR5IHtQb2ludFN5bWJvbGl6ZXJ9IFtwb2ludHN5bWJvbGl6ZXJdXG4qICovXG5cbi8qKlxuKiBAdHlwZWRlZiBGaWx0ZXJcbiogQG5hbWUgRmlsdGVyXG4qIEBkZXNjcmlwdGlvbiBbb2djIGZpbHRlcnNdKCBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9maWx0ZXIvMS4xLjAvZmlsdGVyLnhzZCkgc2hvdWxkIGhhdmUgb25seSBvbmUgcHJvcFxuKiBAcHJvcGVydHkge2FycmF5fSBbZmVhdHVyZWlkXSBmaWx0ZXJcbiogQHByb3BlcnR5IHtvYmplY3R9IFtvcl0gIGZpbHRlclxuKiBAcHJvcGVydHkge29iamVjdH0gW2FuZF0gIGZpbHRlclxuKiBAcHJvcGVydHkge29iamVjdH0gW25vdF0gIGZpbHRlclxuKiBAcHJvcGVydHkge2FycmF5fSBbcHJvcGVydHlpc2VxdWFsdG9dICBmaWx0ZXJcbiogKi9cblxuXG4vKipcbiogQHR5cGVkZWYgUG9seWdvblN5bWJvbGl6ZXJcbiogQG5hbWUgUG9seWdvblN5bWJvbGl6ZXJcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgW1BvbHlnb25TeW1ib2xpemVyXShodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9TeW1ib2xpemVyLnhzZClcbiogQHByb3BlcnR5IHtPYmplY3R9IGZpbGxcbiogQHByb3BlcnR5IHthcnJheX0gZmlsbC5jc3NcbiogQHByb3BlcnR5IHtPYmplY3R9IHN0cm9rZVxuKiBAcHJvcGVydHkge2FycmF5fSBzdHJva2UuY3NzXG4qICovXG5cbi8qKlxuKiBAdHlwZWRlZiBMaW5lU3ltYm9saXplclxuKiBAbmFtZSBMaW5lU3ltYm9saXplclxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBbTGluZVN5bWJvbGl6ZXJdKGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NlLzEuMS4wL1N5bWJvbGl6ZXIueHNkKVxuKiBAcHJvcGVydHkge09iamVjdH0gc3Ryb2tlXG4qIEBwcm9wZXJ0eSB7YXJyYXl9IHN0cm9rZS5jc3NcbiogKi9cblxuXG4vKipcbiogQHR5cGVkZWYgUG9pbnRTeW1ib2xpemVyXG4qIEBuYW1lIFBvaW50U3ltYm9saXplclxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBbUG9pbnRTeW1ib2xpemVyXShodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9TeW1ib2xpemVyLnhzZClcbiogQHByb3BlcnR5IHtPYmplY3R9IGdyYXBoaWNcbiogQHByb3BlcnR5IHtPYmplY3R9IGdyYXBoaWMuZXh0ZXJuYWxncmFwaGljXG4qIEBwcm9wZXJ0eSB7c3RyaW5nfSBncmFwaGljLmV4dGVybmFsZ3JhcGhpYy5vbmxpbmVyZXNvdXJjZVxuKiAqL1xuIiwiaW1wb3J0IFJlYWRlciBmcm9tICcuL1JlYWRlcic7XG5cbmNvbnN0IEZpbHRlcnMgPSB7XG4gIGZlYXR1cmVpZDogKHZhbHVlLCBwcm9wcykgPT4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWUubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh2YWx1ZVtpXSA9PT0gcHJvcHMuZmlkKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIG5vdDogKHZhbHVlLCBwcm9wcykgPT4gIWZpbHRlclNlbGVjdG9yKHZhbHVlLCBwcm9wcyksXG4gIG9yOiAodmFsdWUsIHByb3BzKSA9PiB7XG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGlmICh2YWx1ZVtrZXlzW2ldXS5sZW5ndGggPT09IDEgJiYgZmlsdGVyU2VsZWN0b3IodmFsdWUsIHByb3BzLCBpKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAodmFsdWVba2V5c1tpXV0ubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbXVsdGlwbGUgb3BzIG9mIHNhbWUgdHlwZSBub3QgaW1wbGVtZW50ZWQgeWV0Jyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgcHJvcGVydHlpc2VxdWFsdG86ICh2YWx1ZSwgcHJvcHMpID0+IChwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0gJiZcbiAgICBwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0gPT09IHZhbHVlWycwJ10ubGl0ZXJhbCksXG4gIHByb3BlcnR5aXNsZXNzdGhhbjogKHZhbHVlLCBwcm9wcykgPT4gKHByb3BzW3ZhbHVlWycwJ10ucHJvcGVydHluYW1lXSAmJlxuICAgIE51bWJlcihwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0pIDwgTnVtYmVyKHZhbHVlWycwJ10ubGl0ZXJhbCkpLFxufTtcblxuLyoqXG4gKiBbZmlsdGVyU2VsZWN0b3IgZGVzY3JpcHRpb25dXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7RmlsdGVyfSBmaWx0ZXJcbiAqIEBwYXJhbSAge29iamVjdH0gcHJvcGVydGllcyBmZWF0dXJlIHByb3BlcnRpZXNcbiAqIEBwYXJhbSB7bnVtYmVyfSBrZXkgaW5kZXggb2YgcHJvcGVydHkgdG8gdXNlXG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBmaWx0ZXJTZWxlY3RvcihmaWx0ZXIsIHByb3BlcnRpZXMsIGtleSA9IDApIHtcbiAgY29uc3QgdHlwZSA9IE9iamVjdC5rZXlzKGZpbHRlcilba2V5XTtcbiAgaWYgKEZpbHRlcnNbdHlwZV0pIHtcbiAgICBpZiAoRmlsdGVyc1t0eXBlXShmaWx0ZXJbdHlwZV0sIHByb3BlcnRpZXMpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtvd24gZmlsdGVyICR7dHlwZX1gKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogW3NjYWxlU2VsZWN0b3IgZGVzY3JpcHRpb25dXG4gKiBUaGUgXCJzdGFuZGFyZGl6ZWQgcmVuZGVyaW5nIHBpeGVsIHNpemVcIiBpcyBkZWZpbmVkIHRvIGJlIDAuMjhtbSDDlyAwLjI4bW1cbiAqIEBwYXJhbSAge1J1bGV9IHJ1bGVcbiAqIEBwYXJhbSAge251bWJlcn0gcmVzb2x1dGlvbiAgbS9weFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gc2NhbGVTZWxlY3RvcihydWxlLCByZXNvbHV0aW9uKSB7XG4gIGlmIChydWxlLm1heHNjYWxlZGVub21pbmF0b3IgIT09IHVuZGVmaW5lZCAmJiBydWxlLm1pbnNjYWxlZGVub21pbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICgocmVzb2x1dGlvbiAvIDAuMDAwMjgpIDwgcnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yICYmXG4gICAgICAocmVzb2x1dGlvbiAvIDAuMDAwMjgpID4gcnVsZS5taW5zY2FsZWRlbm9taW5hdG9yKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChydWxlLm1heHNjYWxlZGVub21pbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAoKHJlc29sdXRpb24gLyAwLjAwMDI4KSA8IHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvcik7XG4gIH1cbiAgaWYgKHJ1bGUubWluc2NhbGVkZW5vbWluYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICgocmVzb2x1dGlvbiAvIDAuMDAwMjgpID4gcnVsZS5taW5zY2FsZWRlbm9taW5hdG9yKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGxpYnJhcnkgc3BlY2lmaWMgc3R5bGUgY2xhc3Nlc1xuICogQWZ0ZXIgY3JlYXRpbmcgYW4gaW5zdGFuY2UgeW91IHNob3VsZCBjYWxsIHRoZSByZWFkIG1ldGhvZC5cbiAqL1xuY2xhc3MgU3R5bGUge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuZ2V0UnVsZXMgPSB0aGlzLmdldFJ1bGVzLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmVhZCB4bWwgZmlsZVxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNsZCB4bWwgc3RyaW5nXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGF5ZXJuYW1lXSBTZWxlY3QgbGF5ZXIgbWF0Y2hpbmcgY2FzZSBpbnNlbnNpdGl2ZSwgZGVmYXVsdHMgdG8gZmlyc3QgbGF5ZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZW5hbWVdIFNlbGVjdCBzdHlsZSBjYXNlIGluc2Vuc2l0aXZlLCBkZWZhdWx0cyB0byBmaXJzdCBzdHlsZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cbiAgcmVhZChzbGQsIGxheWVybmFtZSwgc3R5bGVuYW1lKSB7XG4gICAgdGhpcy5zbGQgPSBSZWFkZXIoc2xkKTtcbiAgICB0aGlzLnNldFN0eWxlKGxheWVybmFtZSwgc3R5bGVuYW1lKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBpcyBsYXllciBkZWZpbmVkIGluIHNsZD9cbiAgICogQHJldHVybiB7Qm9vbGVhbn0gW2Rlc2NyaXB0aW9uXVxuICAgKi9cbiAgaGFzTGF5ZXIobGF5ZXJuYW1lKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLnNsZC5sYXllcnMuZmluZEluZGV4KGwgPT5cbiAgICAgIChsLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbGF5ZXJuYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgICByZXR1cm4gKGluZGV4ID4gLTEpO1xuICB9XG4gIC8qKlxuICAgKiBDaGFuZ2Ugc2VsZWN0ZWQgbGF5ZXIgYW5kIHN0eWxlIGZyb20gc2xkIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xheWVybmFtZV0gIFNlbGVjdCBsYXllciBtYXRjaGluZyBsb3dlcmNhc2VkIGxheWVybmFtZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3N0eWxlbmFtZV0gc3R5bGUgdG8gdXNlXG4gICAqL1xuICBzZXRTdHlsZShsYXllcm5hbWUsIHN0eWxlbmFtZSkge1xuICAgIGxldCBmaWx0ZXJlZGxheWVycztcbiAgICBpZiAobGF5ZXJuYW1lKSB7XG4gICAgICBmaWx0ZXJlZGxheWVycyA9IHRoaXMuc2xkLmxheWVycy5maWx0ZXIobCA9PlxuICAgICAgICAobC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGxheWVybmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgICBpZiAoIWZpbHRlcmVkbGF5ZXJzLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBFcnJvcihgbGF5ZXIgJHtsYXllcm5hbWV9IG5vdCBmb3VuZCBpbiBzbGRgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5sYXllciA9IChmaWx0ZXJlZGxheWVycykgPyBmaWx0ZXJlZGxheWVyc1snMCddIDogdGhpcy5zbGQubGF5ZXJzWycwJ107XG4gICAgdGhpcy5zdHlsZSA9IHRoaXMubGF5ZXIuc3R5bGVzLmZpbHRlcihzID0+ICgoc3R5bGVuYW1lKSA/IChzLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gc3R5bGVuYW1lLnRvTG93ZXJDYXNlKCkpIDogcy5kZWZhdWx0KSlbJzAnXTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIGdldCBzbGQgcnVsZXMgZm9yIGZlYXR1cmVcbiAgICogQHBhcmFtICB7T2JqZWN0fSBwcm9wZXJ0aWVzIGZlYXR1cmUgcHJvcGVydGllc1xuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzb2x1dGlvbiB1bml0L3B4XG4gICAqIEByZXR1cm4ge1J1bGV9IGZpbHRlcmVkIHNsZCBydWxlc1xuICAgKi9cbiAgZ2V0UnVsZXMocHJvcGVydGllcywgcmVzb2x1dGlvbikge1xuICAgIGlmICghdGhpcy5zdHlsZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXQgYSBzdHlsZSB0byB1c2UnKTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgY29uc3QgRmVhdHVyZVR5cGVTdHlsZUxlbmd0aCA9IHRoaXMuc3R5bGUuZmVhdHVyZXR5cGVzdHlsZXMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgRmVhdHVyZVR5cGVTdHlsZUxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBjb25zdCBmdHR5cGVzdHlsZSA9IHRoaXMuc3R5bGUuZmVhdHVyZXR5cGVzdHlsZXNbaV07XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGZ0dHlwZXN0eWxlLnJ1bGVzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgICAgIGNvbnN0IHJ1bGUgPSBmdHR5cGVzdHlsZS5ydWxlc1tqXTtcbiAgICAgICAgaWYgKHJ1bGUuZmlsdGVyICYmIHNjYWxlU2VsZWN0b3IocnVsZSwgcmVzb2x1dGlvbikgJiZcbiAgICAgICAgICBmaWx0ZXJTZWxlY3RvcihydWxlLmZpbHRlciwgcHJvcGVydGllcykpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChydWxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChydWxlLmVsc2VmaWx0ZXIgJiYgcmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKCFydWxlLmVsc2VmaWx0ZXIgJiYgIXJ1bGUuZmlsdGVyKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2gocnVsZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IFN0eWxlO1xuIiwiaW1wb3J0IE9sU0xEU3R5bGUgZnJvbSAnLi9PbFNMRFN0eWxlJztcblxuXG5leHBvcnQgeyBPbFNMRFN0eWxlIH07XG4iLCIvKipcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0gIHtSdWxlW119IHJ1bGVzIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge29iamVjdH0gICAgICAgc2VlIGxlYWZsZXQgcGF0aCBmb3IgaW5zcGlyYXRpb25cbiAqL1xuZnVuY3Rpb24gcnVsZXNDb252ZXJ0ZXIocnVsZXMpIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAocnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIgJiYgcnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIuZmlsbCkge1xuICAgICAgY29uc3QgZmlsbCA9IHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLmZpbGw7XG4gICAgICBmaWxsUnVsZXMoZmlsbCwgcmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyICYmIHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLnN0cm9rZSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gcnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIuc3Ryb2tlO1xuICAgICAgc3Ryb2tlUnVsZXMoc3Ryb2tlLCByZXN1bHQpO1xuICAgIH1cbiAgICBpZiAocnVsZXNbaV0ubGluZXN5bWJvbGl6ZXIgJiYgcnVsZXNbaV0ubGluZXN5bWJvbGl6ZXIuc3Ryb2tlKSB7XG4gICAgICBjb25zdCBzdHJva2UgPSBydWxlc1tpXS5saW5lc3ltYm9saXplci5zdHJva2U7XG4gICAgICBzdHJva2VSdWxlcyhzdHJva2UsIHJlc3VsdCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHN0cm9rZVJ1bGVzKHN0cm9rZSwgcmVzdWx0KSB7XG4gIGZvciAobGV0IGogPSAwOyBqIDwgc3Ryb2tlLmNzcy5sZW5ndGg7IGogKz0gMSkge1xuICAgIHN3aXRjaCAoc3Ryb2tlLmNzc1tqXS5uYW1lKSB7XG4gICAgICBjYXNlICdzdHJva2UnOlxuICAgICAgICByZXN1bHQuc3Ryb2tlQ29sb3IgPSBzdHJva2UuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgY29uc3Qga2V5ID0gc3Ryb2tlLmNzc1tqXS5uYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvLSguKS9nLCAobWF0Y2gsIGdyb3VwMSkgPT4gZ3JvdXAxLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICByZXN1bHRba2V5XSA9IHN0cm9rZS5jc3Nbal0udmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogW2ZpbGwgZGVzY3JpcHRpb25dXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7b2JqZWN0fSBmaWxsIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7b2JqZWN0fSByZXN1bHQgcHJvcHMgd2lsbCBiZSBhZGRlZCB0b1xuICogQHJldHVybiB7dm9pZH0gICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbGxSdWxlcyhmaWxsLCByZXN1bHQpIHtcbiAgZm9yIChsZXQgaiA9IDA7IGogPCBmaWxsLmNzcy5sZW5ndGg7IGogKz0gMSkge1xuICAgIHN3aXRjaCAoZmlsbC5jc3Nbal0ubmFtZSkge1xuICAgICAgY2FzZSAnZmlsbCc6XG4gICAgICAgIHJlc3VsdC5maWxsQ29sb3IgPSBmaWxsLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdmaWxsLW9wYWNpdHknOlxuICAgICAgICByZXN1bHQuZmlsbE9wYWNpdHkgPSBmaWxsLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHJ1bGVzQ29udmVydGVyO1xuIl19
