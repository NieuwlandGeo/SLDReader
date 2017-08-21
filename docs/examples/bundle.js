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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvT2xTTERTdHlsZS5qcyIsInNyYy9SZWFkZXIuanMiLCJzcmMvU3R5bGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvcnVsZXNDb252ZXJ0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7O0FDSUE7Ozs7QUFDQTs7Ozs7Ozs7Ozs7O0FBR0E7OztJQUdNLFU7OztBQUNKLHdCQUFjO0FBQUE7O0FBQUE7O0FBRVosVUFBSyxhQUFMLEdBQXFCLE1BQUssYUFBTCxDQUFtQixJQUFuQixPQUFyQjtBQUZZO0FBR2I7O0FBRUQ7Ozs7Ozs7Ozs7O2tDQU9jLE8sRUFBUyxVLEVBQVk7QUFDakMsVUFBTSxRQUFRLFFBQVEsYUFBUixFQUFkO0FBQ0EsWUFBTSxHQUFOLEdBQVksUUFBUSxLQUFSLEVBQVo7QUFDQSxVQUFNLFFBQVEsS0FBSyxRQUFMLENBQWMsS0FBZCxFQUFxQixVQUFyQixDQUFkO0FBQ0EsVUFBTSxRQUFRLDhCQUFlLEtBQWYsQ0FBZDtBQUNBLFVBQU0sT0FBTyxvQ0FBVztBQUN0QixlQUFPLE1BQU07QUFEUyxPQUFYLENBQWI7QUFHQSxVQUFNLFNBQVMsc0NBQWE7QUFDMUIsZUFBTyxNQUFNLFdBRGE7QUFFMUIsZUFBTyxNQUFNO0FBRmEsT0FBYixDQUFmO0FBSUEsVUFBTSxTQUFTLENBQ2IscUNBQVk7QUFDVixlQUFPLHNDQUFhO0FBQ2xCLG9CQURrQjtBQUVsQix3QkFGa0I7QUFHbEIsa0JBQVE7QUFIVSxTQUFiLENBREc7QUFNVixrQkFOVTtBQU9WO0FBUFUsT0FBWixDQURhLENBQWY7QUFXQSxhQUFPLE1BQVA7QUFDRDs7Ozs7O2tCQUtZLFU7O0FBR2Q7Ozs7Ozs7Ozs7Ozs7O2tCQ2dFdUIsTTtBQXhIeEIsU0FBUyxZQUFULENBQXNCLElBQXRCLEVBQTRCLEdBQTVCLEVBQWlDLElBQWpDLEVBQXVDO0FBQ3JDLE1BQU0sV0FBVyxLQUFL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UyxDQUFULEVBQVksS0FBakM7QUFDQTtBQUNGO0FBUEY7QUFTRDtBQUNGOztrQkFHYyxjIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCBPbFN0eWxlIGZyb20gJ29sL3N0eWxlL3N0eWxlJztcbmltcG9ydCBPbEZpbGwgZnJvbSAnb2wvc3R5bGUvZmlsbCc7XG5pbXBvcnQgT2xDaXJjbGUgZnJvbSAnb2wvc3R5bGUvY2lyY2xlJztcbmltcG9ydCBPbFN0cm9rZSBmcm9tICdvbC9zdHlsZS9zdHJva2UnO1xuaW1wb3J0IFN0eWxlIGZyb20gJy4vU3R5bGUnO1xuaW1wb3J0IHJ1bGVzQ29udmVydGVyIGZyb20gJy4vcnVsZXNDb252ZXJ0ZXInO1xuXG5cbi8qKlxuICogVGhlIE9sU0xEU3R5bGUgY2xhc3MgaXMgdGhlIGVudHJ5IHBvaW50IGZvciBvcGVubGF5ZXJzIHVzZXJzLlxuICovXG5jbGFzcyBPbFNMRFN0eWxlIGV4dGVuZHMgU3R5bGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuc3R5bGVGdW5jdGlvbiA9IHRoaXMuc3R5bGVGdW5jdGlvbi5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuIG9sLnN0eWxlRnVuY3Rpb25cbiAgICogQHBhcmFtIHtvbC5GZWF0dXJlfSBmZWF0dXJlIG9wZW5sYXllcnMgZmVhdHVyZSB0byBzdHlsZVxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzb2x1dGlvbiB2aWV3cyByZXNvbHV0aW9uIGluIG1ldGVycy9weCwgcmVjYWxjdWxhdGUgaWYgeW91clxuICAgKiBsYXllciB1c2UgZGlmZmVyZW50IHVuaXRzIVxuICAgKiBAcmV0dXJuIHtvbC5zdHlsZS5TdHlsZX0gb3BlbmxheWVycyBzdHlsZVxuICAgKi9cbiAgc3R5bGVGdW5jdGlvbihmZWF0dXJlLCByZXNvbHV0aW9uKSB7XG4gICAgY29uc3QgcHJvcHMgPSBmZWF0dXJlLmdldFByb3BlcnRpZXMoKTtcbiAgICBwcm9wcy5maWQgPSBmZWF0dXJlLmdldElkKCk7XG4gICAgY29uc3QgcnVsZXMgPSB0aGlzLmdldFJ1bGVzKHByb3BzLCByZXNvbHV0aW9uKTtcbiAgICBjb25zdCBzdHlsZSA9IHJ1bGVzQ29udmVydGVyKHJ1bGVzKTtcbiAgICBjb25zdCBmaWxsID0gbmV3IE9sRmlsbCh7XG4gICAgICBjb2xvcjogc3R5bGUuZmlsbENvbG9yLFxuICAgIH0pO1xuICAgIGNvbnN0IHN0cm9rZSA9IG5ldyBPbFN0cm9rZSh7XG4gICAgICBjb2xvcjogc3R5bGUuc3Ryb2tlQ29sb3IsXG4gICAgICB3aWR0aDogc3R5bGUuc3Ryb2tlV2lkdGgsXG4gICAgfSk7XG4gICAgY29uc3Qgc3R5bGVzID0gW1xuICAgICAgbmV3IE9sU3R5bGUoe1xuICAgICAgICBpbWFnZTogbmV3IE9sQ2lyY2xlKHtcbiAgICAgICAgICBmaWxsLFxuICAgICAgICAgIHN0cm9rZSxcbiAgICAgICAgICByYWRpdXM6IDUsXG4gICAgICAgIH0pLFxuICAgICAgICBmaWxsLFxuICAgICAgICBzdHJva2UsXG4gICAgICB9KSxcbiAgICBdO1xuICAgIHJldHVybiBzdHlsZXM7XG4gIH1cblxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IE9sU0xEU3R5bGU7XG5cblxuIC8qKlxuICAqIE9wZW5sYXllcnMgc3R5bGVmdW5jdGlvblxuICAqIEBleHRlcm5hbCBvbC5TdHlsZUZ1bmN0aW9uXG4gICogQHNlZSB7QGxpbmsgaHR0cDovL29wZW5sYXllcnMub3JnL2VuL2xhdGVzdC9hcGlkb2Mvb2wuaHRtbCMuU3R5bGVGdW5jdGlvbn1cbiAgKi9cbiIsImZ1bmN0aW9uIGFkZFByb3BBcnJheShub2RlLCBvYmosIHByb3ApIHtcbiAgY29uc3QgcHJvcGVydHkgPSBwcm9wLnRvTG93ZXJDYXNlKCk7XG4gIG9ialtwcm9wZXJ0eV0gPSBvYmpbcHJvcGVydHldIHx8IFtdO1xuICBjb25zdCBpdGVtID0ge307XG4gIHJlYWROb2RlKG5vZGUsIGl0ZW0pO1xuICBvYmpbcHJvcGVydHldLnB1c2goaXRlbSk7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3Aobm9kZSwgb2JqLCBwcm9wKSB7XG4gIGNvbnN0IHByb3BlcnR5ID0gcHJvcC50b0xvd2VyQ2FzZSgpO1xuICBvYmpbcHJvcGVydHldID0ge307XG4gIHJlYWROb2RlKG5vZGUsIG9ialtwcm9wZXJ0eV0pO1xufVxuXG5mdW5jdGlvbiBnZXRUZXh0KGVsZW1lbnQsIHRhZ05hbWUpIHtcbiAgY29uc3QgY29sbGVjdGlvbiA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUodGFnTmFtZSk7XG4gIHJldHVybiAoY29sbGVjdGlvbi5sZW5ndGgpID8gY29sbGVjdGlvbi5pdGVtKDApLnRleHRDb250ZW50IDogJyc7XG59XG5cbmZ1bmN0aW9uIGdldEJvb2woZWxlbWVudCwgdGFnTmFtZSkge1xuICBjb25zdCBjb2xsZWN0aW9uID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSh0YWdOYW1lKTtcbiAgaWYgKGNvbGxlY3Rpb24ubGVuZ3RoKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oY29sbGVjdGlvbi5pdGVtKDApLnRleHRDb250ZW50KTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmNvbnN0IHBhcnNlcnMgPSB7XG4gIE5hbWVkTGF5ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmoubGF5ZXJzID0gb2JqLmxheWVycyB8fCBbXTtcbiAgICBjb25zdCBsYXllciA9IHtcbiAgICAgIC8vIG5hbWU6IGdldFRleHQoZWxlbWVudCwgJ3NsZDpOYW1lJyksXG4gICAgICBzdHlsZXM6IFtdLFxuICAgIH07XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgbGF5ZXIpO1xuICAgIG9iai5sYXllcnMucHVzaChsYXllcik7XG4gIH0sXG4gIFVzZXJTdHlsZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgLy8gbmFtZTogZ2V0VGV4dChlbGVtZW50LCAnc2xkOk5hbWUnKSxcbiAgICAgIGRlZmF1bHQ6IGdldEJvb2woZWxlbWVudCwgJ3NsZDpJc0RlZmF1bHQnKSxcbiAgICAgIGZlYXR1cmV0eXBlc3R5bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIHN0eWxlKTtcbiAgICBvYmouc3R5bGVzLnB1c2goc3R5bGUpO1xuICB9LFxuICBGZWF0dXJlVHlwZVN0eWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXR5cGVzdHlsZSA9IHtcbiAgICAgIHJ1bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIGZlYXR1cmV0eXBlc3R5bGUpO1xuICAgIG9iai5mZWF0dXJldHlwZXN0eWxlcy5wdXNoKGZlYXR1cmV0eXBlc3R5bGUpO1xuICB9LFxuICBSdWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3QgcnVsZSA9IHt9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIHJ1bGUpO1xuICAgIG9iai5ydWxlcy5wdXNoKHJ1bGUpO1xuICB9LFxuICBGaWx0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZmlsdGVyID0ge307XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgb2JqLmZpbHRlcik7XG4gIH0sXG4gIEVsc2VGaWx0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZWxzZWZpbHRlciA9IHRydWU7XG4gIH0sXG4gIE9yOiBhZGRQcm9wLFxuICBBbmQ6IGFkZFByb3AsXG4gIE5vdDogYWRkUHJvcCxcbiAgUHJvcGVydHlJc0VxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc05vdEVxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0xlc3NUaGFuOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNMZXNzVGhhbk9yRXF1YWxUbzogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzR3JlYXRlclRoYW46IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0dyZWF0ZXJUaGFuT3JFcXVhbFRvOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5TmFtZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5wcm9wZXJ0eW5hbWUgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBMaXRlcmFsOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmxpdGVyYWwgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBGZWF0dXJlSWQ6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZmVhdHVyZWlkID0gb2JqLmZlYXR1cmVpZCB8fCBbXTtcbiAgICBvYmouZmVhdHVyZWlkLnB1c2goZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2ZpZCcpKTtcbiAgfSxcbiAgTmFtZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5uYW1lID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgTWF4U2NhbGVEZW5vbWluYXRvcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5tYXhzY2FsZWRlbm9taW5hdG9yID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgUG9seWdvblN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIExpbmVTeW1ib2xpemVyOiBhZGRQcm9wLFxuICBQb2ludFN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIEZpbGw6IGFkZFByb3AsXG4gIFN0cm9rZTogYWRkUHJvcCxcbiAgRXh0ZXJuYWxHcmFwaGljOiBhZGRQcm9wLFxuICBPbmxpbmVSZXNvdXJjZTogZWxlbWVudCA9PiBnZXRUZXh0KGVsZW1lbnQsICdzbGQ6T25saW5lUmVzb3VyY2UnKSxcbiAgQ3NzUGFyYW1ldGVyOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmNzcyA9IG9iai5jc3MgfHwgW107XG4gICAgb2JqLmNzcy5wdXNoKHtcbiAgICAgIG5hbWU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCduYW1lJyksXG4gICAgICB2YWx1ZTogZWxlbWVudC50ZXh0Q29udGVudC50cmltKCksXG4gICAgfSk7XG4gIH0sXG59O1xuXG5mdW5jdGlvbiByZWFkTm9kZShub2RlLCBvYmopIHtcbiAgZm9yIChsZXQgbiA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7IG47IG4gPSBuLm5leHRFbGVtZW50U2libGluZykge1xuICAgIGlmIChwYXJzZXJzW24ubG9jYWxOYW1lXSkge1xuICAgICAgcGFyc2Vyc1tuLmxvY2FsTmFtZV0obiwgb2JqLCBuLmxvY2FsTmFtZSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgb2JqZWN0IGZyb20gYW4gc2xkIHhtbCBzdHJpbmcsIGZvciBpbnRlcm5hbCB1c2FnZVxuICogQHBhcmFtICB7c3RyaW5nfSBzbGQgeG1sIHN0cmluZ1xuICogQHJldHVybiB7U3R5bGVkTGF5ZXJEZXNjcmlwdG9yfSAgb2JqZWN0IHJlcHJlc2VudGluZyBzbGQgc3R5bGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUmVhZGVyKHNsZCkge1xuICBjb25zdCByZXN1bHQgPSB7fTtcbiAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICBjb25zdCBkb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHNsZCwgJ2FwcGxpY2F0aW9uL3htbCcpO1xuXG4gIGZvciAobGV0IG4gPSBkb2MuZmlyc3RDaGlsZDsgbjsgbiA9IG4ubmV4dFNpYmxpbmcpIHtcbiAgICByZXN1bHQudmVyc2lvbiA9IG4uZ2V0QXR0cmlidXRlKCd2ZXJzaW9uJyk7XG4gICAgcmVhZE5vZGUobiwgcmVzdWx0KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5cbi8qKlxuICogQHR5cGVkZWYgU3R5bGVkTGF5ZXJEZXNjcmlwdG9yXG4gKiBAbmFtZSBTdHlsZWRMYXllckRlc2NyaXB0b3JcbiAqIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFN0eWxlZExheWVyRGVzY3JpcHRvciB7QGxpbmsgaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2xkLzEuMS9TdHlsZWRMYXllckRlc2NyaXB0b3IueHNkIHhzZH1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2ZXJzaW9uIHNsZCB2ZXJzaW9uXG4gKiBAcHJvcGVydHkge0xheWVyW119IGxheWVycyBpbmZvIGV4dHJhY3RlZCBmcm9tIE5hbWVkTGF5ZXIgZWxlbWVudFxuICovXG5cbi8qKlxuKiBAdHlwZWRlZiBMYXllclxuKiBAbmFtZSBMYXllclxuKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBMYXllciwgdGhlIGFjdHVhbCBzdHlsZSBvYmplY3QgZm9yIGEgc2luZ2xlIGxheWVyXG4qIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lIGxheWVyIG5hbWVcbiogQHByb3BlcnR5IHtPYmplY3RbXX0gc3R5bGVzIFNlZSBleHBsYW5hdGlvbiBhdCBbR2Vvc2VydmVyIGRvY3NdKGh0dHA6Ly9kb2NzLmdlb3NlcnZlci5vcmcvc3RhYmxlL2VuL3VzZXIvc3R5bGluZy9zbGQvcmVmZXJlbmNlL3N0eWxlcy5odG1sKVxuKiBAcHJvcGVydHkge0Jvb2xlYW59IHN0eWxlc1tdLmRlZmF1bHRcbiogQHByb3BlcnR5IHtGZWF0dXJlVHlwZVN0eWxlW119IHN0eWxlc1tdLmZlYXR1cmV0eXBlc3R5bGVzXG4qL1xuXG4vKipcbiogQHR5cGVkZWYgRmVhdHVyZVR5cGVTdHlsZVxuKiBAbmFtZSBGZWF0dXJlVHlwZVN0eWxlXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIEZlYXR1cmVUeXBlU3R5bGU6IHtAbGluayBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9GZWF0dXJlU3R5bGUueHNkIHhzZH1cbiogQHByb3BlcnR5IHtSdWxlW119IHJ1bGVzXG4qL1xuXG5cbi8qKlxuKiBAdHlwZWRlZiBSdWxlXG4qIEBuYW1lIFJ1bGVcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgUnVsZSB0byBtYXRjaCBhIGZlYXR1cmU6IHtAbGluayBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9GZWF0dXJlU3R5bGUueHNkIHhzZH1cbiogQHByb3BlcnR5IHtzdHJpbmd9IG5hbWUgcnVsZSBuYW1lXG4qIEBwcm9wZXJ0eSB7RmlsdGVyfSBbZmlsdGVyXVxuKiBAcHJvcGVydHkge2Jvb2xlYW59IFtlbHNlZmlsdGVyXVxuKiBAcHJvcGVydHkge2ludGVnZXJ9IFttaW5zY2FsZWRlbm9taW5hdG9yXVxuKiBAcHJvcGVydHkge2ludGVnZXJ9IFttYXhzY2FsZWRlbm9taW5hdG9yXVxuKiBAcHJvcGVydHkge1BvbHlnb25TeW1ib2xpemVyfSBbcG9seWdvbnN5bWJvbGl6ZXJdXG4qIEBwcm9wZXJ0eSB7TGluZVN5bWJvbGl6ZXJ9ICBbbGluZXN5bWJvbGl6ZXJdXG4qIEBwcm9wZXJ0eSB7UG9pbnRTeW1ib2xpemVyfSBbcG9pbnRzeW1ib2xpemVyXVxuKiAqL1xuXG4vKipcbiogQHR5cGVkZWYgRmlsdGVyXG4qIEBuYW1lIEZpbHRlclxuKiBAZGVzY3JpcHRpb24gW29nYyBmaWx0ZXJzXSggaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvZmlsdGVyLzEuMS4wL2ZpbHRlci54c2QpIHNob3VsZCBoYXZlIG9ubHkgb25lIHByb3BcbiogQHByb3BlcnR5IHthcnJheX0gW2ZlYXR1cmVpZF0gZmlsdGVyXG4qIEBwcm9wZXJ0eSB7b2JqZWN0fSBbb3JdICBmaWx0ZXJcbiogQHByb3BlcnR5IHtvYmplY3R9IFthbmRdICBmaWx0ZXJcbiogQHByb3BlcnR5IHtvYmplY3R9IFtub3RdICBmaWx0ZXJcbiogQHByb3BlcnR5IHthcnJheX0gW3Byb3BlcnR5aXNlcXVhbHRvXSAgZmlsdGVyXG4qICovXG5cblxuLyoqXG4qIEB0eXBlZGVmIFBvbHlnb25TeW1ib2xpemVyXG4qIEBuYW1lIFBvbHlnb25TeW1ib2xpemVyXG4qIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFtQb2x5Z29uU3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBmaWxsXG4qIEBwcm9wZXJ0eSB7YXJyYXl9IGZpbGwuY3NzXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBzdHJva2VcbiogQHByb3BlcnR5IHthcnJheX0gc3Ryb2tlLmNzc1xuKiAqL1xuXG4vKipcbiogQHR5cGVkZWYgTGluZVN5bWJvbGl6ZXJcbiogQG5hbWUgTGluZVN5bWJvbGl6ZXJcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgW0xpbmVTeW1ib2xpemVyXShodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zZS8xLjEuMC9TeW1ib2xpemVyLnhzZClcbiogQHByb3BlcnR5IHtPYmplY3R9IHN0cm9rZVxuKiBAcHJvcGVydHkge2FycmF5fSBzdHJva2UuY3NzXG4qICovXG5cblxuLyoqXG4qIEB0eXBlZGVmIFBvaW50U3ltYm9saXplclxuKiBAbmFtZSBQb2ludFN5bWJvbGl6ZXJcbiogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgW1BvaW50U3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBncmFwaGljXG4qIEBwcm9wZXJ0eSB7T2JqZWN0fSBncmFwaGljLmV4dGVybmFsZ3JhcGhpY1xuKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhpYy5leHRlcm5hbGdyYXBoaWMub25saW5lcmVzb3VyY2VcbiogKi9cbiIsImltcG9ydCBSZWFkZXIgZnJvbSAnLi9SZWFkZXInO1xuXG5jb25zdCBGaWx0ZXJzID0ge1xuICBmZWF0dXJlaWQ6ICh2YWx1ZSwgcHJvcHMpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodmFsdWVbaV0gPT09IHByb3BzLmZpZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBub3Q6ICh2YWx1ZSwgcHJvcHMpID0+ICFmaWx0ZXJTZWxlY3Rvcih2YWx1ZSwgcHJvcHMpLFxuICBvcjogKHZhbHVlLCBwcm9wcykgPT4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodmFsdWVba2V5c1tpXV0ubGVuZ3RoID09PSAxICYmIGZpbHRlclNlbGVjdG9yKHZhbHVlLCBwcm9wcywgaSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlW2tleXNbaV1dLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ211bHRpcGxlIG9wcyBvZiBzYW1lIHR5cGUgbm90IGltcGxlbWVudGVkIHlldCcpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIHByb3BlcnR5aXNlcXVhbHRvOiAodmFsdWUsIHByb3BzKSA9PiAocHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdICYmXG4gICAgcHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdID09PSB2YWx1ZVsnMCddLmxpdGVyYWwpLFxuICBwcm9wZXJ0eWlzbGVzc3RoYW46ICh2YWx1ZSwgcHJvcHMpID0+IChwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0gJiZcbiAgICBOdW1iZXIocHJvcHNbdmFsdWVbJzAnXS5wcm9wZXJ0eW5hbWVdKSA8IE51bWJlcih2YWx1ZVsnMCddLmxpdGVyYWwpKSxcbn07XG5cbi8qKlxuICogW2ZpbHRlclNlbGVjdG9yIGRlc2NyaXB0aW9uXVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge0ZpbHRlcn0gZmlsdGVyXG4gKiBAcGFyYW0gIHtvYmplY3R9IHByb3BlcnRpZXMgZmVhdHVyZSBwcm9wZXJ0aWVzXG4gKiBAcGFyYW0ge251bWJlcn0ga2V5IGluZGV4IG9mIHByb3BlcnR5IHRvIHVzZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gZmlsdGVyU2VsZWN0b3IoZmlsdGVyLCBwcm9wZXJ0aWVzLCBrZXkgPSAwKSB7XG4gIGNvbnN0IHR5cGUgPSBPYmplY3Qua2V5cyhmaWx0ZXIpW2tleV07XG4gIGlmIChGaWx0ZXJzW3R5cGVdKSB7XG4gICAgaWYgKEZpbHRlcnNbdHlwZV0oZmlsdGVyW3R5cGVdLCBwcm9wZXJ0aWVzKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5rb3duIGZpbHRlciAke3R5cGV9YCk7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIFtzY2FsZVNlbGVjdG9yIGRlc2NyaXB0aW9uXVxuICogVGhlIFwic3RhbmRhcmRpemVkIHJlbmRlcmluZyBwaXhlbCBzaXplXCIgaXMgZGVmaW5lZCB0byBiZSAwLjI4bW0gw5cgMC4yOG1tXG4gKiBAcGFyYW0gIHtSdWxlfSBydWxlXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHJlc29sdXRpb24gIG0vcHhcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIHNjYWxlU2VsZWN0b3IocnVsZSwgcmVzb2x1dGlvbikge1xuICBpZiAocnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQgJiYgcnVsZS5taW5zY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoKHJlc29sdXRpb24gLyAwLjAwMDI4KSA8IHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvciAmJlxuICAgICAgKHJlc29sdXRpb24gLyAwLjAwMDI4KSA+IHJ1bGUubWluc2NhbGVkZW5vbWluYXRvcikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAocnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gKChyZXNvbHV0aW9uIC8gMC4wMDAyOCkgPCBydWxlLm1heHNjYWxlZGVub21pbmF0b3IpO1xuICB9XG4gIGlmIChydWxlLm1pbnNjYWxlZGVub21pbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiAoKHJlc29sdXRpb24gLyAwLjAwMDI4KSA+IHJ1bGUubWluc2NhbGVkZW5vbWluYXRvcik7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cblxuLyoqXG4gKiBCYXNlIGNsYXNzIGZvciBsaWJyYXJ5IHNwZWNpZmljIHN0eWxlIGNsYXNzZXNcbiAqIEFmdGVyIGNyZWF0aW5nIGFuIGluc3RhbmNlIHlvdSBzaG91bGQgY2FsbCB0aGUgcmVhZCBtZXRob2QuXG4gKi9cbmNsYXNzIFN0eWxlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmdldFJ1bGVzID0gdGhpcy5nZXRSdWxlcy5iaW5kKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlYWQgeG1sIGZpbGVcbiAgICogQHBhcmFtICB7c3RyaW5nfSBzbGQgeG1sIHN0cmluZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xheWVybmFtZV0gU2VsZWN0IGxheWVyIG1hdGNoaW5nIGNhc2UgaW5zZW5zaXRpdmUsIGRlZmF1bHRzIHRvIGZpcnN0IGxheWVyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbc3R5bGVuYW1lXSBTZWxlY3Qgc3R5bGUgY2FzZSBpbnNlbnNpdGl2ZSwgZGVmYXVsdHMgdG8gZmlyc3Qgc3R5bGVcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHJlYWQoc2xkLCBsYXllcm5hbWUsIHN0eWxlbmFtZSkge1xuICAgIHRoaXMuc2xkID0gUmVhZGVyKHNsZCk7XG4gICAgdGhpcy5zZXRTdHlsZShsYXllcm5hbWUsIHN0eWxlbmFtZSk7XG4gIH1cblxuICAvKipcbiAgICogaXMgbGF5ZXIgZGVmaW5lZCBpbiBzbGQ/XG4gICAqIEByZXR1cm4ge0Jvb2xlYW59IFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIGhhc0xheWVyKGxheWVybmFtZSkge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5zbGQubGF5ZXJzLmZpbmRJbmRleChsID0+XG4gICAgICAobC5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IGxheWVybmFtZS50b0xvd2VyQ2FzZSgpKSk7XG4gICAgcmV0dXJuIChpbmRleCA+IC0xKTtcbiAgfVxuICAvKipcbiAgICogQ2hhbmdlIHNlbGVjdGVkIGxheWVyIGFuZCBzdHlsZSBmcm9tIHNsZCB0byB1c2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYXllcm5hbWVdICBTZWxlY3QgbGF5ZXIgbWF0Y2hpbmcgbG93ZXJjYXNlZCBsYXllcm5hbWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtzdHlsZW5hbWVdIHN0eWxlIHRvIHVzZVxuICAgKi9cbiAgc2V0U3R5bGUobGF5ZXJuYW1lLCBzdHlsZW5hbWUpIHtcbiAgICBsZXQgZmlsdGVyZWRsYXllcnM7XG4gICAgaWYgKGxheWVybmFtZSkge1xuICAgICAgZmlsdGVyZWRsYXllcnMgPSB0aGlzLnNsZC5sYXllcnMuZmlsdGVyKGwgPT5cbiAgICAgICAgKGwubmFtZS50b0xvd2VyQ2FzZSgpID09PSBsYXllcm5hbWUudG9Mb3dlckNhc2UoKSkpO1xuICAgICAgaWYgKCFmaWx0ZXJlZGxheWVycy5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgRXJyb3IoYGxheWVyICR7bGF5ZXJuYW1lfSBub3QgZm91bmQgaW4gc2xkYCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubGF5ZXIgPSAoZmlsdGVyZWRsYXllcnMpID8gZmlsdGVyZWRsYXllcnNbJzAnXSA6IHRoaXMuc2xkLmxheWVyc1snMCddO1xuICAgIHRoaXMuc3R5bGUgPSB0aGlzLmxheWVyLnN0eWxlcy5maWx0ZXIocyA9PiAoKHN0eWxlbmFtZSkgPyAocy5uYW1lLnRvTG93ZXJDYXNlKCkgPT09IHN0eWxlbmFtZS50b0xvd2VyQ2FzZSgpKSA6IHMuZGVmYXVsdCkpWycwJ107XG4gIH1cblxuXG4gIC8qKlxuICAgKiBnZXQgc2xkIHJ1bGVzIGZvciBmZWF0dXJlXG4gICAqIEBwYXJhbSAge09iamVjdH0gcHJvcGVydGllcyBmZWF0dXJlIHByb3BlcnRpZXNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc29sdXRpb24gdW5pdC9weFxuICAgKiBAcmV0dXJuIHtSdWxlfSBmaWx0ZXJlZCBzbGQgcnVsZXNcbiAgICovXG4gIGdldFJ1bGVzKHByb3BlcnRpZXMsIHJlc29sdXRpb24pIHtcbiAgICBpZiAoIXRoaXMuc3R5bGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2V0IGEgc3R5bGUgdG8gdXNlJyk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGNvbnN0IEZlYXR1cmVUeXBlU3R5bGVMZW5ndGggPSB0aGlzLnN0eWxlLmZlYXR1cmV0eXBlc3R5bGVzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEZlYXR1cmVUeXBlU3R5bGVMZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY29uc3QgZnR0eXBlc3R5bGUgPSB0aGlzLnN0eWxlLmZlYXR1cmV0eXBlc3R5bGVzW2ldO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBmdHR5cGVzdHlsZS5ydWxlcy5sZW5ndGg7IGogKz0gMSkge1xuICAgICAgICBjb25zdCBydWxlID0gZnR0eXBlc3R5bGUucnVsZXNbal07XG4gICAgICAgIGlmIChydWxlLmZpbHRlciAmJiBzY2FsZVNlbGVjdG9yKHJ1bGUsIHJlc29sdXRpb24pICYmXG4gICAgICAgICAgZmlsdGVyU2VsZWN0b3IocnVsZS5maWx0ZXIsIHByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgcmVzdWx0LnB1c2gocnVsZSk7XG4gICAgICAgIH0gZWxzZSBpZiAocnVsZS5lbHNlZmlsdGVyICYmIHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXN1bHQucHVzaChydWxlKTtcbiAgICAgICAgfSBlbHNlIGlmICghcnVsZS5lbHNlZmlsdGVyICYmICFydWxlLmZpbHRlcikge1xuICAgICAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBTdHlsZTtcbiIsImltcG9ydCBPbFNMRFN0eWxlIGZyb20gJy4vT2xTTERTdHlsZSc7XG5cblxuZXhwb3J0IHsgT2xTTERTdHlsZSB9O1xuIiwiLyoqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7UnVsZVtdfSBydWxlcyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgIHNlZSBsZWFmbGV0IHBhdGggZm9yIGluc3BpcmF0aW9uXG4gKi9cbmZ1bmN0aW9uIHJ1bGVzQ29udmVydGVyKHJ1bGVzKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgaWYgKHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyICYmIHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLmZpbGwpIHtcbiAgICAgIGNvbnN0IGZpbGwgPSBydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplci5maWxsO1xuICAgICAgZmlsbFJ1bGVzKGZpbGwsIHJlc3VsdCk7XG4gICAgfVxuICAgIGlmIChydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplciAmJiBydWxlc1tpXS5wb2x5Z29uc3ltYm9saXplci5zdHJva2UpIHtcbiAgICAgIGNvbnN0IHN0cm9rZSA9IHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLnN0cm9rZTtcbiAgICAgIHN0cm9rZVJ1bGVzKHN0cm9rZSwgcmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKHJ1bGVzW2ldLmxpbmVzeW1ib2xpemVyICYmIHJ1bGVzW2ldLmxpbmVzeW1ib2xpemVyLnN0cm9rZSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gcnVsZXNbaV0ubGluZXN5bWJvbGl6ZXIuc3Ryb2tlO1xuICAgICAgc3Ryb2tlUnVsZXMoc3Ryb2tlLCByZXN1bHQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBzdHJva2VSdWxlcyhzdHJva2UsIHJlc3VsdCkge1xuICBmb3IgKGxldCBqID0gMDsgaiA8IHN0cm9rZS5jc3MubGVuZ3RoOyBqICs9IDEpIHtcbiAgICBzd2l0Y2ggKHN0cm9rZS5jc3Nbal0ubmFtZSkge1xuICAgICAgY2FzZSAnc3Ryb2tlJzpcbiAgICAgICAgcmVzdWx0LnN0cm9rZUNvbG9yID0gc3Ryb2tlLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzdHJva2Utb3BhY2l0eSc6XG4gICAgICAgIHJlc3VsdC5zdHJva2VPcGFjaXR5ID0gc3Ryb2tlLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzdHJva2Utd2lkdGgnOlxuICAgICAgICByZXN1bHQuc3Ryb2tlV2lkdGggPSBzdHJva2UuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogW2ZpbGwgZGVzY3JpcHRpb25dXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7b2JqZWN0fSBmaWxsIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7b2JqZWN0fSByZXN1bHQgcHJvcHMgd2lsbCBiZSBhZGRlZCB0b1xuICogQHJldHVybiB7dm9pZH0gICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbGxSdWxlcyhmaWxsLCByZXN1bHQpIHtcbiAgZm9yIChsZXQgaiA9IDA7IGogPCBmaWxsLmNzcy5sZW5ndGg7IGogKz0gMSkge1xuICAgIHN3aXRjaCAoZmlsbC5jc3Nbal0ubmFtZSkge1xuICAgICAgY2FzZSAnZmlsbCc6XG4gICAgICAgIHJlc3VsdC5maWxsQ29sb3IgPSBmaWxsLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdmaWxsLW9wYWNpdHknOlxuICAgICAgICByZXN1bHQuZmlsbE9wYWNpdHkgPSBmaWxsLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHJ1bGVzQ29udmVydGVyO1xuIl19
