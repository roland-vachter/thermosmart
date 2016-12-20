"use strict";

const gulp = require('gulp');

const del = require('del');
const runSequence = require('run-sequence');
const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');
const webpack = require('webpack-stream');
const sass = require('gulp-sass');
const rename = require('gulp-rename');
const autoprefixer = require('gulp-autoprefixer');
const BowerWebpackPlugin = require("bower-webpack-plugin");


function ensureDirectoryExistence (filePath) {
	const dirname = path.dirname(filePath);

	if (directoryExists(dirname)) {
		return true;
	}

	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
}

function directoryExists(path) {
	try {
		return fs.statSync(path).isDirectory();
	} catch (err) {
		return false;
	}
}

function generateRandomString(length) {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
}


const buildFolder = './public/build';

gulp.task('build-config-dir', function () {
	ensureDirectoryExistence('build_config/js/test.js');
	ensureDirectoryExistence('build_config/scss/test.scss');
});

gulp.task('fingerprint', function(callback) {
	const fingerprint = generateRandomString(10);

	fs.writeFileSync('build_config/js/fingerprint.js', `module.exports="${fingerprint}";`);
	fs.writeFileSync('build_config/scss/fingerprint.scss', `$fingerprint: '${fingerprint}';`);
	callback();
});

gulp.task('assets-domain-config', function(callback) {
	let assetsDomain = '';

	fs.writeFileSync('build_config/js/assetsDomain.js', `module.exports="${assetsDomain}";`);
	fs.writeFileSync('build_config/scss/assetsDomain.scss', `$assets-domain: '${assetsDomain}';`);

	callback();
});


gulp.task('bower-install', function (callback) {
	exec('./node_modules/bower/bin/bower install', callback);
});


gulp.task('bower-cache-clean', function (callback) {
	exec('./node_modules/bower/bin/bower cache clean', callback);
});

gulp.task('bower-folder-clean', function (callback) {
	del(['./bower_components'], callback);
});

gulp.task('bower-clean', ['bower-cache-clean', 'bower-folder-clean']);

gulp.task('clean-build', function (callback) {
	del([buildFolder], callback);
});


const webpackConfig = {
    devtool: 'source-map', 
    module: {
        loaders: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                query: {
                    presets: ['es2015']
                }
            }
        ]
    },
    output: {
    	filename: 'main.js'
    },
    plugins: [
    	new BowerWebpackPlugin({
    		excludes: /.*\.scss/
    	})
    ]
};


gulp.task('webpack', function () {
	return gulp.src('./assets/main.js')
		.pipe(webpack(webpackConfig))
		.pipe(gulp.dest(buildFolder));
});


const autoprefixerConfig = {
	browsers: ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7'],
	cascade: false,
	flexbox: 'no-2009'
};

const sassConfig = {
	includePaths: [path.join(process.cwd(), 'bower_components')],
	outputStyle: 'nested'
};

gulp.task('sass', function () {
  return gulp.src('./assets/main.scss')
    .pipe(sass(sassConfig).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerConfig))
    .pipe(rename(path => {
		path.basename = 'main';
	}))
    .pipe(gulp.dest(buildFolder));
});


gulp.task('build', function (callback) {
	runSequence('build-config-dir', 'fingerprint', 'assets-domain-config', 'webpack', 'sass', callback);
});

gulp.task('default', function (callback) {
	runSequence('bower-clean', 'bower-install', 'build', callback);
});

gulp.task('watch', function() {
	gulp.watch(['./assets/**'], ['webpack', 'sass']);
});
