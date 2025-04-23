import versionInjector from 'rollup-plugin-version-injector';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  external: moduleId => moduleId.indexOf('ol') === 0,
  output: [
    {
      file: 'dist/sldreader.js',
      format: 'umd',
      name: 'SLDReader',
      globals: {
        'ol/render': 'ol.render',
        'ol/extent': 'ol.extent',
        'ol/has': 'ol.has',
        'ol/style/Style': 'ol.style.Style',
        'ol/style/Circle': 'ol.style.Circle',
        'ol/style/Fill': 'ol.style.Fill',
        'ol/style/Icon': 'ol.style.Icon',
        'ol/style/Image': 'ol.style.Image',
        'ol/style/RegularShape': 'ol.style.RegularShape',
        'ol/style/Stroke': 'ol.style.Stroke',
        'ol/style/Text': 'ol.style.Text',
        'ol/geom/Point': 'ol.geom.Point',
        'ol/geom/MultiPoint': 'ol.geom.MultiPoint',
        'ol/geom/LineString': 'ol.geom.LineString',
        'ol/geom/Polygon': 'ol.geom.Polygon',
        'ol/geom/MultiPolygon': 'ol.geom.MultiPolygon',
      },
    },
    {
      file: 'dist/sldreader.min.js',
      format: 'umd',
      name: 'SLDReader',
      globals: {
        'ol/render': 'ol.render',
        'ol/extent': 'ol.extent',
        'ol/has': 'ol.has',
        'ol/style/Style': 'ol.style.Style',
        'ol/style/Circle': 'ol.style.Circle',
        'ol/style/Fill': 'ol.style.Fill',
        'ol/style/Icon': 'ol.style.Icon',
        'ol/style/Image': 'ol.style.Image',
        'ol/style/RegularShape': 'ol.style.RegularShape',
        'ol/style/Stroke': 'ol.style.Stroke',
        'ol/style/Text': 'ol.style.Text',
        'ol/geom/Point': 'ol.geom.Point',
        'ol/geom/MultiPoint': 'ol.geom.MultiPoint',
        'ol/geom/LineString': 'ol.geom.LineString',
        'ol/geom/Polygon': 'ol.geom.Polygon',
        'ol/geom/MultiPolygon': 'ol.geom.MultiPolygon',
      },
      plugins: [terser()],
    },
  ],
  plugins: [
    versionInjector(),
    babel({ babelHelpers: 'bundled' }),
    nodeResolve(),
  ],
  strictDeprecations: true,
};
