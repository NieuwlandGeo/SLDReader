import GeometryType from 'ol/geom/geometrytype';

function dimension(filter, featureProperties) {
  const geom = featureProperties[filter.function.propertyname];
  const geomType = geom && geom.getType && geom.getType();

  switch (filter.literal) {
    case '0':
      return geomType === GeometryType.POINT || geomType === GeometryType.MULTI_POINT;
    case '1':
      return geomType === GeometryType.LINE_STRING || geomType === GeometryType.MULTI_LINE_STRING;
    case '2':
      return geomType === GeometryType.POLYGON || geomType === GeometryType.MULTI_POLYGON;
    default:
      return false;
  }
}

export default function invokeFunction(filter, featureProperties) {
  switch (filter.function.name) {
    case 'dimension':
      return dimension(filter, featureProperties);
    default:
      return false;
  }
}