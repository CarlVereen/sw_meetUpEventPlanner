/*eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var jasmine = require('gulp-jasmine-phantom');
var concat = require('gulp-concat');
var minifycss = require('gulp-cssnano');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var del = require('del');

//clean up previous or incorrect or missing files
gulp.task('clean', function() {
	return del(['dist/styles', 'dist/js', 'dist/img']);
});



browserSync.stream();

gulp.task('default', ['process-html', 'process-styles', 'process-scripts', 'process-images'], function() {
	gulp.watch('./src/styles/**/*.scss', ['process-styles']);
	gulp.watch('./src/js/**/*.js', ['js-reload']);
	gulp.watch('./src/index.html', ['process-html']);
	gulp.watch('./src/img/*', ['process-images']);
	gulp.watch('./dist/index.html').on('change',  browserSync.reload);
	gulp.watch('./dist/styles/*').on('change', browserSync.reload);
	gulp.watch('./dist/js/*').on('change', browserSync.reload);

	browserSync.init({
		server: './dist'
	});
});

gulp.task('process-html', function() {
	gulp.src('./src/index.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('process-styles', function() {
	gulp.src('./src/styles/**/*.scss')
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(gulp.dest('./dist/styles'))
		.pipe(browserSync.stream())
		.pipe(rename({suffix: '.min'}))
		.pipe(minifycss())
		.pipe(gulp.dest('dist/styles'));
});

gulp.task('process-scripts', function() {
	gulp.src('./src/js/**/*.js')
		.pipe(babel())
		.pipe(concat('all.js'))
		.pipe(gulp.dest('dist/js'))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('process-scriptsdist', function() {
	gulp.src('./src/js/**/*.js')
		.pipe(babel())
		.pipe(concat('all.js'))
		.pipe(uglify())
		.pipe(gulp.dest('dist/js'));
});

//browserSync reload JS task
gulp.task('js-reload', ['process-scripts'], browserSync.reload);

gulp.task('process-images', function() {
	return gulp.src('./src/img/*')
		.pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true, use: [pngquant({quality: '65-80', speed: 4})()] })))
		.pipe(gulp.dest('./dist/img'));
});

gulp.task('tests', function() {
	gulp.src('tests/spec/*.js')
		.pipe(jasmine({
			integration: true,
			vendor: 'src/js/**/*.js'
		}));
});