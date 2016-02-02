'use-strict';

var glob        = require('glob');
var path        = require('path');

var gulp        = require('gulp');
var tslint      = require('gulp-tslint');
var ts          = require('gulp-typescript');
var browserify  = require('browserify'),
    source      = require('vinyl-source-stream'),
    uglify      = require('gulp-uglify'),
    sourcemaps  = require('gulp-sourcemaps'),
    buffer      = require('vinyl-buffer');
var runSequence = require('run-sequence');
var karma       = require('gulp-karma');

// options reference: https://www.npmjs.com/package/gulp-typescript
var tsProject = ts.createProject({
  removeComments: true,
  noImplicitAny: true,
  target: 'ES3',
  module: 'commonjs',
  declarations: false
})

gulp.task('lint', function(){
  return gulp.src([
    './source/ts/**/**.ts', './test/**/**.test.ts'
  ]).pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('tsc', function(){
  return gulp.src('./source/ts/**/**.ts')
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest('./temp/source/js'));
});

gulp.task('tsc-tests', function(){
  return gulp.src('./test/**/**.test.ts')
    .pipe(ts(tsProject))
    .js.pipe(gulp.dest('./temp/test/'));
});

gulp.task('bundle-js', function(){
  return browserify('./temp/source/js/main.js')
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/source/js'));
});

gulp.task('bundle-test', function(){
  glob('./temp/test/**/**.test.js', function(err, filename){
    browserify(filename)
    .bundle()
    .pipe(source(path.basename(filename)))
    .pipe(gulp.dest('./dist/test/'));
  })
});

gulp.task('karma', function(cb){
  gulp.src('./dist/test/**/**.test.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('end', cb)
    .on('error', function(err){
      // Make sure failed tests cause gulp to exit non-zero
      throw err;
    });
});

gulp.task('default', function(cb){
  runSequence(
    'lint',
    ['tsc', 'tsc-tests'],
    ['bundle-js', 'bundle-test'],
    'karma',
    'browser-sync',
    cb
  );
});
