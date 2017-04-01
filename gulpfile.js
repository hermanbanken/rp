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
		'src/discrete.optimize.js',
		'src/ras.js',
		'src/stage-1.js',
	];
  return browserify({ entries, standalone: 'RP', sourceType: 'module', debug: true })
    .transform(babelify)
    .bundle()
    .pipe(source('rp.browser.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('copy', () => {
	return merge([
		gulp.src([
			'bower_components/jquery/dist/jquery.min.js',
			'bower_components/prism/prism.js',
			'bower_components/d3/d3.min.js',
		])
			.pipe(gulp.dest('dist/libs/')),
		gulp.src(['bower_components/prism/themes/prism.css'])
			.pipe(gulp.dest('dist/css/'))
	]);
})

gulp.task('uglify', () => {
  return gulp
    .src('dist/rp.browser.js')
    .pipe(uglify())
    .pipe(rename('rp.browser.min.js'))
    .pipe(gulp.dest('dist'))
});

gulp.task('dist',    gulp.series('copy', 'typescript', 'browserify', 'uglify'));
gulp.task('d',       gulp.task('dist'));
gulp.task('default', gulp.task('dist'));

gulp.task('watch', function() {
  gulp.watch(['src/*.ts', 'src/*.js'], gulp.task('dist'));
});
gulp.task('w', gulp.series('watch'));
