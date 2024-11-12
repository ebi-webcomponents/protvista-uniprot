const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const PACKAGE_ROOT_PATH = process.cwd();

const config = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(PACKAGE_ROOT_PATH, 'dist'),
    publicPath: '/',
    chunkFilename: '[name].js',
    filename: 'protvista-uniprot.mjs',
    clean: true,
    library: {
      type: 'module',
    },
  },
  target: 'web',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude:
          /node_modules\/(?!(lit-element|lit-html|timing-functions|protvista-*)).*/,
        use: 'babel-loader',
      },
      {
        test: /\.svg$/,
        use: 'svg-inline-loader',
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
  experiments: {
    outputModule: true,
  },
  devServer: {
    static: [
      path.join(__dirname, 'public'),
      path.join(__dirname, 'node_modules'),
    ],
    open: true,
    port: 9999,
  },
};

module.exports = config;
