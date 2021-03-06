/**
 * Date: 29.01.15
 * Time: 13:29
 * @file
 *
 */

'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var pagespeed = require('psi');
var livereload = require('gulp-livereload');
var reload = livereload.reload;
var bowerFiles = require('main-bower-files');
var ngrok = require('ngrok');
var site = 'http://project-url.dev';


var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src('js/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe(livereload());
});

// Optimize Images
gulp.task('images', function () {
  return gulp.src('images_originals/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('images'))
    .pipe($.size({title: 'images'}))
    .pipe(livereload());
});


// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
    'sass/style.scss'
  ])
    .pipe($.changed('styles', {extension: '.scss'}))
    .pipe($.rubySass({
      style: 'expanded',
      precision: 10,
      sourcemap: true,
      sourcemapPath: '.',
      require: ['compass', 'singularitygs', 'breakpoint', 'modular-scale'],
      loadPath: 'libraries',
      bundleExec: true,
      compass: true
    })
      .on('error', console.error.bind(console))
  )
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('css'))
    .pipe($.size({title: 'styles'}))
    .pipe(livereload());
});

// Helper tasks for pagespeed analysis:
gulp.task('ngrok-url', function(cb) {
  return ngrok.connect({

    port: 80,
    'host-header': site
  }, function (err, url) {
    site = url;
    console.log('serving your tunnel from: ' + site);
    cb();
  });
});

// Run PageSpeed Insights
gulp.task('psi-mobile', function (cb) {
  return pagespeed(site, {
    // key: key
    strategy: 'mobile'
  }, function (err, data) {
    console.log('Mobile score: ', data.score);
    console.log('Mobile stats: \n', data.pageStats);
    cb();
  });
});

gulp.task('psi-desktop', function (cb) {
  return pagespeed(site, {
    // key: key,
    strategy: 'desktop'
  }, function (err, data) {
    console.log('Desktop score: ', data.score);
    console.log('Desktop stats: \n', data.pageStats);
    cb();
  });
});

// psi task runs and exits
gulp.task('psi-exit', function() {
  console.log('Woohoo! Check out your page speed scores!');
  process.exit();
});

// This is the main pagespeed task that will run all helper tasks
gulp.task('pagespeed', function(cb) {
  runSequence('ngrok-url', 'psi-mobile', 'psi-desktop', 'psi-exit', cb);
});



// Watch Files For Changes & Reload
gulp.task('watch', function () {
  livereload.listen({
    reloadPage: ''
  });

  gulp.watch(['scss/**/*.{scss,css}'], ['styles']);
  gulp.watch(['js/**/*.js'], ['jshint']);
  gulp.watch(['images/**/*', 'templates/**/*.tpl.php'], reload);
});

// Build Production Files, the Default Task
gulp.task('default', function (cb) {
  runSequence('styles', ['jshint', 'images'], cb);
});


// Test tasks that need to be run standalone:
//
gulp.task( 'bs-reference', function () {
  gulp.src( './node_modules/backstopjs/gulpfile.js' )
    .pipe($.chug({
      tasks:  [ 'reference' ]
    }));
});

gulp.task( 'bs-test', function () {
  gulp.src( './node_modules/backstopjs/gulpfile.js' )
    .pipe($.chug({
      tasks:  [ 'test' ]
    }));
});

gulp.task('scss-lint', function() {
  gulp.src('sass/**/*.scss')
    .pipe($.scssLint());
});
