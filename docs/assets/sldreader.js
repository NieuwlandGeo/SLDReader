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
   * Assigns textcontnet to obj.prop
   * @private
   * @param {Element} node [description]
   * @param {object} obj  [description]
   * @param {string} prop [description]
   */
  function addPropWithTextContent(node, obj, prop) {
    var property = prop.toLowerCase();
    obj[property] = node.textContent;
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
    PropertyName: addPropWithTextContent,
    Literal: addPropWithTextContent,
    FeatureId: function (element, obj) {
      obj.featureid = obj.featureid || [];
      obj.featureid.push(element.getAttribute('fid'));
    },
    Name: addPropWithTextContent,
    MaxScaleDenominator: addPropWithTextContent,
    PolygonSymbolizer: addProp,
    LineSymbolizer: addProp,
    PointSymbolizer: addProp,
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
    CssParameter: function (element, obj) {
      obj.css = obj.css || {};
      var name = element
        .getAttribute('name')
        .toLowerCase()
        .replace(/-(.)/g, function (match, group1) { return group1.toUpperCase(); });
      obj.css[name] = element.textContent.trim();
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
    return new Style({
      fill: new Fill({
        color:
          style.fillOpacity && style.fill && style.fill.slice(0, 1) === '#'
            ? hexToRGB(style.fill, style.fillOpacity)
            : style.fill,
      }),
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

  function lineStyle(style) {
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

  function pointStyle(style) {
    if (style.externalgraphic && style.externalgraphic.onlineresource) {
      return new Style({
        image: new Icon({ src: style.externalgraphic.onlineresource }),
      });
    }
    if (style.mark && style.mark.wellknownname === 'cross') {
      return new Style({
        image: new RegularShape({
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'black', width: 2 }),
          points: 4,
          radius: 10,
          radius2: 0,
          angle: 0,
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

  var Filters = {
    featureid: function (value, feature) {
      for (var i = 0; i < value.length; i += 1) {
        if (value[i] === feature.id) {
          return true;
        }
      }
      return false;
    },
    not: function (value, feature) { return !filterSelector(value, feature); },
    or: function (value, feature) {
      var keys = Object.keys(value);
      for (var i = 0; i < keys.length; i += 1) {
        if (value[keys[i]].length === 1 && filterSelector(value, feature, i)) {
          return true;
        } else if (value[keys[i]].length !== 1) {
          throw new Error('multiple ops of same type not implemented yet');
        }
      }
      return false;
    },
    propertyisequalto: function (value, feature) { return feature.properties[value['0'].propertyname] &&
      feature.properties[value['0'].propertyname] === value['0'].literal; },
    propertyislessthan: function (value, feature) { return feature.properties[value['0'].propertyname] &&
      Number(feature.properties[value['0'].propertyname]) < Number(value['0'].literal); },
  };

  /**
   * [filterSelector description]
   * @private
   * @param  {Filter} filter
   * @param  {object} feature feature
   * @param {number} key index of property to use
   * @return {boolean}
   */
  function filterSelector(filter, feature, key) {
    if ( key === void 0 ) key = 0;

    var type = Object.keys(filter)[key];
    if (Filters[type]) {
      if (Filters[type](filter[type], feature)) {
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
