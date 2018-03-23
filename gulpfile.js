const gulp = require('gulp');
const connect = require('gulp-connect');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('run', () => {
  connect.server({
    livereload: true,
    root: ['dist', 'docs/examples'],
  });
});


gulp.task('watch', ['run'], () => {
  gulp.watch('./src/**/*', ['build']);
  gulp.watch('./docs/examples/**/*', {}, () => gulp.src('')
      .pipe(connect.reload()));
});


gulp.task('build', () => {
  const b = browserify({
    entries: './src/index.js',
    debug: true,
    standalone: 'SLDReader',
  });
  return b.transform('babelify', {
    presets: ['es2015'],
    plugins: [
      // ['babel-plugin-merge-imports', {
      //   pkg: 'openlayers',
      //   pkgVar: '__ol',
      //   regex: '^ol(?:/(.*))?$',
      // }],
    ],
  }).transform('browserify-shim')
  .bundle()
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe(gulp.dest('./dist/'))
  .pipe(connect.reload());
});
