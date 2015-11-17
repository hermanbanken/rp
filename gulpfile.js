var gulp       = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    rename     = require('gulp-rename'),
    uglify     = require('gulp-uglify'),
    typescript = require('gulp-typescript'),
    merge      = require('merge2'),
    source     = require('vinyl-source-stream'),
    buffer     = require('vinyl-buffer'),
    browserify = require('browserify'),
    babelify   = require('babelify');

var typescriptProject = typescript.createProject('tsconfig.json');

gulp.task('typescript', () => {
  var result = gulp
    .src(['src/**/*.ts', 'typings/**/*.ts'], {base: 'src'})
    .pipe(sourcemaps.init())
    .pipe(typescript(typescriptProject))

  return merge([
    result.dts.pipe(gulp.dest('dist')),
    result.js
      .pipe(sourcemaps.write('.',{includeContent:false, sourceRoot: '../src'}) )
      .pipe(gulp.dest('dist'))
  ]);
});

gulp.task('browserify', () => {
	var entries = [
		'dist/rp.js', 
		'src/continuous.discrete.js', 
		'src/discrete.optimize.js'
	];
  return browserify({ entries, standalone: 'RP', sourceType: 'module', debug: true })
    .transform(babelify)
    .bundle()
    .pipe(source('rp.browser.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('uglify', () => {
  return gulp
    .src('dist/rp.browser.js')
    .pipe(uglify())
    .pipe(rename('rp.browser.min.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('dist',    gulp.series('typescript', 'browserify', 'uglify'));
gulp.task('d',       gulp.task('dist'));
gulp.task('default', gulp.task('dist'));

gulp.task('watch', function() {
  gulp.watch(['src/*.ts', 'src/*.js'], gulp.task('dist'));
});
gulp.task('w', gulp.series('watch'));