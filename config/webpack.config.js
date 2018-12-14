/* global __dirname, require, module */

const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');
const env = require('yargs').argv.env;

const srcRoot = path.join(__dirname, '..', 'src');
const nodeRoot = path.join(__dirname, '..', 'node_modules');
const outputPath = path.join(__dirname, '..', 'dist');

let outputFile = 'milkdrop-preset-converter-node';

if (env === 'prod') {
  outputFile += '.min';
}

const config = {
  entry: `${srcRoot}/index.js`,
  target: 'node',
  output: {
    path: outputPath,
    filename: `${outputFile}.js`,
    library: 'milkdropPresetConverter',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /(\.js)$/,
        exclude: /node_modules|lib/,
        use: {
          loader: 'babel-loader?cacheDirectory'
        }
      },
      {
        test: /(\.js)$/,
        exclude: /node_modules|lib/,
        use: {
          loader: 'eslint-loader'
        },
        enforce: 'pre'
      },
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  resolve: {
    modules: [srcRoot, nodeRoot],
    extensions: ['.js', '.node']
  },
  plugins: []
};


if (env === 'prod') {
  config.plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),

    new UglifyJsPlugin({ parallel: true })
  );
}

module.exports = config;
