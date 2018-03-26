import buble from 'rollup-plugin-buble';

const resolve = require('rollup-plugin-node-resolve');

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/sldreader.js',
    format: 'umd',
    name: 'SLDReader',
  },
  plugins: [buble(), resolve()],
};
