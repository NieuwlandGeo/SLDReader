/* global describe it expect beforeEach */
import OLFormatGeoJSON from 'ol/format/GeoJSON';
import { getLineMidpoint, splitLineString } from '../src/styles/geometryCalcs';

describe('Geometry calcs', () => {
  const lineGeoJSON = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      // prettier-ignore
      coordinates: [[0, 0], [1, 0], [1, -2], [4, -2], [4, 2]],
    },
    properties: {},
  };

  let fmtGeoJSON;
  beforeEach(() => {
    fmtGeoJSON = new OLFormatGeoJSON();
  });

  it('Split point calculation', () => {
    const feature = fmtGeoJSON.readFeature(lineGeoJSON);
    const geometry = feature.getGeometry();

    const splitPoints = splitLineString(geometry, 4);
    const splitXYCoords = splitPoints.map(([x, y]) => [x, y]);
    expect(splitXYCoords).to.deep.equal([
      [0, 0],
      [2, -2],
      [4, 0],
    ]);
  });

  it('Split point calculation with initial gap', () => {
    const feature = fmtGeoJSON.readFeature(lineGeoJSON);
    const geometry = feature.getGeometry();

    const splitPoints = splitLineString(geometry, 4, { initialGap: 1 });
    const splitXYCoords = splitPoints.map(([x, y]) => [x, y]);
    expect(splitXYCoords).to.deep.equal([
      [1, 0],
      [3, -2],
      [4, 1],
    ]);
  });

  it('Midpoint calculation by splitting on half geometry length', () => {
    const feature = fmtGeoJSON.readFeature(lineGeoJSON);
    const geometry = feature.getGeometry();
    const midpoint = getLineMidpoint(geometry);
    expect(midpoint).to.deep.equal([3, -2]);
  });

  it('Midpoint calculation should not crash on small (length < 0.1 map units) geometries', () => {
    const shortLineGeoJSON = {
      type: 'Feature',
      id: 'some.feature.1',
      geometry: {
        type: 'LineString',
        coordinates: [
          [106652.4318, 485565.3644],
          [106652.4268, 485565.414],
        ],
      },
      geometry_name: 'geom',
      properties: {},
    };

    const feature = fmtGeoJSON.readFeature(shortLineGeoJSON);
    const geometry = feature.getGeometry();
    const midpoint = getLineMidpoint(geometry);
    expect(midpoint).to.deep.equal([106652.4293, 485565.3892]);
  });
});
