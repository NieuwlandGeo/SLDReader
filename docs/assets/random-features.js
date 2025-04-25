function createFeature(geometryType, coordinates) {
  return {
    type: 'Feature',
    geometry: {
      type: geometryType,
      coordinates,
    },
  };
}

function createRandomPointFeature(centerX, centerY) {
  return createFeature('Point', [centerX, centerY]);
}

function createRandomLineStringFeature(centerX, centerY) {
  let [px, py] = [centerX, centerY];
  const linePoints = [[px, py]];
  const numSegments = 15 + Math.floor(Math.random() * 5);
  let alpha = 2 * Math.PI * Math.random();
  for (let i = 0; i < numSegments; i += 1) {
    const segLen = 2e4 * (1.0 + Math.random());
    px += segLen * Math.cos(alpha);
    py += segLen * Math.sin(alpha);
    alpha += 2 * (Math.random() - 0.5);
    linePoints.push([px, py]);
  }
  return createFeature('LineString', linePoints);
}

function createRandomPolygonFeature(centerX, centerY) {
  const halfWidth = 5e4 * (1 + Math.random());
  const halfHeight = 5e4 * (1 + Math.random());
  const coordinates = [
    [
      [centerX - halfWidth, centerY - halfHeight],
      [centerX - halfWidth, centerY + halfHeight],
      [centerX + halfWidth, centerY + halfHeight],
      [centerX + halfWidth, centerY - halfHeight],
      [centerX - halfWidth, centerY - halfHeight],
    ],
  ];
  return createFeature('Polygon', coordinates);
}

function createRandomFeature(geometryType) {
  const centerX = 1.4e6 * (Math.random() - 0.5);
  const centerY = 7e5 * (Math.random() - 0.5);
  switch (geometryType) {
    case 'Point':
      return createRandomPointFeature(centerX, centerY);
    case 'LineString':
      return createRandomLineStringFeature(centerX, centerY);
    case 'Polygon':
      return createRandomPolygonFeature(centerX, centerY);
    default:
      throw new Error(
        'Unknown geometry type, choose one of Point, LineString, or Polygon.'
      );
  }
}

// eslint-disable-next-line no-unused-vars
function createRandomFeatures(geometryType, numFeatures) {
  return {
    type: 'FeatureCollection',
    features: Array(numFeatures)
      .fill()
      .map(() => createRandomFeature(geometryType)),
  };
}
