/**
* Gulpfile to make my life easier.
*/
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var transpile  = require('gulp-es6-module-transpiler');

gulp.task('build', function() {
    return gulp.src('src/app.js')
        .pipe(sourcemaps.init())
        .pipe(transpile({
            formatter: 'bundle'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dest'));
})

gulp.task('watch',function() {
    gulp.watch('**/*.js',['build'])
});
 
gulp.task('default', ['build', 'watch']);