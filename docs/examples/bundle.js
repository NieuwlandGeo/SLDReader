(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.SLDReader = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterSelector = filterSelector;
exports.scaleSelector = scaleSelector;
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

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = OlStyler;
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
 * Create openlayers style from object returned by rulesConverter
 * @param {ol.style} olstyle ol.style http://openlayers.org/en/latest/apidoc/ol.style.html
 * @param {StyleDescription} styleDescription rulesconverter
 * @return ol.Style.Style
 */
function OlStyler(olstyle, styleDescription) {
  var fill = new olstyle.Fill({
    color: styleDescription.fillOpacity && styleDescription.fillColor && styleDescription.fillColor.slice(0, 1) === '#' ? hexToRGB(styleDescription.fillColor, styleDescription.fillOpacity) : styleDescription.fillColor
  });
  var stroke = new olstyle.Stroke({
    color: styleDescription.strokeColor,
    width: styleDescription.strokeWidth,
    lineCap: styleDescription.strokeLinecap && styleDescription.strokeDasharray,
    lineDash: styleDescription.strokeDasharray && styleDescription.strokeDasharray.split(' '),
    lineDashOffset: styleDescription.strokeDashoffset && styleDescription.strokeDashoffset,
    lineJoin: styleDescription.strokeLinejoin && styleDescription.strokeLinejoin
  });
  var styles = [new olstyle.Style({
    image: new olstyle.Circle({
      fill: fill,
      stroke: stroke,
      radius: 5
    }),
    fill: fill,
    stroke: stroke
  })];
  return styles;
}

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Reader;
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
 * Generic parser for maxOccurs = 1
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
 * recieves textcontent of element with tagName
 * @private
 * @param  {Element} element [description]
 * @param  {string} tagName [description]
 * @return {string}
 */
function getText(element, tagName) {
  var collection = element.getElementsByTagName(tagName);
  return collection.length ? collection.item(0).textContent : '';
}

/**
 * recieves boolean of element with tagName
 * @private
 * @param  {Element} element [description]
 * @param  {string} tagName [description]
 * @return {boolean}
 */
function getBool(element, tagName) {
  var collection = element.getElementsByTagName(tagName);
  if (collection.length) {
    return Boolean(collection.item(0).textContent);
  }
  return false;
}

/**
 * Each propname is a tag in the sld that should be converted to plain object
 * @private
 * @type {Object}
 */
var parsers = {
  NamedLayer: function NamedLayer(element, obj) {
    addPropArray(element, obj, 'layers');
  },
  UserStyle: function UserStyle(element, obj) {
    obj.styles = obj.styles || [];
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
 * @property {string[]} [featureid]
 * @property {object} [or]  filter
 * @property {object} [and]  filter
 * @property {object} [not]  filter
 * @property {object[]} [propertyisequalto]  propertyname & literal
 * @property {object[]} [propertyislessthan]  propertyname & literal
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

},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * TODO write typedef for return value better function names
 * @param  {Rule[]} rules [description]
 * @return {object}       see leaflet path for inspiration
 */
function getStyleDescription(rules) {
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

exports.default = getStyleDescription;

/**
 * @typedef StyleDescription
 * @name StyleDescription
 * @description a flat object of props extracted from an array of rul;es
 * @property {string} fillColor
 * @property {string} fillOpacity
 */

},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLayerNames = getLayerNames;
exports.getLayer = getLayer;
exports.getStyleNames = getStyleNames;
exports.getStyle = getStyle;
exports.getRules = getRules;

var _Filter = require('./Filter');

/**
 * get all layer names in sld
 * @param {StyledLayerDescriptor} sld
 * @return {string[]} registered layernames
 */
function getLayerNames(sld) {
  return sld.layers.map(function (l) {
    return l.name;
  });
}

/**
 * getlayer with name
 * @param  {StyledLayerDescriptor} sld       [description]
 * @param  {string} layername [description]
 * @return {Layer}           [description]
 */
function getLayer(sld, layername) {
  return sld.layers.find(function (l) {
    return l.name === layername;
  });
}

/**
 * getStyleNames, notice name is not required for userstyle, you might get undefined
 * @param  {Layer} layer [description]
 * @return {string[]}       [description]
 */
function getStyleNames(layer) {
  return layer.styles.map(function (s) {
    return s.name;
  });
}
/**
 * get style, if name is undefined it returns default style.
 * null is no style found
 * @param  {Layer} layer [description]
 * @param {string} name of style
 * @return {object} the style with matching name
 */
function getStyle(layer, name) {
  if (name) {
    return layer.styles.find(function (s) {
      return s.name === name;
    });
  }
  return layer.styles.find(function (s) {
    return s.default;
  });
}

/**
 * get rules for specific feature after applying filters
 * @param  {FeatureTypeStyle} featureTypeStyle [description]
 * @param  {object} feature          a geojson feature
 * @return {Rule[]}
 */
function getRules(featureTypeStyle, feature, resolution) {
  var properties = feature.properties;

  var result = [];
  for (var j = 0; j < featureTypeStyle.rules.length; j += 1) {
    var rule = featureTypeStyle.rules[j];
    if (rule.filter && (0, _Filter.scaleSelector)(rule, resolution) && (0, _Filter.filterSelector)(rule.filter, properties)) {
      result.push(rule);
    } else if (rule.elsefilter && result.length === 0) {
      result.push(rule);
    } else if (!rule.elsefilter && !rule.filter) {
      result.push(rule);
    }
  }
  return result;
}

},{"./Filter":1}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OlStyler = exports.getStyleDescription = exports.Reader = undefined;

var _Utils = require('./Utils');

Object.keys(_Utils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _Utils[key];
    }
  });
});

var _Reader = require('./Reader');

var _Reader2 = _interopRequireDefault(_Reader);

var _OlStyler = require('./OlStyler');

var _OlStyler2 = _interopRequireDefault(_OlStyler);

var _StyleDescription = require('./StyleDescription');

var _StyleDescription2 = _interopRequireDefault(_StyleDescription);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.Reader = _Reader2.default;
exports.getStyleDescription = _StyleDescription2.default;
exports.OlStyler = _OlStyler2.default;

},{"./OlStyler":2,"./Reader":3,"./StyleDescription":4,"./Utils":5}]},{},[6])(6)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvRmlsdGVyLmpzIiwic3JjL09sU3R5bGVyLmpzIiwic3JjL1JlYWRlci5qcyIsInNyYy9TdHlsZURlc2NyaXB0aW9uLmpzIiwic3JjL1V0aWxzLmpzIiwic3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7UUNvQ2dCLGMsR0FBQSxjO1FBbUJBLGEsR0FBQSxhO0FBdkRoQixJQUFNLFVBQVU7QUFDZCxhQUFXLG1CQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWtCO0FBQzNCLFNBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxNQUFNLE1BQTFCLEVBQWtDLEtBQUssQ0FBdkMsRUFBMEM7QUFDeEMsVUFBSSxNQUFNLENBQU4sTUFBYSxNQUFNLEdBQXZCLEVBQTRCO0FBQzFCLGVBQU8sSUFBUDtBQUNEO0FBQ0Y7QUFDRCxXQUFPLEtBQVA7QUFDRCxHQVJhO0FBU2QsT0FBSyxhQUFDLEtBQUQsRUFBUSxLQUFSO0FBQUEsV0FBa0IsQ0FBQyxlQUFlLEtBQWYsRUFBc0IsS0FBdEIsQ0FBbkI7QUFBQSxHQVRTO0FBVWQsTUFBSSxZQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWtCO0FBQ3BCLFFBQU0sT0FBTyxPQUFPLElBQVAsQ0FBWSxLQUFaLENBQWI7QUFDQSxTQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksS0FBSyxNQUF6QixFQUFpQyxLQUFLLENBQXRDLEVBQXlDO0FBQ3ZDLFVBQUksTUFBTSxLQUFLLENBQUwsQ0FBTixFQUFlLE1BQWYsS0FBMEIsQ0FBMUIsSUFBK0IsZUFBZSxLQUFmLEVBQXNCLEtBQXRCLEVBQTZCLENBQTdCLENBQW5DLEVBQW9FO0FBQ2xFLGVBQU8sSUFBUDtBQUNELE9BRkQsTUFFTyxJQUFJLE1BQU0sS0FBSyxDQUFMLENBQU4sRUFBZSxNQUFmLEtBQTBCLENBQTlCLEVBQWlDO0FBQ3RDLGNBQU0sSUFBSSxLQUFKLENBQVUs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QUFkLEVBQW9CLFVBQXBCLENBQWYsSUFBa0QsNEJBQWUsS0FBSyxNQUFwQixFQUE0QixVQUE1QixDQUF0RCxFQUErRjtBQUM3RixhQUFPLElBQVAsQ0FBWSxJQUFaO0FBQ0QsS0FGRCxNQUVPLElBQUksS0FBSyxVQUFMLElBQW1CLE9BQU8sTUFBUCxLQUFrQixDQUF6QyxFQUE0QztBQUNqRCxhQUFPLElBQVAsQ0FBWSxJQUFaO0FBQ0QsS0FGTSxNQUVBLElBQUksQ0FBQyxLQUFLLFVBQU4sSUFBb0IsQ0FBQyxLQUFLLE1BQTlCLEVBQXNDO0FBQzNDLGFBQU8sSUFBUCxDQUFZLElBQVo7QUFDRDtBQUNGO0FBQ0QsU0FBTyxNQUFQO0FBQ0Q7Ozs7Ozs7Ozs7OztBQzFERDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBSkE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7UUFHUyxNO1FBQVEsbUI7UUFBcUIsUSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJjb25zdCBGaWx0ZXJzID0ge1xuICBmZWF0dXJlaWQ6ICh2YWx1ZSwgcHJvcHMpID0+IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodmFsdWVbaV0gPT09IHByb3BzLmZpZCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBub3Q6ICh2YWx1ZSwgcHJvcHMpID0+ICFmaWx0ZXJTZWxlY3Rvcih2YWx1ZSwgcHJvcHMpLFxuICBvcjogKHZhbHVlLCBwcm9wcykgPT4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICBpZiAodmFsdWVba2V5c1tpXV0ubGVuZ3RoID09PSAxICYmIGZpbHRlclNlbGVjdG9yKHZhbHVlLCBwcm9wcywgaSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlW2tleXNbaV1dLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ211bHRpcGxlIG9wcyBvZiBzYW1lIHR5cGUgbm90IGltcGxlbWVudGVkIHlldCcpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIHByb3BlcnR5aXNlcXVhbHRvOiAodmFsdWUsIHByb3BzKSA9PlxuICAgIHByb3BzW3ZhbHVlWycwJ10ucHJvcGVydHluYW1lXSAmJiBwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0gPT09IHZhbHVlWycwJ10ubGl0ZXJhbCxcbiAgcHJvcGVydHlpc2xlc3N0aGFuOiAodmFsdWUsIHByb3BzKSA9PlxuICAgIHByb3BzW3ZhbHVlWycwJ10ucHJvcGVydHluYW1lXSAmJlxuICAgIE51bWJlcihwcm9wc1t2YWx1ZVsnMCddLnByb3BlcnR5bmFtZV0pIDwgTnVtYmVyKHZhbHVlWycwJ10ubGl0ZXJhbCksXG59O1xuXG4vKipcbiAqIFtmaWx0ZXJTZWxlY3RvciBkZXNjcmlwdGlvbl1cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0gIHtGaWx0ZXJ9IGZpbHRlclxuICogQHBhcmFtICB7b2JqZWN0fSBwcm9wZXJ0aWVzIGZlYXR1cmUgcHJvcGVydGllc1xuICogQHBhcmFtIHtudW1iZXJ9IGtleSBpbmRleCBvZiBwcm9wZXJ0eSB0byB1c2VcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWx0ZXJTZWxlY3RvcihmaWx0ZXIsIHByb3BlcnRpZXMsIGtleSA9IDApIHtcbiAgY29uc3QgdHlwZSA9IE9iamVjdC5rZXlzKGZpbHRlcilba2V5XTtcbiAgaWYgKEZpbHRlcnNbdHlwZV0pIHtcbiAgICBpZiAoRmlsdGVyc1t0eXBlXShmaWx0ZXJbdHlwZV0sIHByb3BlcnRpZXMpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbmtvd24gZmlsdGVyICR7dHlwZX1gKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogW3NjYWxlU2VsZWN0b3IgZGVzY3JpcHRpb25dXG4gKiBUaGUgXCJzdGFuZGFyZGl6ZWQgcmVuZGVyaW5nIHBpeGVsIHNpemVcIiBpcyBkZWZpbmVkIHRvIGJlIDAuMjhtbSDDlyAwLjI4bW1cbiAqIEBwYXJhbSAge1J1bGV9IHJ1bGVcbiAqIEBwYXJhbSAge251bWJlcn0gcmVzb2x1dGlvbiAgbS9weFxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjYWxlU2VsZWN0b3IocnVsZSwgcmVzb2x1dGlvbikge1xuICBpZiAocnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQgJiYgcnVsZS5taW5zY2FsZWRlbm9taW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoXG4gICAgICByZXNvbHV0aW9uIC8gMC4wMDAyOCA8IHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvciAmJlxuICAgICAgcmVzb2x1dGlvbiAvIDAuMDAwMjggPiBydWxlLm1pbnNjYWxlZGVub21pbmF0b3JcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHJ1bGUubWF4c2NhbGVkZW5vbWluYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHJlc29sdXRpb24gLyAwLjAwMDI4IDwgcnVsZS5tYXhzY2FsZWRlbm9taW5hdG9yO1xuICB9XG4gIGlmIChydWxlLm1pbnNjYWxlZGVub21pbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiByZXNvbHV0aW9uIC8gMC4wMDAyOCA+IHJ1bGUubWluc2NhbGVkZW5vbWluYXRvcjtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbiIsIi8qKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge3N0cmluZ30gaGV4ICAgZWcgI0FBMDBGRlxuICogQHBhcmFtICB7TnVtYmVyfSBhbHBoYSBlZyAwLjVcbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgcmdiYSgwLDAsMCwwKVxuICovXG5mdW5jdGlvbiBoZXhUb1JHQihoZXgsIGFscGhhKSB7XG4gIGNvbnN0IHIgPSBwYXJzZUludChoZXguc2xpY2UoMSwgMyksIDE2KTtcbiAgY29uc3QgZyA9IHBhcnNlSW50KGhleC5zbGljZSgzLCA1KSwgMTYpO1xuICBjb25zdCBiID0gcGFyc2VJbnQoaGV4LnNsaWNlKDUsIDcpLCAxNik7XG4gIGlmIChhbHBoYSkge1xuICAgIHJldHVybiBgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2FscGhhfSlgO1xuICB9XG4gIHJldHVybiBgcmdiKCR7cn0sICR7Z30sICR7Yn0pYDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgb3BlbmxheWVycyBzdHlsZSBmcm9tIG9iamVjdCByZXR1cm5lZCBieSBydWxlc0NvbnZlcnRlclxuICogQHBhcmFtIHtvbC5zdHlsZX0gb2xzdHlsZSBvbC5zdHlsZSBodHRwOi8vb3BlbmxheWVycy5vcmcvZW4vbGF0ZXN0L2FwaWRvYy9vbC5zdHlsZS5odG1sXG4gKiBAcGFyYW0ge1N0eWxlRGVzY3JpcHRpb259IHN0eWxlRGVzY3JpcHRpb24gcnVsZXNjb252ZXJ0ZXJcbiAqIEByZXR1cm4gb2wuU3R5bGUuU3R5bGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gT2xTdHlsZXIob2xzdHlsZSwgc3R5bGVEZXNjcmlwdGlvbikge1xuICBjb25zdCBmaWxsID0gbmV3IG9sc3R5bGUuRmlsbCh7XG4gICAgY29sb3I6XG4gICAgICBzdHlsZURlc2NyaXB0aW9uLmZpbGxPcGFjaXR5ICYmXG4gICAgICBzdHlsZURlc2NyaXB0aW9uLmZpbGxDb2xvciAmJlxuICAgICAgc3R5bGVEZXNjcmlwdGlvbi5maWxsQ29sb3Iuc2xpY2UoMCwgMSkgPT09ICcjJ1xuICAgICAgICA/IGhleFRvUkdCKHN0eWxlRGVzY3JpcHRpb24uZmlsbENvbG9yLCBzdHlsZURlc2NyaXB0aW9uLmZpbGxPcGFjaXR5KVxuICAgICAgICA6IHN0eWxlRGVzY3JpcHRpb24uZmlsbENvbG9yLFxuICB9KTtcbiAgY29uc3Qgc3Ryb2tlID0gbmV3IG9sc3R5bGUuU3Ryb2tlKHtcbiAgICBjb2xvcjogc3R5bGVEZXNjcmlwdGlvbi5zdHJva2VDb2xvcixcbiAgICB3aWR0aDogc3R5bGVEZXNjcmlwdGlvbi5zdHJva2VXaWR0aCxcbiAgICBsaW5lQ2FwOiBzdHlsZURlc2NyaXB0aW9uLnN0cm9rZUxpbmVjYXAgJiYgc3R5bGVEZXNjcmlwdGlvbi5zdHJva2VEYXNoYXJyYXksXG4gICAgbGluZURhc2g6IHN0eWxlRGVzY3JpcHRpb24uc3Ryb2tlRGFzaGFycmF5ICYmIHN0eWxlRGVzY3JpcHRpb24uc3Ryb2tlRGFzaGFycmF5LnNwbGl0KCcgJyksXG4gICAgbGluZURhc2hPZmZzZXQ6IHN0eWxlRGVzY3JpcHRpb24uc3Ryb2tlRGFzaG9mZnNldCAmJiBzdHlsZURlc2NyaXB0aW9uLnN0cm9rZURhc2hvZmZzZXQsXG4gICAgbGluZUpvaW46IHN0eWxlRGVzY3JpcHRpb24uc3Ryb2tlTGluZWpvaW4gJiYgc3R5bGVEZXNjcmlwdGlvbi5zdHJva2VMaW5lam9pbixcbiAgfSk7XG4gIGNvbnN0IHN0eWxlcyA9IFtcbiAgICBuZXcgb2xzdHlsZS5TdHlsZSh7XG4gICAgICBpbWFnZTogbmV3IG9sc3R5bGUuQ2lyY2xlKHtcbiAgICAgICAgZmlsbCxcbiAgICAgICAgc3Ryb2tlLFxuICAgICAgICByYWRpdXM6IDUsXG4gICAgICB9KSxcbiAgICAgIGZpbGwsXG4gICAgICBzdHJva2UsXG4gICAgfSksXG4gIF07XG4gIHJldHVybiBzdHlsZXM7XG59XG4iLCIvKipcbiAqIEdlbmVyaWMgcGFyc2VyIGZvciBlbGVtZW50cyB3aXRoIG1heE9jY3VycyA+IDFcbiAqIGl0IHB1c2hlcyByZXN1bHQgb2YgcmVhZE5vZGUobm9kZSkgdG8gYXJyYXkgb24gb2JqW3Byb3BdXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtFbGVtZW50fSBub2RlIHRoZSB4bWwgZWxlbWVudCB0byBwYXJzZVxuICogQHBhcmFtIHtvYmplY3R9IG9iaiAgdGhlIG9iamVjdCB0byBtb2RpZnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wIGtleSBvbiBvYmogdG8gaG9sZCBhcnJheVxuICovXG5mdW5jdGlvbiBhZGRQcm9wQXJyYXkobm9kZSwgb2JqLCBwcm9wKSB7XG4gIGNvbnN0IHByb3BlcnR5ID0gcHJvcC50b0xvd2VyQ2FzZSgpO1xuICBvYmpbcHJvcGVydHldID0gb2JqW3Byb3BlcnR5XSB8fCBbXTtcbiAgY29uc3QgaXRlbSA9IHt9O1xuICByZWFkTm9kZShub2RlLCBpdGVtKTtcbiAgb2JqW3Byb3BlcnR5XS5wdXNoKGl0ZW0pO1xufVxuXG4vKipcbiAqIEdlbmVyaWMgcGFyc2VyIGZvciBtYXhPY2N1cnMgPSAxXG4gKiBpdCBzZXRzIHJlc3VsdCBvZiByZWFkTm9kZShub2RlKSB0byBhcnJheSBvbiBvYmpbcHJvcF1cbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0VsZW1lbnR9IG5vZGUgdGhlIHhtbCBlbGVtZW50IHRvIHBhcnNlXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqICB0aGUgb2JqZWN0IHRvIG1vZGlmeVxuICogQHBhcmFtIHtzdHJpbmd9IHByb3Aga2V5IG9uIG9iaiB0byBob2xkIGVtcHR5IG9iamVjdFxuICovXG5mdW5jdGlvbiBhZGRQcm9wKG5vZGUsIG9iaiwgcHJvcCkge1xuICBjb25zdCBwcm9wZXJ0eSA9IHByb3AudG9Mb3dlckNhc2UoKTtcbiAgb2JqW3Byb3BlcnR5XSA9IHt9O1xuICByZWFkTm9kZShub2RlLCBvYmpbcHJvcGVydHldKTtcbn1cblxuLyoqXG4gKiByZWNpZXZlcyB0ZXh0Y29udGVudCBvZiBlbGVtZW50IHdpdGggdGFnTmFtZVxuICogQHByaXZhdGVcbiAqIEBwYXJhbSAge0VsZW1lbnR9IGVsZW1lbnQgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSB0YWdOYW1lIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZ2V0VGV4dChlbGVtZW50LCB0YWdOYW1lKSB7XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpO1xuICByZXR1cm4gY29sbGVjdGlvbi5sZW5ndGggPyBjb2xsZWN0aW9uLml0ZW0oMCkudGV4dENvbnRlbnQgOiAnJztcbn1cblxuLyoqXG4gKiByZWNpZXZlcyBib29sZWFuIG9mIGVsZW1lbnQgd2l0aCB0YWdOYW1lXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7RWxlbWVudH0gZWxlbWVudCBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtzdHJpbmd9IHRhZ05hbWUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gZ2V0Qm9vbChlbGVtZW50LCB0YWdOYW1lKSB7XG4gIGNvbnN0IGNvbGxlY3Rpb24gPSBlbGVtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKHRhZ05hbWUpO1xuICBpZiAoY29sbGVjdGlvbi5sZW5ndGgpIHtcbiAgICByZXR1cm4gQm9vbGVhbihjb2xsZWN0aW9uLml0ZW0oMCkudGV4dENvbnRlbnQpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBFYWNoIHByb3BuYW1lIGlzIGEgdGFnIGluIHRoZSBzbGQgdGhhdCBzaG91bGQgYmUgY29udmVydGVkIHRvIHBsYWluIG9iamVjdFxuICogQHByaXZhdGVcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbmNvbnN0IHBhcnNlcnMgPSB7XG4gIE5hbWVkTGF5ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBhZGRQcm9wQXJyYXkoZWxlbWVudCwgb2JqLCAnbGF5ZXJzJyk7XG4gIH0sXG4gIFVzZXJTdHlsZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5zdHlsZXMgPSBvYmouc3R5bGVzIHx8IFtdO1xuICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgLy8gbmFtZTogZ2V0VGV4dChlbGVtZW50LCAnc2xkOk5hbWUnKSxcbiAgICAgIGRlZmF1bHQ6IGdldEJvb2woZWxlbWVudCwgJ3NsZDpJc0RlZmF1bHQnKSxcbiAgICAgIGZlYXR1cmV0eXBlc3R5bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIHN0eWxlKTtcbiAgICBvYmouc3R5bGVzLnB1c2goc3R5bGUpO1xuICB9LFxuICBGZWF0dXJlVHlwZVN0eWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXR5cGVzdHlsZSA9IHtcbiAgICAgIHJ1bGVzOiBbXSxcbiAgICB9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIGZlYXR1cmV0eXBlc3R5bGUpO1xuICAgIG9iai5mZWF0dXJldHlwZXN0eWxlcy5wdXNoKGZlYXR1cmV0eXBlc3R5bGUpO1xuICB9LFxuICBSdWxlOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgY29uc3QgcnVsZSA9IHt9O1xuICAgIHJlYWROb2RlKGVsZW1lbnQsIHJ1bGUpO1xuICAgIG9iai5ydWxlcy5wdXNoKHJ1bGUpO1xuICB9LFxuICBGaWx0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZmlsdGVyID0ge307XG4gICAgcmVhZE5vZGUoZWxlbWVudCwgb2JqLmZpbHRlcik7XG4gIH0sXG4gIEVsc2VGaWx0ZXI6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZWxzZWZpbHRlciA9IHRydWU7XG4gIH0sXG4gIE9yOiBhZGRQcm9wLFxuICBBbmQ6IGFkZFByb3AsXG4gIE5vdDogYWRkUHJvcCxcbiAgUHJvcGVydHlJc0VxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc05vdEVxdWFsVG86IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0xlc3NUaGFuOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5SXNMZXNzVGhhbk9yRXF1YWxUbzogYWRkUHJvcEFycmF5LFxuICBQcm9wZXJ0eUlzR3JlYXRlclRoYW46IGFkZFByb3BBcnJheSxcbiAgUHJvcGVydHlJc0dyZWF0ZXJUaGFuT3JFcXVhbFRvOiBhZGRQcm9wQXJyYXksXG4gIFByb3BlcnR5TmFtZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5wcm9wZXJ0eW5hbWUgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBMaXRlcmFsOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmxpdGVyYWwgPSBlbGVtZW50LnRleHRDb250ZW50O1xuICB9LFxuICBGZWF0dXJlSWQ6IChlbGVtZW50LCBvYmopID0+IHtcbiAgICBvYmouZmVhdHVyZWlkID0gb2JqLmZlYXR1cmVpZCB8fCBbXTtcbiAgICBvYmouZmVhdHVyZWlkLnB1c2goZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ2ZpZCcpKTtcbiAgfSxcbiAgTmFtZTogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5uYW1lID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgTWF4U2NhbGVEZW5vbWluYXRvcjogKGVsZW1lbnQsIG9iaikgPT4ge1xuICAgIG9iai5tYXhzY2FsZWRlbm9taW5hdG9yID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgfSxcbiAgUG9seWdvblN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIExpbmVTeW1ib2xpemVyOiBhZGRQcm9wLFxuICBQb2ludFN5bWJvbGl6ZXI6IGFkZFByb3AsXG4gIEZpbGw6IGFkZFByb3AsXG4gIFN0cm9rZTogYWRkUHJvcCxcbiAgRXh0ZXJuYWxHcmFwaGljOiBhZGRQcm9wLFxuICBPbmxpbmVSZXNvdXJjZTogZWxlbWVudCA9PiBnZXRUZXh0KGVsZW1lbnQsICdzbGQ6T25saW5lUmVzb3VyY2UnKSxcbiAgQ3NzUGFyYW1ldGVyOiAoZWxlbWVudCwgb2JqKSA9PiB7XG4gICAgb2JqLmNzcyA9IG9iai5jc3MgfHwgW107XG4gICAgb2JqLmNzcy5wdXNoKHtcbiAgICAgIG5hbWU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCduYW1lJyksXG4gICAgICB2YWx1ZTogZWxlbWVudC50ZXh0Q29udGVudC50cmltKCksXG4gICAgfSk7XG4gIH0sXG59O1xuXG4vKipcbiAqIHdhbGtzIG92ZXIgeG1sIG5vZGVzXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7RWxlbWVudH0gbm9kZSBkZXJpdmVkIGZyb20geG1sXG4gKiBAcGFyYW0gIHtvYmplY3R9IG9iaiByZWNpZXZlcyByZXN1bHRzXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiByZWFkTm9kZShub2RlLCBvYmopIHtcbiAgZm9yIChsZXQgbiA9IG5vZGUuZmlyc3RFbGVtZW50Q2hpbGQ7IG47IG4gPSBuLm5leHRFbGVtZW50U2libGluZykge1xuICAgIGlmIChwYXJzZXJzW24ubG9jYWxOYW1lXSkge1xuICAgICAgcGFyc2Vyc1tuLmxvY2FsTmFtZV0obiwgb2JqLCBuLmxvY2FsTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG9iamVjdCBmcm9tIGFuIHNsZCB4bWwgc3RyaW5nLCBmb3IgaW50ZXJuYWwgdXNhZ2VcbiAqIEBwYXJhbSAge3N0cmluZ30gc2xkIHhtbCBzdHJpbmdcbiAqIEByZXR1cm4ge1N0eWxlZExheWVyRGVzY3JpcHRvcn0gIG9iamVjdCByZXByZXNlbnRpbmcgc2xkIHN0eWxlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJlYWRlcihzbGQpIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcbiAgY29uc3QgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhzbGQsICdhcHBsaWNhdGlvbi94bWwnKTtcblxuICBmb3IgKGxldCBuID0gZG9jLmZpcnN0Q2hpbGQ7IG47IG4gPSBuLm5leHRTaWJsaW5nKSB7XG4gICAgcmVzdWx0LnZlcnNpb24gPSBuLmdldEF0dHJpYnV0ZSgndmVyc2lvbicpO1xuICAgIHJlYWROb2RlKG4sIHJlc3VsdCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqXG4gKiBAdHlwZWRlZiBTdHlsZWRMYXllckRlc2NyaXB0b3JcbiAqIEBuYW1lIFN0eWxlZExheWVyRGVzY3JpcHRvclxuICogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgU3R5bGVkTGF5ZXJEZXNjcmlwdG9yIHtAbGluayBodHRwOi8vc2NoZW1hcy5vcGVuZ2lzLm5ldC9zbGQvMS4xL1N0eWxlZExheWVyRGVzY3JpcHRvci54c2QgeHNkfVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHZlcnNpb24gc2xkIHZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7TGF5ZXJbXX0gbGF5ZXJzIGluZm8gZXh0cmFjdGVkIGZyb20gTmFtZWRMYXllciBlbGVtZW50XG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBMYXllclxuICogQG5hbWUgTGF5ZXJcbiAqIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIExheWVyLCB0aGUgYWN0dWFsIHN0eWxlIG9iamVjdCBmb3IgYSBzaW5nbGUgbGF5ZXJcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBuYW1lIGxheWVyIG5hbWVcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0W119IHN0eWxlcyBTZWUgZXhwbGFuYXRpb24gYXQgW0dlb3NlcnZlciBkb2NzXShodHRwOi8vZG9jcy5nZW9zZXJ2ZXIub3JnL3N0YWJsZS9lbi91c2VyL3N0eWxpbmcvc2xkL3JlZmVyZW5jZS9zdHlsZXMuaHRtbClcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gc3R5bGVzW10uZGVmYXVsdFxuICogQHByb3BlcnR5IHtTdHJpbmd9IFtzdHlsZXNbXS5uYW1lXVxuICogQHByb3BlcnR5IHtGZWF0dXJlVHlwZVN0eWxlW119IHN0eWxlc1tdLmZlYXR1cmV0eXBlc3R5bGVzIEdlb3NlcnZlciB3aWxsIGRyYXcgbXVsdGlwbGUsXG4gKiBsaWJyYXJpZXMgYXMgb3BlbmxheWVycyBjYW4gb25seSB1c2Ugb25lIGRlZmluaXRpb24hXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBGZWF0dXJlVHlwZVN0eWxlXG4gKiBAbmFtZSBGZWF0dXJlVHlwZVN0eWxlXG4gKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBGZWF0dXJlVHlwZVN0eWxlOiB7QGxpbmsgaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvRmVhdHVyZVN0eWxlLnhzZCB4c2R9XG4gKiBAcHJvcGVydHkge1J1bGVbXX0gcnVsZXNcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIFJ1bGVcbiAqIEBuYW1lIFJ1bGVcbiAqIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFJ1bGUgdG8gbWF0Y2ggYSBmZWF0dXJlOiB7QGxpbmsgaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvRmVhdHVyZVN0eWxlLnhzZCB4c2R9XG4gKiBAcHJvcGVydHkge3N0cmluZ30gbmFtZSBydWxlIG5hbWVcbiAqIEBwcm9wZXJ0eSB7RmlsdGVyfSBbZmlsdGVyXVxuICogQHByb3BlcnR5IHtib29sZWFufSBbZWxzZWZpbHRlcl1cbiAqIEBwcm9wZXJ0eSB7aW50ZWdlcn0gW21pbnNjYWxlZGVub21pbmF0b3JdXG4gKiBAcHJvcGVydHkge2ludGVnZXJ9IFttYXhzY2FsZWRlbm9taW5hdG9yXVxuICogQHByb3BlcnR5IHtQb2x5Z29uU3ltYm9saXplcn0gW3BvbHlnb25zeW1ib2xpemVyXVxuICogQHByb3BlcnR5IHtMaW5lU3ltYm9saXplcn0gIFtsaW5lc3ltYm9saXplcl1cbiAqIEBwcm9wZXJ0eSB7UG9pbnRTeW1ib2xpemVyfSBbcG9pbnRzeW1ib2xpemVyXVxuICogKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBGaWx0ZXJcbiAqIEBuYW1lIEZpbHRlclxuICogQGRlc2NyaXB0aW9uIFtvZ2MgZmlsdGVyc10oIGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L2ZpbHRlci8xLjEuMC9maWx0ZXIueHNkKSBzaG91bGQgaGF2ZSBvbmx5IG9uZSBwcm9wXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBbZmVhdHVyZWlkXVxuICogQHByb3BlcnR5IHtvYmplY3R9IFtvcl0gIGZpbHRlclxuICogQHByb3BlcnR5IHtvYmplY3R9IFthbmRdICBmaWx0ZXJcbiAqIEBwcm9wZXJ0eSB7b2JqZWN0fSBbbm90XSAgZmlsdGVyXG4gKiBAcHJvcGVydHkge29iamVjdFtdfSBbcHJvcGVydHlpc2VxdWFsdG9dICBwcm9wZXJ0eW5hbWUgJiBsaXRlcmFsXG4gKiBAcHJvcGVydHkge29iamVjdFtdfSBbcHJvcGVydHlpc2xlc3N0aGFuXSAgcHJvcGVydHluYW1lICYgbGl0ZXJhbFxuICogKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBQb2x5Z29uU3ltYm9saXplclxuICogQG5hbWUgUG9seWdvblN5bWJvbGl6ZXJcbiAqIEBkZXNjcmlwdGlvbiBhIHR5cGVkZWYgZm9yIFtQb2x5Z29uU3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4gKiBAcHJvcGVydHkge09iamVjdH0gZmlsbFxuICogQHByb3BlcnR5IHthcnJheX0gZmlsbC5jc3NcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBzdHJva2VcbiAqIEBwcm9wZXJ0eSB7YXJyYXl9IHN0cm9rZS5jc3NcbiAqICovXG5cbi8qKlxuICogQHR5cGVkZWYgTGluZVN5bWJvbGl6ZXJcbiAqIEBuYW1lIExpbmVTeW1ib2xpemVyXG4gKiBAZGVzY3JpcHRpb24gYSB0eXBlZGVmIGZvciBbTGluZVN5bWJvbGl6ZXJdKGh0dHA6Ly9zY2hlbWFzLm9wZW5naXMubmV0L3NlLzEuMS4wL1N5bWJvbGl6ZXIueHNkKVxuICogQHByb3BlcnR5IHtPYmplY3R9IHN0cm9rZVxuICogQHByb3BlcnR5IHthcnJheX0gc3Ryb2tlLmNzc1xuICogKi9cblxuLyoqXG4gKiBAdHlwZWRlZiBQb2ludFN5bWJvbGl6ZXJcbiAqIEBuYW1lIFBvaW50U3ltYm9saXplclxuICogQGRlc2NyaXB0aW9uIGEgdHlwZWRlZiBmb3IgW1BvaW50U3ltYm9saXplcl0oaHR0cDovL3NjaGVtYXMub3Blbmdpcy5uZXQvc2UvMS4xLjAvU3ltYm9saXplci54c2QpXG4gKiBAcHJvcGVydHkge09iamVjdH0gZ3JhcGhpY1xuICogQHByb3BlcnR5IHtPYmplY3R9IGdyYXBoaWMuZXh0ZXJuYWxncmFwaGljXG4gKiBAcHJvcGVydHkge3N0cmluZ30gZ3JhcGhpYy5leHRlcm5hbGdyYXBoaWMub25saW5lcmVzb3VyY2VcbiAqICovXG4iLCIvKipcbiAqIFRPRE8gd3JpdGUgdHlwZWRlZiBmb3IgcmV0dXJuIHZhbHVlIGJldHRlciBmdW5jdGlvbiBuYW1lc1xuICogQHBhcmFtICB7UnVsZVtdfSBydWxlcyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgIHNlZSBsZWFmbGV0IHBhdGggZm9yIGluc3BpcmF0aW9uXG4gKi9cbmZ1bmN0aW9uIGdldFN0eWxlRGVzY3JpcHRpb24ocnVsZXMpIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAocnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIgJiYgcnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIuZmlsbCkge1xuICAgICAgY29uc3QgZmlsbCA9IHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLmZpbGw7XG4gICAgICBmaWxsUnVsZXMoZmlsbCwgcmVzdWx0KTtcbiAgICB9XG4gICAgaWYgKHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyICYmIHJ1bGVzW2ldLnBvbHlnb25zeW1ib2xpemVyLnN0cm9rZSkge1xuICAgICAgY29uc3Qgc3Ryb2tlID0gcnVsZXNbaV0ucG9seWdvbnN5bWJvbGl6ZXIuc3Ryb2tlO1xuICAgICAgc3Ryb2tlUnVsZXMoc3Ryb2tlLCByZXN1bHQpO1xuICAgIH1cbiAgICBpZiAocnVsZXNbaV0ubGluZXN5bWJvbGl6ZXIgJiYgcnVsZXNbaV0ubGluZXN5bWJvbGl6ZXIuc3Ryb2tlKSB7XG4gICAgICBjb25zdCBzdHJva2UgPSBydWxlc1tpXS5saW5lc3ltYm9saXplci5zdHJva2U7XG4gICAgICBzdHJva2VSdWxlcyhzdHJva2UsIHJlc3VsdCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHN0cm9rZVJ1bGVzKHN0cm9rZSwgcmVzdWx0KSB7XG4gIGZvciAobGV0IGogPSAwOyBqIDwgc3Ryb2tlLmNzcy5sZW5ndGg7IGogKz0gMSkge1xuICAgIHN3aXRjaCAoc3Ryb2tlLmNzc1tqXS5uYW1lKSB7XG4gICAgICBjYXNlICdzdHJva2UnOlxuICAgICAgICByZXN1bHQuc3Ryb2tlQ29sb3IgPSBzdHJva2UuY3NzW2pdLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgY29uc3Qga2V5ID0gc3Ryb2tlLmNzc1tqXS5uYW1lXG4gICAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICAucmVwbGFjZSgvLSguKS9nLCAobWF0Y2gsIGdyb3VwMSkgPT4gZ3JvdXAxLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICByZXN1bHRba2V5XSA9IHN0cm9rZS5jc3Nbal0udmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogW2ZpbGwgZGVzY3JpcHRpb25dXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtICB7b2JqZWN0fSBmaWxsIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7b2JqZWN0fSByZXN1bHQgcHJvcHMgd2lsbCBiZSBhZGRlZCB0b1xuICogQHJldHVybiB7dm9pZH0gICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmZ1bmN0aW9uIGZpbGxSdWxlcyhmaWxsLCByZXN1bHQpIHtcbiAgZm9yIChsZXQgaiA9IDA7IGogPCBmaWxsLmNzcy5sZW5ndGg7IGogKz0gMSkge1xuICAgIHN3aXRjaCAoZmlsbC5jc3Nbal0ubmFtZSkge1xuICAgICAgY2FzZSAnZmlsbCc6XG4gICAgICAgIHJlc3VsdC5maWxsQ29sb3IgPSBmaWxsLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdmaWxsLW9wYWNpdHknOlxuICAgICAgICByZXN1bHQuZmlsbE9wYWNpdHkgPSBmaWxsLmNzc1tqXS52YWx1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBnZXRTdHlsZURlc2NyaXB0aW9uO1xuXG4vKipcbiAqIEB0eXBlZGVmIFN0eWxlRGVzY3JpcHRpb25cbiAqIEBuYW1lIFN0eWxlRGVzY3JpcHRpb25cbiAqIEBkZXNjcmlwdGlvbiBhIGZsYXQgb2JqZWN0IG9mIHByb3BzIGV4dHJhY3RlZCBmcm9tIGFuIGFycmF5IG9mIHJ1bDtlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGxDb2xvclxuICogQHByb3BlcnR5IHtzdHJpbmd9IGZpbGxPcGFjaXR5XG4gKi9cbiIsImltcG9ydCB7IHNjYWxlU2VsZWN0b3IsIGZpbHRlclNlbGVjdG9yIH0gZnJvbSAnLi9GaWx0ZXInO1xuLyoqXG4gKiBnZXQgYWxsIGxheWVyIG5hbWVzIGluIHNsZFxuICogQHBhcmFtIHtTdHlsZWRMYXllckRlc2NyaXB0b3J9IHNsZFxuICogQHJldHVybiB7c3RyaW5nW119IHJlZ2lzdGVyZWQgbGF5ZXJuYW1lc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF5ZXJOYW1lcyhzbGQpIHtcbiAgcmV0dXJuIHNsZC5sYXllcnMubWFwKGwgPT4gbC5uYW1lKTtcbn1cblxuLyoqXG4gKiBnZXRsYXllciB3aXRoIG5hbWVcbiAqIEBwYXJhbSAge1N0eWxlZExheWVyRGVzY3JpcHRvcn0gc2xkICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gbGF5ZXJuYW1lIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0xheWVyfSAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF5ZXIoc2xkLCBsYXllcm5hbWUpIHtcbiAgcmV0dXJuIHNsZC5sYXllcnMuZmluZChsID0+IGwubmFtZSA9PT0gbGF5ZXJuYW1lKTtcbn1cblxuLyoqXG4gKiBnZXRTdHlsZU5hbWVzLCBub3RpY2UgbmFtZSBpcyBub3QgcmVxdWlyZWQgZm9yIHVzZXJzdHlsZSwgeW91IG1pZ2h0IGdldCB1bmRlZmluZWRcbiAqIEBwYXJhbSAge0xheWVyfSBsYXllciBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmdbXX0gICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGVOYW1lcyhsYXllcikge1xuICByZXR1cm4gbGF5ZXIuc3R5bGVzLm1hcChzID0+IHMubmFtZSk7XG59XG4vKipcbiAqIGdldCBzdHlsZSwgaWYgbmFtZSBpcyB1bmRlZmluZWQgaXQgcmV0dXJucyBkZWZhdWx0IHN0eWxlLlxuICogbnVsbCBpcyBubyBzdHlsZSBmb3VuZFxuICogQHBhcmFtICB7TGF5ZXJ9IGxheWVyIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIG9mIHN0eWxlXG4gKiBAcmV0dXJuIHtvYmplY3R9IHRoZSBzdHlsZSB3aXRoIG1hdGNoaW5nIG5hbWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxlKGxheWVyLCBuYW1lKSB7XG4gIGlmIChuYW1lKSB7XG4gICAgcmV0dXJuIGxheWVyLnN0eWxlcy5maW5kKHMgPT4gcy5uYW1lID09PSBuYW1lKTtcbiAgfVxuICByZXR1cm4gbGF5ZXIuc3R5bGVzLmZpbmQocyA9PiBzLmRlZmF1bHQpO1xufVxuXG4vKipcbiAqIGdldCBydWxlcyBmb3Igc3BlY2lmaWMgZmVhdHVyZSBhZnRlciBhcHBseWluZyBmaWx0ZXJzXG4gKiBAcGFyYW0gIHtGZWF0dXJlVHlwZVN0eWxlfSBmZWF0dXJlVHlwZVN0eWxlIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge29iamVjdH0gZmVhdHVyZSAgICAgICAgICBhIGdlb2pzb24gZmVhdHVyZVxuICogQHJldHVybiB7UnVsZVtdfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UnVsZXMoZmVhdHVyZVR5cGVTdHlsZSwgZmVhdHVyZSwgcmVzb2x1dGlvbikge1xuICBjb25zdCB7IHByb3BlcnRpZXMgfSA9IGZlYXR1cmU7XG4gIGNvbnN0IHJlc3VsdCA9IFtdO1xuICBmb3IgKGxldCBqID0gMDsgaiA8IGZlYXR1cmVUeXBlU3R5bGUucnVsZXMubGVuZ3RoOyBqICs9IDEpIHtcbiAgICBjb25zdCBydWxlID0gZmVhdHVyZVR5cGVTdHlsZS5ydWxlc1tqXTtcbiAgICBpZiAocnVsZS5maWx0ZXIgJiYgc2NhbGVTZWxlY3RvcihydWxlLCByZXNvbHV0aW9uKSAmJiBmaWx0ZXJTZWxlY3RvcihydWxlLmZpbHRlciwgcHJvcGVydGllcykpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgIH0gZWxzZSBpZiAocnVsZS5lbHNlZmlsdGVyICYmIHJlc3VsdC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgIH0gZWxzZSBpZiAoIXJ1bGUuZWxzZWZpbHRlciAmJiAhcnVsZS5maWx0ZXIpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHJ1bGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIiwiaW1wb3J0IFJlYWRlciBmcm9tICcuL1JlYWRlcic7XG5pbXBvcnQgT2xTdHlsZXIgZnJvbSAnLi9PbFN0eWxlcic7XG5pbXBvcnQgZ2V0U3R5bGVEZXNjcmlwdGlvbiBmcm9tICcuL1N0eWxlRGVzY3JpcHRpb24nO1xuXG5leHBvcnQgKiBmcm9tICcuL1V0aWxzJztcbmV4cG9ydCB7IFJlYWRlciwgZ2V0U3R5bGVEZXNjcmlwdGlvbiwgT2xTdHlsZXIgfTtcbiJdfQ==
