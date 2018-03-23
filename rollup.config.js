import buble from 'rollup-plugin-buble';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/sldreader.js',
    format: 'umd',
    name: 'SLDReader',
  },
  plugins: [buble()],
};
