import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import RegularShape from 'ol/style/RegularShape';

export const emptyStyle = new Style({});

export const defaultPointStyle = new Style({
  image: new Circle({
    radius: 8,
    fill: new Fill({
      color: 'blue',
      fillOpacity: 0.7,
    }),
  }),
});

export const imageLoadingPointStyle = new Style({
  image: new Circle({
    radius: 5,
    fill: new Fill({
      color: '#DDDDDD',
    }),
    stroke: new Stroke({
      width: 1,
      color: '#888888',
    }),
  }),
});

export const imageLoadingPolygonStyle = new Style({
  fill: new Fill({
    color: '#DDDDDD',
  }),
  stroke: new Stroke({
    color: '#888888',
    width: 1,
  }),
});

export const imageErrorPointStyle = new Style({
  image: new RegularShape({
    angle: Math.PI / 4,
    fill: new Fill({
      color: 'red',
    }),
    points: 4,
    radius: 8,
    radius2: 0,
    stroke: new Stroke({
      color: 'red',
      width: 4,
    }),
  }),
});

export const imageErrorPolygonStyle = new Style({
  fill: new Fill({
    color: 'red',
  }),
  stroke: new Stroke({
    color: 'red',
    width: 1,
  }),
});
