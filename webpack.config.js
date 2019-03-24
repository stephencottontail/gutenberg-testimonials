const path = require('path');
const webpack = require('webpack');
const extractCss = require('extract-text-webpack-plugin');
const friendly = require('friendly-errors-webpack-plugin');
const wplib = [
	'api-fetch',
	'blocks',
	'components',
	'compose',
	'data',
	'date',
	'editor',
	'element',
	'html-entities',
	'keycodes',
	'i18n',
	'url',
	'utils'
];

/**
 * Functions to extract styles
 */
let blocksCss = new extractCss( {
	filename: './block.css'
} );
let editorCss = new extractCss( {
	filename: './editor.css'
} );
let extractConfig = {
	use: [
		{ loader: 'raw-loader' },
		{
			loader: 'sass-loader',
			options: {
				outputStyle: process.env.NODE_ENV === 'production' ? 'compressed' : 'nested'
			}
		}
	]
};

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * I discovered that you need to convert kebab-case to camelCase in order
 * for webpack `externals` to work correctly, but when I tried to make it
 * easier by adding the libraries in camelCase up there in `wplib`, Webpack
 * informed me that the dependencies for `src/vendor/url-input` were 
 * not met and that I needed to install them with `npm install`. WELCOME
 * TO THE WORLD OF THE FUTURE.
 *
 * @param {string} string Input dash-delimited string.
 * @return {string} Camel-cased string.
 */
let camelCaseDash = ( string ) => {
	return string.replace(
		/-([a-z])/g,
		( match, letter ) => letter.toUpperCase()
	);
}

module.exports = {
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
	entry: './index.js',
	devtool: 'source-map',
	output: {
		path: __dirname + '/dist',
		filename: 'blocks.js',
		library: ['wp', '[name]'],
		libraryTarget: 'window'
	},
	/**
	 * Setting `externals` allows the use of `import __ from __` syntax for WP's
	 * built-in JS libraries. They first need to be listed as dependencies for
	 * the script that's designated as `editor_script` when you first call
	 * `register_block_type` in PHP.
	 *
	 * @link https://www.cssigniter.com/importing-gutenberg-core-wordpress-libraries-es-modules-blocks/
	 * @link https://webpack.js.org/configuration/externals/
	 */
	externals: wplib.reduce((externals, lib) => {
		externals[`@wordpress/${lib}`] = {
			window: ['wp', camelCaseDash( lib )]
		};

		return externals;
	}, {}),
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader'
					}
				]
			},
			{
				test: /editor\.scss$/,
				exclude: /node_modules/,
				use: editorCss.extract( extractConfig )
			},
			{
				test: /block\.scss$/,
				exclude: /node_modules/,
				use: blocksCss.extract( extractConfig )
			}
		]
	},
	plugins: [
		blocksCss,
		editorCss,
		new friendly( {
			clearConsole: true
		} )
	]
}
