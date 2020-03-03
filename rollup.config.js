import buble from 'rollup-plugin-buble';

const resolve = require('rollup-plugin-node-resolve');

export default {
  input: 'src/index.js',
  external: moduleId => moduleId.indexOf('ol') === 0,
  output: {
    file: 'dist/sldreader.js',
    format: 'umd',
    name: 'SLDReader',
    globals: {
      'ol/style': 'ol.style',
    },
  },
  plugins: [buble({ objectAssign: true }), resolve()],
};
