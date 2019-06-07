/* global describe it expect */
import Point from 'ol/geom/point';
import MultiPoint from 'ol/geom/multipoint';
import LineString from 'ol/geom/linestring';
import MultiLineString from 'ol/geom/multilinestring';
import Polygon from 'ol/geom/polygon';
import MultiPolygon from 'ol/geom/multipolygon';
import invokeFunction from '../src/Function';

describe('filer functions', () => {
  describe('dimension', () => {
    const filter = {
      function: {
        name: 'dimension',
        propertyname: 'geom',
      },
      type: 'comparison',
      operator: 'propertyisequalto',
    };
    it('should return true for point', () => {
      filter.literal = '0';
      const properties = {
        geom: new Point(),
      };

      expect(invokeFunction(filter, properties)).to.be.true;
    });
    it('should return true for multi point', () => {
      filter.literal = '0';
      const properties = {
        geom: new MultiPoint(),
      };

      expect(invokeFunction(filter, properties)).to.be.true;
    });
    it('should return true for line string', () => {
      filter.literal = '1';
      const properties = {
        geom: new LineString(),
      };

      expect(invokeFunction(filter, properties)).to.be.true;
    });
    it('should return true for multi line string', () => {
      filter.literal = '1';
      const properties = {
        geom: new MultiLineString(),
      };

      expect(invokeFunction(filter, properties)).to.be.true;
    });
    it('should return true for polygon', () => {
      filter.literal = '2';
      const properties = {
        geom: new Polygon(),
      };

      expect(invokeFunction(filter, properties)).to.be.true;
    });
    it('should return true for multi polygon', () => {
      filter.literal = '2';
      const properties = {
        geom: new MultiPolygon(),
      };

      expect(invokeFunction(filter, properties)).to.be.true;
    });
    it('should return false for incorrect geometry', () => {
      filter.literal = '0';
      const properties = {
        geom: new Polygon(),
      };

      expect(invokeFunction(filter, properties)).to.be.false;
    });
    it('should return false for no geometry', () => {
      filter.literal = '0';
      const properties = { };

      expect(invokeFunction(filter, properties)).to.be.false;
    });
  });
});
