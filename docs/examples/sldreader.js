(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.SLDReader = {})));
}(this, (function (exports) { 'use strict';

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
    var collection = element.getElementsByTagNameNS('http://www.opengis.net/sld', tagName);
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
    var collection = element.getElementsByTagNameNS('http://www.opengis.net/sld', tagName);
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
    Filter: function (element, obj) {
      obj.filter = {};
      readNode(element, obj.filter);
    },
    ElseFilter: function (element, obj) {
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
    PropertyName: function (element, obj) {
      obj.propertyname = element.textContent;
    },
    Literal: function (element, obj) {
      obj.literal = element.textContent;
    },
    FeatureId: function (element, obj) {
      obj.featureid = obj.featureid || [];
      obj.featureid.push(element.getAttribute('fid'));
    },
    Name: function (element, obj) {
      obj.name = element.textContent;
    },
    MaxScaleDenominator: function (element, obj) {
      obj.maxscaledenominator = element.textContent;
    },
    PolygonSymbolizer: addProp,
    LineSymbolizer: addProp,
    PointSymbolizer: addProp,
    Fill: addProp,
    Stroke: addProp,
    ExternalGraphic: addProp,
    OnlineResource: function (element) { return getText(element, 'sld:OnlineResource'); },
    CssParameter: function (element, obj) {
      obj.css = obj.css || [];
      obj.css.push({
        name: element.getAttribute('name'),
        value: element.textContent.trim(),
      });
    },
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

  /**
   * Create openlayers style from object returned by rulesConverter
   * @param {ol.style} olstyle ol.style http://openlayers.org/en/latest/apidoc/ol.style.html
   * @param {StyleDescription} styleDescription rulesconverter
   * @return ol.Style.Style
   */
  function OlStyler(olstyle, styleDescription) {
    var fill = new olstyle.Fill({
      color:
        styleDescription.fillOpacity &&
        styleDescription.fillColor &&
        styleDescription.fillColor.slice(0, 1) === '#'
          ? hexToRGB(styleDescription.fillColor, styleDescription.fillOpacity)
          : styleDescription.fillColor,
    });
    var stroke = new olstyle.Stroke({
      color: styleDescription.strokeColor,
      width: styleDescription.strokeWidth,
      lineCap: styleDescription.strokeLinecap && styleDescription.strokeDasharray,
      lineDash: styleDescription.strokeDasharray && styleDescription.strokeDasharray.split(' '),
      lineDashOffset: styleDescription.strokeDashoffset && styleDescription.strokeDashoffset,
      lineJoin: styleDescription.strokeLinejoin && styleDescription.strokeLinejoin,
    });
    var styles = [
      new olstyle.Style({
        image: new olstyle.Circle({
          fill: fill,
          stroke: stroke,
          radius: 5,
        }),
        fill: fill,
        stroke: stroke,
      }) ];
    return styles;
  }

  /**
   * TODO write typedef for return value better function names
   * @param  {Rule[]} rules [description]
   * @return {StyleDescription}
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
        var stroke$1 = rules[i].linesymbolizer.stroke;
        strokeRules(stroke$1, result);
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
        default: {
          var key = stroke.css[j].name
            .toLowerCase()
            .replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });
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

  /**
   * @typedef StyleDescription
   * @name StyleDescription
   * @description a flat object of props extracted from an array of rul;es
   * @property {string} fillColor
   * @property {string} fillOpacity
   */

  var Filters = {
    featureid: function (value, props) {
      for (var i = 0; i < value.length; i += 1) {
        if (value[i] === props.fid) {
          return true;
        }
      }
      return false;
    },
    not: function (value, props) { return !filterSelector(value, props); },
    or: function (value, props) {
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
    propertyisequalto: function (value, props) { return props[value['0'].propertyname] && props[value['0'].propertyname] === value['0'].literal; },
    propertyislessthan: function (value, props) { return props[value['0'].propertyname] &&
      Number(props[value['0'].propertyname]) < Number(value['0'].literal); },
  };

  /**
   * [filterSelector description]
   * @private
   * @param  {Filter} filter
   * @param  {object} properties feature properties
   * @param {number} key index of property to use
   * @return {boolean}
   */
  function filterSelector(filter, properties, key) {
    if ( key === void 0 ) key = 0;

    var type = Object.keys(filter)[key];
    if (Filters[type]) {
      if (Filters[type](filter[type], properties)) {
        return true;
      }
    } else {
      throw new Error(("Unkown filter " + type));
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
   * get style, if name is undefined it returns default style.
   * null is no style found
   * @param  {Layer} layer [description]
   * @param {string} name of style
   * @return {object} the style with matching name
   */
  function getStyle(layer, name) {
    if (name) {
      return layer.styles.find(function (s) { return s.name === name; });
    }
    return layer.styles.find(function (s) { return s.default; });
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
      if (rule.filter && scaleSelector(rule, resolution) && filterSelector(rule.filter, properties)) {
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
  exports.getStyleDescription = getStyleDescription;
  exports.OlStyler = OlStyler;
  exports.getLayerNames = getLayerNames;
  exports.getLayer = getLayer;
  exports.getStyleNames = getStyleNames;
  exports.getStyle = getStyle;
  exports.getRules = getRules;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
