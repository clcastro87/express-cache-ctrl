var gulp = require('gulp');
var $ = require('gulp-load-plugins')({lazy: true});

/**
 * List the available gulp tasks
 */
gulp.task('help', $.taskListing);
gulp.task('default', ['vet']);

/**
 * vet the code and create coverage report
 * @return {Stream}
 */
gulp.task('vet', function () {$.jshint();
	log('Analyzing source with JSHint and JSCS');

	return gulp
		.src('src/cache.js')
		//.pipe($.if(args.verbose, $.print()))
		.pipe($.jshint())
		.pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
		.pipe($.jshint.reporter('fail'))
		.pipe($.jscs());
});

function log(msg) {
	console.log(msg);
}

module.exports = gulp;
