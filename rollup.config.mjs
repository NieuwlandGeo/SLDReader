import versionInjector from 'rollup-plugin-version-injector';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import olGlobals from './olGlobals.mjs';

export default {
  input: 'src/index.js',
  external: moduleId => moduleId.indexOf('ol') === 0,
  output: [
    {
      file: 'dist/sldreader-standalone.js',
      format: 'iife',
      name: 'SLDReader',
      globals: olGlobals,
    },
    {
      file: 'dist/sldreader-standalone.min.js',
      format: 'iife',
      name: 'SLDReader',
      globals: olGlobals,
      plugins: [terser()],
    },
    {
      file: 'dist/sldreader.js',
      format: 'es',
    },
  ],
  plugins: [
    versionInjector(),
    babel({ babelHelpers: 'bundled' }),
    nodeResolve(),
  ],
  strictDeprecations: true,
};
