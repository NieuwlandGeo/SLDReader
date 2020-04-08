const buble = require('@rollup/plugin-buble');
const resolve = require('@rollup/plugin-node-resolve');
// Karma configuration
// Generated on Thu Jun 15 2017 14:53:58 GMT+0200 (CEST)

module.exports = function kc(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    // list of files / patterns to load in the browser, includes polyfill
    files: [
      'node_modules/core-js/client/shim.min.js',
      {
        pattern: 'test/**/*.test.js',
        watched: false,
      },
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*test.js': ['rollup'],
    },

    rollupPreprocessor: {
      plugins: [buble({ objectAssign: true }), resolve()],
      output: {
        format: 'iife', // Helps prevent naming collisions.
        name: 'SLDReader', // Required for 'iife' format.
        sourcemap: 'inline', // Sensible for testing.
      },
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

    mochaReporter: {
      output: 'autowatch',
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['FirefoxHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
  });
};
