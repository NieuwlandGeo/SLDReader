import { Fill } from 'ol/style';

export default function getQGISBrushFill(brushName, fillColor) {
  console.log('BRUSH ME --> ', brushName, ' --> ', fillColor);

  switch (brushName) {
    default:
      return new Fill({ color: fillColor });
  }
}
