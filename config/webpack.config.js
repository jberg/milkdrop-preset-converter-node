/* global __dirname, require, module */

const path = require("path");
const env = require("yargs").argv.env;

const srcRoot = path.join(__dirname, "..", "src");
const nodeRoot = path.join(__dirname, "..", "node_modules");
const outputPath = path.join(__dirname, "..", "dist");

let outputFile = "milkdrop-preset-converter-node";

if (env === "prod") {
  outputFile += ".min";
}

const config = {
  entry: `${srcRoot}/index.js`,
  mode: "development",
  target: "node",
  output: {
    path: outputPath,
    filename: `${outputFile}.js`,
    library: "milkdropPresetConverter",
    libraryTarget: "umd",
    globalObject: "this",
  },
  module: {
    rules: [
      {
        test: /(\.js)$/,
        exclude: /node_modules|lib/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/plugin-transform-runtime"],
            sourceType: "unambiguous",
          },
        },
      },
      {
        test: /(\.js)$/,
        exclude: /node_modules|lib/,
        use: {
          loader: "eslint-loader",
        },
        enforce: "pre",
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      },
    ],
  },
  resolve: {
    modules: [srcRoot, nodeRoot],
    extensions: [".js", ".node"],
  },
  plugins: [],
};

if (env === "prod") {
  config.mode = "production";
}

module.exports = config;
