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
        color: style.fillColor
      });
      var stroke = new _openlayers2.default.style.Stroke({
        color: style.strokeColor,
        width: style.strokeWidth
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
  }
  return result;
}

function strokeRules(stroke, result) {
  for (var j = 0; j < stroke.css.length; j += 1) {
    switch (stroke.css[j].name) {
      case 'stroke':
        result.strokeColor = stroke.css[j].value;
        break;
      case 'stroke-opacity':
        result.strokeOpacity = stroke.css[j].value;
        break;
      case 'stroke-width':
        result.strokeWidth = stroke.css[j].value;
        break;
      default:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvT2xTTERTdHlsZS5qcyIsInNyYy9SZWFkZXIuanMiLCJzcmMvU3R5bGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvcnVsZXNDb252ZXJ0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FDSUE7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBR0E7OztJQUdNLFU7OztBQUNKLHdCQUFjO0FBQUE7O0FBQUE7O0FBRVosVUFBSyxhQUFMLEdBQXFCLE1BQUssYUFBTCxDQUFtQixJQUFuQixPQUFyQjtBQUZZO0FBR2I7O0FBRUQ7Ozs7Ozs7Ozs7O2tDQU9jLE8sRUFBUyxVLEVBQVk7QUFDakMsVUFBTSxRQUFRLFFBQVEsYUFBUixFQUFkO0FBQ0EsWUFBTSxHQUFOLEdBQVksUUFBUSxLQUFSLEVBQVo7QUFDQSxVQUFNLFFBQVEsS0FBSyxRQUFMLENBQWMsS0FBZCxFQUFxQixVQUFyQixDQUFkO0FBQ0EsVUFBTSxRQUFRLDhCQUFlLEtBQWYsQ0FBZDtBQUNBLFVBQU0sT0FBTyxvQ0FBVztBQUN0QixlQUFPLE1BQU07QUFEUyxPQUFYLENBQWI7QUFHQSxVQUFNLFNBQVMsc0NBQWE7QUFDMUIsZUFBTyxNQUFNLFdBRGE7QUFFMUIsZUFBTyxNQUFNO0FBRmEsT0FBYixDQUFmO0FBSUEsVUFBTSxTQUFTLENBQ2IscUNBQVk7QUFDVixlQUFPLHNDQUFhO0FBQ2xCLG9CQURrQjtBQUVsQix3QkFGa0I7QUFHbEIsa0JBQVE7QUFIVSxTQUFiLENBREc7QUFNVixrQkFOVTtBQU9WO0FBUFUsT0FBWixDQURhLENBQWY7QUFXQSxhQUFPLE1BQVA7QUFDRDs7Ozs7O2tCQUtZLFU7O0FBR2Q7Ozs7Ozs7Ozs7Ozs7O2tCQ2dFdUIsTTtBQXhIeEIsU0FBUyxZQUFULENBQXNCLElBQXRCLEVBQTRCLEdBQTVCLEVBQWlDLElBQWpDLEVBQXVDO0FBQ3JDLE1BQU0sV0FBVyxLQUFL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QixNQUFwQjtBQUNEO0FBQ0Y7QUFDRCxTQUFPLE1BQVA7QUFDRDs7QUFFRCxTQUFTLFdBQVQsQ0FBcUIsTUFBckIsRUFBNkIsTUFBN0IsRUFBcUM7QUFDbkMsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE9BQU8sR0FBUCxDQUFXLE1BQS9CLEVBQXVDLEtBQUssQ0FBNUMsRUFBK0M7QUFDN0MsWUFBUSxPQUFPLEdBQVAsQ0FBVyxDQUFYLEVBQWMsSUFBdEI7QUFDRSxXQUFLLFFBQUw7QUFDRSxlQUFPLFdBQVAsR0FBcUIsT0FBTyxHQUFQLENBQVcsQ0FBWCxFQUFjLEtBQW5DO0FBQ0E7QUFDRixXQUFLLGdCQUFMO0FBQ0UsZUFBTyxhQUFQLEdBQXVCLE9BQU8sR0FBUCxDQUFXLENBQVgsRUFBYyxLQUFyQztBQUNBO0FBQ0YsV0FBSyxjQUFMO0FBQ0UsZUFBTyxXQUFQLEdBQXFCLE9BQU8sR0FBUCxDQUFXLENBQVgsRUFBYyxLQUFuQztBQUNBO0FBQ0Y7QUFWRjtBQVlEO0FBQ0Y7O0FBRUQ7Ozs7Ozs7QUFPQSxTQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUIsTUFBekIsRUFBaUM7QUFDL0IsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLEtBQUssR0FBTCxDQUFTLE1BQTdCLEVBQXFDLEtBQUssQ0FBMUMsRUFBNkM7QUFDM0MsWUFBUSxLQUFLLEdBQUwsQ0FBUyxDQUFULEVBQVksSUFBcEI7QUFDRSxXQUFLLE1BQUw7QUFDRSxlQUFPLFNBQVAsR0FBbUIsS0FBSyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQS9CO0FBQ0E7QUFDRixXQUFLLGNBQUw7QUFDRSxlQUFPLFdBQVAsR0FBcUIsS0FBSyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQWpDO0FBQ0E7QUFDRjtBQVBGO0FBU0Q7QUFDRjs7a0JBR2MsYyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgT2xTdHlsZSBmcm9tICdvbC9zdHlsZS9zdHlsZSc7XG5pbXBvcnQgT2xGaWxsIGZyb20gJ29sL3N0eWxlL2ZpbGwnO1xuaW1wb3J0IE9sQ2lyY2xlIGZyb20gJ29sL3N0eWxlL2NpcmNsZSc7XG5pbXBvcnQgT2xTdHJva2UgZnJvbSAnb2wvc3R5bGUvc3Ryb2tlJztcbmltcG9ydCBTdHlsZSBmcm9tICcuL1N0eWxlJztcbmltcG9ydCBydWxlc0NvbnZlcnRlciBmcm9tICcuL3J1bGVzQ29udmVydGVyJztcblxuXG4vKipcbiAqIFRoZSBPbFNMRFN0eWxlIGNsYXNzIGlzIHRoZSBlbnRyeSBwb2ludCBmb3Igb3BlbmxheWVycyB1c2Vycy5cbiAqL1xuY2xhc3MgT2xTTERTdHlsZSBleHRlbmRzIFN0eWxlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnN0eWxlRnVuY3Rpb24gPSB0aGlzLnN0eWxlRnVuY3Rpb24uYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbiBvbC5zdHlsZUZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7b2wuRmVhdHVyZX0gZmVhdHVyZSBvcGVubGF5ZXJzIGZlYXR1cmUgdG8gc3R5bGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc29sdXRpb24gdmlld3MgcmVzb2x1dGlvbiBpbiBtZXRlcnMvcHgsIHJlY2FsY3VsYXRlIGlmIHlvdXJcbiAgICogbGF5ZXIgdXNlIGRpZmZlcmVudCB1bml0cyFcbiAgICogQHJldHVybiB7b2wuc3R5bGUuU3R5bGV9IG9wZW5sYXllcnMgc3R5bGVcbiAgICovXG4gIHN0eWxlRnVuY3Rpb24oZmVhdHVyZSwgcmVzb2x1dGlvbikge1xuICAgIGNvbnN0IHByb3BzID0gZmVhdHVyZS5nZXRQcm9wZXJ0aWVzKCk7XG4gICAgcHJvcHMuZmlkID0gZmVhdHVyZS5nZXRJZCgpO1xuICAgIGNvbnN0IHJ1bGVzID0gdGhpcy5nZXRSdWxlcyhwcm9wcywgcmVzb2x1dGlvbik7XG4gICAgY29uc3Qgc3R5bGUgPSBydWxlc0NvbnZlcnRlcihydWxlcyk7XG4gICAgY29uc3QgZmlsbCA9IG5ldyBPbEZpbGwoe1xuICAgICAgY29sb3I6IHN0eWxlLmZpbGxDb2xvcixcbiAgICB9KTtcbiAgICBjb25zdCBzdHJva2UgPSBuZXcgT2xTdHJva2Uoe1xuICAgICAgY29sb3I6IHN0eWxlLnN0cm9rZUNvbG9yLFxuICAgICAgd2lkdGg6IHN0eWxlLnN0cm9rZVdpZHRoLFxuICAgIH0pO1xuICAgIGNvbnN0IHN0eWxlcyA9IFtcbiAgICAgIG5ldyBPbFN0eWxlKHtcbiAgICAgICAgaW1hZ2U6IG5ldyBPbENpcmNsZSh7XG4gICAgICAgICAgZmlsbCxcbiAgICAgICAgICBzdHJva2UsXG4gICAgICAgICAgcmFkaXVzOiA1LFxuICAgICAgICB9KSxcbiAgICAgICAgZmlsbCxcbiAgICAgICAgc3Ryb2tlLFxuICAgICAgfSksXG4gICAgXTtcbiAgICByZXR1cm4gc3R5bGVzO1xuICB9XG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBPbFNMRFN0eWxlO1xuXG5cbiAvKipcbiAgKiBPcGVubGF5ZXJzIHN0eWxlZnVuY3Rpb25cbiAgKiBAZXh0ZXJuYWwgb2wuU3R5bGVGdW5jdGlvblxuICAqIEBzZWUge0BsaW5rIGh0dHA6Ly9vcGVubGF5ZXJzLm9yZy9lbi9sYXRlc3QvYXBpZG9jL29sLmh0bWwjLlN0eWxlRnVuY3Rpb259XG4gICovXG4iLCJmdW5jdGlvbiBhZGRQcm9wQXJyYXkobm9kZSwgb2JqLCBwcm9wKSB7XG4gIGNvbnN0IHByb3BlcnR5ID0gcHJvcC50b0xvd2VyQ2FzZSgpO1xuICBvYmpbcHJvcGVydHldID0gb2JqW3Byb3BlcnR5XSB8fCBbXTtcbiAgY29uc3QgaXRlbSA9IHt9O1xuICByZWFkTm9kZShub2RlLCBpdGVtKTtcbiAgb2JqW3Byb3BlcnR5XS5wdXNoKGl0ZW0pO1xufVxuXG5mdW5jdGlvbiBhZGRQcm9wKG5vZGUsIG9iaiwgcHJvcCkge1xuICBjb25zdCBwcm9wZXJ0eSA9IHByb3AudG9Mb3dlckNhc2UoKTtcbiAgb2JqW3Byb3BlcnR5XSA9IHt9O1xuICByZWFkTm9kZShub2RlLCBvYmpbcHJvcGVydHldKTtcbn1cblxuZnVuY3Rpb24gZ2V0VGV4dChlbGVtZW50LCB0YWdOYW1lKSB7XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpO1xuICByZXR1cm4gKGNvbGxlY3Rpb24ubGVuZ3RoKSA/IGNvbGxlY3Rpb24uaXRlbSgwKS50ZXh0Q29udGVudCA6ICcnO1xufVxuXG5mdW5jdGlvbiBnZXRCb29sKGVsZW1lbnQsIHRhZ05hbWUpIHtcbiAgY29uc3QgY29sbGVjdGlvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSk7XG4gIGlmIChjb2xsZWN0aW9uLmxlbmd0aCkge1xuICAgIHJldHVybiBCb29sZWFuKGNvbGxlY3Rpb24uaXRlbSgwKS50ZXh0Q29udGVudCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5jb25zdCBwYXJzZXJzID0ge1xuICBOYW1lZExheWVyOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmxheWVycyA9IG9iai5sYXllcnMgfHwgW107XG4gICAgY29uc3QgbGF5ZXIgPSB7XG4gICAgICAvLyBuYW1lOiBnZXRUZXh0KGVsZW1lbnQsICdzbGQ6TmFtZScpLFxuICAgICAgc3R5bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIGxheWVyKTtcbiAgICBvYmoubGF5ZXJzLnB1c2gobGF5ZXIpO1xuICB9LFxuICBVc2VyU3R5bGU6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgIC8vIG5hbWU6IGdldFRleHQoZWxlbWVudCwgJ3NsZDpOYW1lJyksXG4gICAgICBkZWZhdWx0OiBnZXRCb29sKGVsZW1lbnQsICdzbGQ6SXNEZWZhdWx0JyksXG4gICAgICBmZWF0dXJldHlwZXN0eWxlczogW10sXG4gICAgfTtcbiAgICByZWFkTm9kZShlbGVtZW50LCBzdHlsZSk7XG4gICAgb2JqLnN0eWxlcy5wdXNoKHN0eWxlKTtcbiAgfSxcbiAgRmVhdHVyZVR5cGVTdHlsZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIGNvbnN0IGZlYXR1cmV0eXBlc3R5bGUgPSB7XG4gICAgICBydWxlczogW10sXG4gICAgfTtcbiAgICByZWFkTm9kZShlbGVtZW50LCBmZWF0dXJldHlwZXN0eWxlKTtcbiAgICBvYmouZmVhdHVyZXR5cGVzdHlsZXMucHVzaChmZWF0dXJldHlwZXN0eWxlKTtcbiAgfSxcbiAgUnVsZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIGNvbnN0IHJ1bGUgPSB7fTtcbiAgICByZWFkTm9kZShlbGVtZW50LCBydWxlKTtcbiAgICBvYmoucnVsZXMucHVzaChydWxlKTtcbiAgfSxcbiAgRmlsdGVyOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmZpbHRlciA9IHt9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIG9iai5maWx0ZXIpO1xuICB9LFxuICBFbHNlRmlsdGVyOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmVsc2VmaWx0ZXIgPSB0cnVlO1xuICB9LFxuICBPcjogYWRkUHJvcCxcbiAgQW5kOiBhZGRQcm9wLFxuICBOb3Q6IGFkZFByb3AsXG4gIFByb3BlcnR5SXNFcXVhbFRvOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNOb3RFcXVhbFRvOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNMZXNzVGhhbjogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzTGVzc1RoYW5PckVxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0dyZWF0ZXJUaGFuOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNHcmVhdGVyVGhhbk9yRXF1YWxUbzogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eU5hbWU6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmoucHJvcGVydHluYW1lID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgTGl0ZXJhbDogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5saXRlcmFsID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgRmVhdHVyZUlkOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmZlYXR1cmVpZCA9IG9iai5mZWF0dXJlaWQgfHwgW107XG4gICAgb2JqLmZlYXR1cmVpZC5wdXNoKGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdmaWQnKSk7XG4gIH0sXG4gIE5hbWU6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmoubmFtZSA9IGVsZW1lbnQudGV4dENvbnRlbnQ7XG4gIH0sXG4gIE1heFNjYWxlRGVub21pbmF0b3I6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmoubWF4c2NhbGVkZW5vbWluYXRvciA9IGVsZW1lbnQudGV4dENvbnRlbnQ7XG4gIH0sXG4gIFBvbHlnb25TeW1ib2xpemVyOiBhZGRQcm9wLFxuICBMaW5lU3ltYm9saXplcjogYWRkUHJvcCxcbiAgUG9pbnRTeW1ib2xpemVyOiBhZGRQcm9wLFxuICBGaWxsOiBhZGRQcm9wLFxuICBTdHJva2U6IGFkZFByb3AsXG4gIEV4dGVybmFsR3JhcGhpYzogYWRkUHJvcCxcbiAgT25saW5lUmVzb3VyY2U6IGVsZW1lbnQgPT4gZ2V0VGV4dChlbGVtZW50LCAnc2xkOk9ubGluZVJlc291cmNlJyksXG4gIENzc1BhcmFtZXRlcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5jc3MgPSBvYmouY3NzIHx8IFtdO1xuICAgIG9iai5jc3MucHVzaCh7XG4gICAgICBuYW1lOiBlbGVtZW50LmdldEF0dHJpYnV0ZSgnbmFtZScpLFxuICAgICAgdmFsdWU6IGVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpLFxuICAgIH0pO1xuICB9LFxufTtcblxuZnVuY3Rpb24gcmVhZE5vZGUobm9kZSwgb2JqKSB7XG4gIGZvciAobGV0IG4gPSBub2RlLmZpcnN0RWxlbWVudENoaWxkOyBuOyBuID0gbi5uZXh0RWxlbWVudFNpYmxpbmcpIHtcbiAgICBpZiAocGFyc2Vyc1tuLmxvY2FsTmFtZV0pIHtcbiAgICAgIHBhcnNlcnNbbi5sb2NhbE5hbWVdKG4sIG9iaiwgbi5sb2NhbE5hbWUpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIG9iamVjdCBmcm9tIGFuIHNsZCB4bWwgc3RyaW5nLCBmb3IgaW50ZXJuYWwgdXNhZ2VcbiAqIEBwYXJhbSAge3N0cmluZ30gc2xkIHhtbCBzdHJpbmdcbiAqIEByZXR1cm4ge1N0eWxlZExheWVyRGVzY3JpcHRvcn0gIG9iamVjdCByZXByZXNlbnRpbmcgc2xkIHN0eWxlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJlYWRlcihzbGQpIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcbiAgY29uc3QgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhzbGQsICdhcHBsaWNhdGlvbi94bWwnKTtcblxuICBmb3IgKGxldCBuID0gZG9jLmZpcnN0Q2hpbGQ7IG47IG4gPSBuLm5leHRTaWJsaW5nKSB7XG4gICAgcmVzdWx0LnZlcnNpb24gPSBuLmdldEF0dHJpYnV0ZSgndmVyc2lvbicpO1xuICAgIHJlYWROb2RlKG4sIHJlc3VsdCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG4vKipcbiAqIEB0eXBlZGVmIFN0eWxlZExheWVyRGVzY3JpcHRvclxuICogQG5hbWUgU3R5bGVkTGF5ZXJEZXNjcmlwdG9yXG4gKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBTdHlsZWRMYXllckRlc2NyaXB0b3Ige0BsaW5rIGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NsZC8xLjEvU3R5bGVkTGF5ZXJEZXNjcmlwdG9yLnhzZCB4c2R9XG4gKiBAcHJvcGVydHkge3N0cmluZ30gdmVyc2lvbiBzbGQgdmVyc2lvblxuICogQHByb3BlcnR5IHtMYXllcltdfSBsYXllcnMgaW5mbyBleHRyYWN0ZWQgZnJvbSBOYW1lZExheWVyIGVsZW1lbnRcbiAqL1xuXG4vKipcbiogQHR5cGVkZWYgTGF5ZXJcbiogQG5hbWUgTGF5ZXJcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgTGF5ZXIsIHRoZSBhY3R1YWwgc3R5bGUgb2JqZWN0IGZvciBhIHNpbmdsZSBsYXllclxuKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZSBsYXllciBuYW1lXG4qIEBwcm9wZXJ0eSB7T2JqZWN0W119IHN0eWxlcyBTZWUgZXhwbGFuYXRpb24gYXQgW0dlb3NlcnZlciBkb2NzXShodHRwOi8vZG9jcy5nZW9zZXJ2ZXIub3JnL3N0YWJsZS9lbi91c2VyL3N0eWxpbmcvc2xkL3JlZmVyZW5jZS9zdHlsZXMuaHRtbClcbiogQHByb3BlcnR5IHtCb29sZWFufSBzdHlsZXNbXS5kZWZhdWx0XG4qIEBwcm9wZXJ0eSB7RmVhdHVyZVR5cGVTdHlsZVtdfSBzdHlsZXNbXS5mZWF0dXJldHlwZXN0eWxlc1xuKi9cblxuLyoqXG4qIEB0eXBlZGVmIEZlYXR1cmVUeXBlU3R5bGVcbiogQG5hbWUgRmVhdHVyZVR5cGVTdHlsZVxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBGZWF0dXJlVHlwZVN0eWxlOiB7QGxpbmsgaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvRmVhdHVyZVN0eWxlLnhzZCB4c2R9XG4qIEBwcm9wZXJ0eSB7UnVsZVtdfSBydWxlc1xuKi9cblxuXG4vKipcbiogQHR5cGVkZWYgUnVsZVxuKiBAbmFtZSBSdWxlXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFJ1bGUgdG8gbWF0Y2ggYSBmZWF0dXJlOiB7QGxpbmsgaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvRmVhdHVyZVN0eWxlLnhzZCB4c2R9XG4qIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lIHJ1bGUgbmFtZVxuKiBAcHJvcGVydHkge0ZpbHRlcn0gW2ZpbHRlcl1cbiogQHByb3BlcnR5IHtib29sZWFufSBbZWxzZWZpbHRlcl1cbiogQHByb3BlcnR5IHtpbnRlZ2VyfSBbbWluc2NhbGVkZW5vbWluYXRvcl1cbiogQHByb3BlcnR5IHtpbnRlZ2VyfSBbbWF4c2NhbGVkZW5vbWluYXRvcl1cbiogQHByb3BlcnR5IHtQb2x5Z29uU3ltYm9saXplcn0gW3BvbHlnb25zeW1ib2xpemVyXVxuKiBAcHJvcGVydHkge0xpbmVTeW1ib2xpemVyfSAgW2xpbmVzeW1ib2xpemVyXVxuKiBAcHJvcGVydHkge1BvaW50U3ltYm9saXplcn0gW3BvaW50c3ltYm9saXplcl1cbiogKi9cblxuLyoqXG4qIEB0eXBlZGVmIEZpbHRlclxuKiBAbmFtZSBGaWx0ZXJcbiogQGRlc2NyaXB0aW9uIFtvZ2MgZmlsdGVyc10oIGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L2ZpbHRlci8xLjEuMC9maWx0ZXIueHNkKSBzaG91bGQgaGF2ZSBvbmx5IG9uZSBwcm9wXG4qIEBwcm9wZXJ0eSB7YXJyYXl9IFtmZWF0dXJlaWRdIGZpbHRlclxuKiBAcHJvcGVydHkge29iamVjdH0gW29yXSAgZmlsdGVyXG4qIEBwcm9wZXJ0eSB7b2JqZWN0fSBbYW5kXSAgZmlsdGVyXG4qIEBwcm9wZXJ0eSB7b2JqZWN0fSBbbm90XSAgZmlsdGVyXG4qIEBwcm9wZXJ0eSB7YXJyYXl9IFtwcm9wZXJ0eWlzZXF1YWx0b10gIGZpbHRlclxuKiAqL1xuXG5cbi8qKlxuKiBAdHlwZWRlZiBQb2x5Z29uU3ltYm9saXplclxuKiBAbmFtZSBQb2x5Z29uU3ltYm9saXplclxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBbUG9seWdvblN5bWJvbGl6ZXJdKGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NlLzEuMS4wL1N5bWJvbGl6ZXIueHNkKVxuKiBAcHJvcGVydHkge09iamVjdH0gZmlsbFxuKiBAcHJvcGVydHkge2FycmF5fSBmaWxsLmNzc1xuKiBAcHJvcGVydHkge09iamVjdH0gc3Ryb2tlXG4qIEBwcm9wZXJ0eSB7YXJyYXl9IHN0cm9rZS5jc3NcbiogKi9cblxuLyoqXG4qIEB0eXBlZGVmIExpbmVTeW1ib2xpemVyXG4qIEBuYW1lIExpbmVTeW1ib2xpemVyXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFtMaW5lU3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBzdHJva2VcbiogQHByb3BlcnR5IHthcnJheX0gc3Ryb2tlLmNzc1xuKiAqL1xuXG5cbi8qKlxuKiBAdHlwZWRlZiBQb2ludFN5bWJvbGl6ZXJcbiogQG5hbWUgUG9pbnRTeW1ib2xpemVyXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFtQb2ludFN5bWJvbGl6ZXJdKGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NlLzEuMS4wL1N5bWJvbGl6ZXIueHNkKVxuKiBAcHJvcGVydHkge09iamVjdH0gZ3JhcGhpY1xuKiBAcHJvcGVydHkge09iamVjdH0gZ3JhcGhpYy5leHRlcm5hbGdyYXBoaWNcbiogQHByb3BlcnR5IHtzdHJpbmd9IGdyYXBoaWMuZXh0ZXJuYWxncmFwaGljLm9ubGluZXJlc291cmNlXG4qICovXG4iLCJpbXBvcnQgUmVhZGVyIGZyb20gJy4vUmVhZGVyJztcblxuY29uc3QgRmlsdGVycyA9IHtcbiAgZmVhdHVyZWlkOiAodmFsdWUsIHByb3BzKSA9PiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZS5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgaWYgKHZhbHVlW2ldID09PSBwcm9wcy5maWQpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgbm90OiAodmFsdWUsIHByb3BzKSA9PiAhZmlsdGVyU2VsZWN0b3IodmFsdWUsIHByb3BzKSxcbiAgb3I6ICh2YWx1ZSwgcHJvcHMpID0+IHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgaWYgKHZhbHVlW2tleXNbaV1dLmxlbmd0aCA9PT0gMSAmJiBmaWx0ZXJTZWxlY3Rvcih2YWx1ZSwgcHJvcHMsIGkpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIGlmICh2YWx1ZVtrZXlzW2ldXS5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtdWx0aXBsZSBvcHMgb2Ygc2FtZSB0eXBlIG5vdCBpbXBsZW1lbnRlZCB5ZXQnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBwcm9wZXJ0eWlzZXF1YWx0bzogKHZhbHVlLCBwcm9wcykgPT4gKHByb3BzW3ZhbHVlWycwJ10ucHJvcGVydHluYW1lXSAmJlxuICAgIHByb3BzW3ZhbHVlWycwJ10ucHJvcGVydHluYW1lXSA9PT0gdmFsdWVbJzAnXS5saXRlcmFsKSxcbiAgcHJvcGVydHlpc2xlc3N0aGFuOiAodmFsdWUsIHByb3BzKSA9PiAocHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdICYmXG4gICAgTnVtYmVyKHByb3BzW3ZhbHVlWycwJ10ucHJvcGVydHluYW1lXSkgPCBOdW1iZXIodmFsdWVbJzAnXS5saXRlcmFsKSksXG59O1xuXG4vKipcbiAqIFtmaWx0ZXJTZWxlY3RvciBkZXNjcmlwdGlvbl1cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0gIHtGaWx0ZXJ9IGZpbHRlclxuICogQHBhcmFtICB7b2JqZWN0fSBwcm9wZXJ0aWVzIGZlYXR1cmUgcHJvcGVydGllc1xuICogQHBhcmFtIHtudW1iZXJ9IGtleSBpbmRleCBvZiBwcm9wZXJ0eSB0byB1c2VcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGZpbHRlclNlbGVjdG9yKGZpbHRlciwgcHJvcGVydGllcywga2V5ID0gMCkge1xuICBjb25zdCB0eXBlID0gT2JqZWN0LmtleXMoZmlsdGVyKVtrZXldO1xuICBpZiAoRmlsdGVyc1t0eXBlXSkge1xuICAgIGlmIChGaWx0ZXJzW3R5cGVdKGZpbHRlclt0eXBlXSwgcHJvcGVydGllcykpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVua293biBmaWx0ZXIgJHt0eXBlfWApO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBbc2NhbGVTZWxlY3RvciBkZXNjcmlwdGlvbl1cbiAqIFRoZSBcInN0YW5kYXJkaXplZCByZW5kZXJpbmcgcGl4ZWwgc2l6ZVwiIGlzIGRlZmluZWQgdG8gYmUgMC4yOG1tIMOXIDAuMjhtbVxuICogQHBhcmFtICB7UnVsZX0gcnVsZVxuICogQHBhcmFtICB7bnVtYmVyfSByZXNvbHV0aW9uICBtL3B4XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBzY2FsZVNlbGVjdG9yKHJ1bGUsIHJlc29sdXRpb24pIHtcbiAgaWYgKHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvciAhPT0gdW5kZWZpbmVkICYmIHJ1bGUubWluc2NhbGVkZW5vbWluYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKChyZXNvbHV0aW9uIC8gMC4wMDAyOCkgPCBydWxlLm1heHNjYWxlZGVub21pbmF0b3IgJiZcbiAgICAgIChyZXNvbHV0aW9uIC8gMC4wMDAyOCkgPiBydWxlLm1pbnNjYWxlZGVub21pbmF0b3IpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuICgocmVzb2x1dGlvbiAvIDAuMDAwMjgpIDwgcnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yKTtcbiAgfVxuICBpZiAocnVsZS5taW5zY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gKChyZXNvbHV0aW9uIC8gMC4wMDAyOCkgPiBydWxlLm1pbnNjYWxlZGVub21pbmF0b3IpO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgbGlicmFyeSBzcGVjaWZpYyBzdHlsZSBjbGFzc2VzXG4gKiBBZnRlciBjcmVhdGluZyBhbiBpbnN0YW5jZSB5b3Ugc2hvdWxkIGNhbGwgdGhlIHJlYWQgbWV0aG9kLlxuICovXG5jbGFzcyBTdHlsZSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5nZXRSdWxlcyA9IHRoaXMuZ2V0UnVsZXMuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWFkIHhtbCBmaWxlXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc2xkIHhtbCBzdHJpbmdcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYXllcm5hbWVdIFNlbGVjdCBsYXllciBtYXRjaGluZyBjYXNlIGluc2Vuc2l0aXZlLCBkZWZhdWx0cyB0byBmaXJzdCBsYXllclxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3N0eWxlbmFtZV0gU2VsZWN0IHN0eWxlIGNhc2UgaW5zZW5zaXRpdmUsIGRlZmF1bHRzIHRvIGZpcnN0IHN0eWxlXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICByZWFkKHNsZCwgbGF5ZXJuYW1lLCBzdHlsZW5hbWUpIHtcbiAgICB0aGlzLnNsZCA9IFJlYWRlcihzbGQpO1xuICAgIHRoaXMuc2V0U3R5bGUobGF5ZXJuYW1lLCBzdHlsZW5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIGlzIGxheWVyIGRlZmluZWQgaW4gc2xkP1xuICAgKiBAcmV0dXJuIHtCb29sZWFufSBbZGVzY3JpcHRpb25dXG4gICAqL1xuICBoYXNMYXllcihsYXllcm5hbWUpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuc2xkLmxheWVycy5maW5kSW5kZXgobCA9PlxuICAgICAgKGwubmFtZS50b0xvd2VyQ2FzZSgpID09PSBsYXllcm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuICAgIHJldHVybiAoaW5kZXggPiAtMSk7XG4gIH1cbiAgLyoqXG4gICAqIENoYW5nZSBzZWxlY3RlZCBsYXllciBhbmQgc3R5bGUgZnJvbSBzbGQgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGF5ZXJuYW1lXSAgU2VsZWN0IGxheWVyIG1hdGNoaW5nIGxvd2VyY2FzZWQgbGF5ZXJuYW1lXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbc3R5bGVuYW1lXSBzdHlsZSB0byB1c2VcbiAgICovXG4gIHNldFN0eWxlKGxheWVybmFtZSwgc3R5bGVuYW1lKSB7XG4gICAgbGV0IGZpbHRlcmVkbGF5ZXJzO1xuICAgIGlmIChsYXllcm5hbWUpIHtcbiAgICAgIGZpbHRlcmVkbGF5ZXJzID0gdGhpcy5zbGQubGF5ZXJzLmZpbHRlcihsID0+XG4gICAgICAgIChsLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbGF5ZXJuYW1lLnRvTG93ZXJDYXNlKCkpKTtcbiAgICAgIGlmICghZmlsdGVyZWRsYXllcnMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IEVycm9yKGBsYXllciAke2xheWVybmFtZX0gbm90IGZvdW5kIGluIHNsZGApO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmxheWVyID0gKGZpbHRlcmVkbGF5ZXJzKSA/IGZpbHRlcmVkbGF5ZXJzWycwJ10gOiB0aGlzLnNsZC5sYXllcnNbJzAnXTtcbiAgICB0aGlzLnN0eWxlID0gdGhpcy5sYXllci5zdHlsZXMuZmlsdGVyKHMgPT4gKChzdHlsZW5hbWUpID8gKHMubmFtZS50b0xvd2VyQ2FzZSgpID09PSBzdHlsZW5hbWUudG9Mb3dlckNhc2UoKSkgOiBzLmRlZmF1bHQpKVsnMCddO1xuICB9XG5cblxuICAvKipcbiAgICogZ2V0IHNsZCBydWxlcyBmb3IgZmVhdHVyZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHByb3BlcnRpZXMgZmVhdHVyZSBwcm9wZXJ0aWVzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXNvbHV0aW9uIHVuaXQvcHhcbiAgICogQHJldHVybiB7UnVsZX0gZmlsdGVyZWQgc2xkIHJ1bGVzXG4gICAqL1xuICBnZXRSdWxlcyhwcm9wZXJ0aWVzLCByZXNvbHV0aW9uKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NldCBhIHN0eWxlIHRvIHVzZScpO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICBjb25zdCBGZWF0dXJlVHlwZVN0eWxlTGVuZ3RoID0gdGhpcy5zdHlsZS5mZWF0dXJldHlwZXN0eWxlcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBGZWF0dXJlVHlwZVN0eWxlTGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIGNvbnN0IGZ0dHlwZXN0eWxlID0gdGhpcy5zdHlsZS5mZWF0dXJldHlwZXN0eWxlc1tpXTtcbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZnR0eXBlc3R5bGUucnVsZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICAgICAgY29uc3QgcnVsZSA9IGZ0dHlwZXN0eWxlLnJ1bGVzW2pdO1xuICAgICAgICBpZiAocnVsZS5maWx0ZXIgJiYgc2NhbGVTZWxlY3RvcihydWxlLCByZXNvbHV0aW9uKSAmJlxuICAgICAgICAgIGZpbHRlclNlbGVjdG9yKHJ1bGUuZmlsdGVyLCBwcm9wZXJ0aWVzKSkge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKHJ1bGUuZWxzZWZpbHRlciAmJiByZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2gocnVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoIXJ1bGUuZWxzZWZpbHRlciAmJiAhcnVsZS5maWx0ZXIpIHtcbiAgICAgICAgICByZXN1bHQucHVzaChydWxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgU3R5bGU7XG4iLCJpbXBvcnQgT2xTTERTdHlsZSBmcm9tICcuL09sU0xEU3R5bGUnO1xuXG5cbmV4cG9ydCB7IE9sU0xEU3R5bGUgfTtcbiIsIi8qKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge1J1bGVbXX0gcnVsZXMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7b2JqZWN0fSAgICAgICBzZWUgbGVhZmxldCBwYXRoIGZvciBpbnNwaXJhdGlvblxuICovXG5mdW5jdGlvbiBydWxlc0NvbnZlcnRlcihydWxlcykge1xuICBjb25zdCByZXN1bHQgPSB7fTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBydWxlcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGlmIChydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplciAmJiBydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplci5maWxsKSB7XG4gICAgICBjb25zdCBmaWxsID0gcnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIuZmlsbDtcbiAgICAgIGZpbGxSdWxlcyhmaWxsLCByZXN1bHQpO1xuICAgIH1cbiAgICBpZiAocnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIgJiYgcnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIuc3Ryb2tlKSB7XG4gICAgICBjb25zdCBzdHJva2UgPSBydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplci5zdHJva2U7XG4gICAgICBzdHJva2VSdWxlcyhzdHJva2UsIHJlc3VsdCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHN0cm9rZVJ1bGVzKHN0cm9rZSwgcmVzdWx0KSB7XG4gIGZvciAobGV0IGogPSAwOyBqIDwgc3Ryb2tlLmNzcy5sZW5ndGg7IGogKz0gMSkge1xuICAgIHN3aXRjaCAoc3Ryb2tlLmNzc1tqXS5uYW1lKSB7XG4gICAgICBjYXNlICdzdHJva2UnOlxuICAgICAgICByZXN1bHQuc3Ryb2tlQ29sb3IgPSBzdHJva2UuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cm9rZS1vcGFjaXR5JzpcbiAgICAgICAgcmVzdWx0LnN0cm9rZU9wYWNpdHkgPSBzdHJva2UuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3N0cm9rZS13aWR0aCc6XG4gICAgICAgIHJlc3VsdC5zdHJva2VXaWR0aCA9IHN0cm9rZS5jc3Nbal0udmFsdWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBbZmlsbCBkZXNjcmlwdGlvbl1cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0gIHtvYmplY3R9IGZpbGwgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtIHtvYmplY3R9IHJlc3VsdCBwcm9wcyB3aWxsIGJlIGFkZGVkIHRvXG4gKiBAcmV0dXJuIHt2b2lkfSAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuZnVuY3Rpb24gZmlsbFJ1bGVzKGZpbGwsIHJlc3VsdCkge1xuICBmb3IgKGxldCBqID0gMDsgaiA8IGZpbGwuY3NzLmxlbmd0aDsgaiArPSAxKSB7XG4gICAgc3dpdGNoIChmaWxsLmNzc1tqXS5uYW1lKSB7XG4gICAgICBjYXNlICdmaWxsJzpcbiAgICAgICAgcmVzdWx0LmZpbGxDb2xvciA9IGZpbGwuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2ZpbGwtb3BhY2l0eSc6XG4gICAgICAgIHJlc3VsdC5maWxsT3BhY2l0eSA9IGZpbGwuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgcnVsZXNDb252ZXJ0ZXI7XG4iXX0=
