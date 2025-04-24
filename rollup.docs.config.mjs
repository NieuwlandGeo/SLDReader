import versionInjector from 'rollup-plugin-version-injector';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';

import olGlobals from './olGlobals.mjs';

// Config for updating the standalone sldreader for the docs/demo's.
export default {
  input: 'src/index.js',
  external: moduleId => moduleId.indexOf('ol') === 0,
  output: [
    {
      file: 'docs/assets/sldreader-standalone.js',
      format: 'iife',
      name: 'SLDReader',
      globals: olGlobals,
    },
  ],
  plugins: [
    versionInjector(),
    babel({ babelHelpers: 'bundled' }),
    nodeResolve(),
  ],
  strictDeprecations: true,
};
