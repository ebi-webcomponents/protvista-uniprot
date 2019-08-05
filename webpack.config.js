const webpack = require("webpack");
const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");

const PACKAGE_ROOT_PATH = process.cwd();

const config = {
  entry: ["./src/index.js"],
  output: {
    path: path.resolve(PACKAGE_ROOT_PATH, "dist"),
    publicPath: "dist/",
    chunkFilename: "[name].js",
    library: "ProtvistaUniprot",
    filename: "protvista-uniprot.js"
  },
  target: "web",
  devtool: "source-map",
  resolve: {
    extensions: [".js"]
  },
  externals: {
    d3: "d3",
    litemol: "LiteMol"
  },
  plugins: [new CleanWebpackPlugin([path.join(PACKAGE_ROOT_PATH, "dist")])],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: {
          loader: "babel-loader",
          options: {
            babelrc: false,
            exclude: /node_modules\/(?!(lit-element|lit-html|protvista-|data-loader)).*/,
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    ie: 11,
                    browsers: "last 2 versions"
                  },
                  modules: false
                }
              ]
            ],
            plugins: [
              [
                "@babel/plugin-transform-runtime",
                {
                  regenerator: true
                }
              ]
            ]
          }
        }
      }
    ]
  }
};

module.exports = config;
