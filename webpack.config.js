const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const PACKAGE_ROOT_PATH = process.cwd();

const config = {
  entry: ['./src/index.ts'],
  output: {
    path: path.resolve(PACKAGE_ROOT_PATH, 'dist'),
    publicPath: '/',
    chunkFilename: '[name].js',
    library: 'ProtvistaUniprot',
    filename: 'protvista-uniprot.js',
    clean: true,
  },
  target: 'web',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    d3: 'd3',
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude:
          /node_modules\/(?!(lit-element|lit-html|timing-functions|protvista-*|data-loader)).*/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: 'src/icons', to: 'es/icons' }],
    }),
  ],
  devServer: {
    contentBase: [
      path.join(__dirname, 'public'),
      path.join(__dirname, 'node_modules'),
    ],
    open: true,
  },
};

module.exports = config;
