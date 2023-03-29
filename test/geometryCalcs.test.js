/* global describe it expect beforeEach */
import OLFormatGeoJSON from 'ol/format/GeoJSON';
import { splitLineString } from '../src/styles/geometryCalcs';

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
});
