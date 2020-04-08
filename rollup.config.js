import buble from '@rollup/plugin-buble';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  external: moduleId => moduleId.indexOf('ol') === 0,
  output: {
    file: 'dist/sldreader.js',
    format: 'umd',
    name: 'SLDReader',
    globals: {
      'ol/style': 'ol.style',
      'ol/render': 'ol.render',
      'ol/extent': 'ol.extent',
      'ol/geom': 'ol.geom',
    },
  },
  plugins: [buble({ objectAssign: true }), resolve()],
};
