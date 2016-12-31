'use strict';

var path = require('path');
var webpack = require('webpack');
var rucksack = require('rucksack-css');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: {
    Bloggur: [
      'webpack-hot-middleware/client',
      'babel-polyfill',
      './src/renderApp.js'
    ],
    DarkTheme: [
      'webpack-hot-middleware/client',
      './src/themes/dark/dark.js'
    ],
    LightTheme: [
      'webpack-hot-middleware/client',
      './src/themes/light/light.js'
    ]
  },
  resolve: {
    extensions: ['', '.js']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[id].js',
    publicPath: '/dist/',
    library: '[name]',
    libraryTarget: 'umd'
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new webpack.DefinePlugin({
      'process.env.MIN_EXT': JSON.stringify('')
    }),
    new ExtractTextPlugin('[name].css')
  ],
  module: {
    noParse: /dist\/localforage(|\.min).js/,
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel?'+JSON.stringify({
          plugins: [
            ['react-transform', {
              transforms: [{
                transform: 'react-transform-hmr',
                imports: ['react'],
                locals:  ['module']
              }]
            }]
          ]
        })],
        include: [
          path.resolve(__dirname, 'src')
        ]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          'style',
          'css?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss'
        ),
        include: [
          path.resolve(__dirname, 'src')
        ]
      }
    ]
  },
  postcss: [
    rucksack({
      autoprefixer: true
    })
  ]
};
