const { resolve } = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.[hash].js',
    chunkFilename: '[id].[chunkhash].js',
    //dist or beta dist/beta
    path: resolve(__dirname, 'dist')
  },
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.(png|woff|woff2|eot|ttf|svg)$/,
      loader: 'url-loader?limit=100000'
    },
    {
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react']
        }
      }
    }]
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      parallel: true,
      cache: true,
      sourceMap: true,
      extractComments: false,
      terserOptions: {
        ecma: undefined,
        warnings: false,
        parse: {},
        compress: {},
        mangle: true,
        module: false,
        output: null,
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false,
      }
    })]
  },
  plugins: [
    new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: /\.js$|\.css$|\.html$|\.eot?.+$|\.ttf?.+$|\.woff?.+$|\.svg?.+$/,
      threshold: 10240,
      minRatio: 0.8
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
    }),
    new CleanWebpackPlugin({
      dry: false,
      verbose: true,
      cleanOnceBeforeBuildPatterns: ['**/*', '!assets/**', '!beta/**', '!favicon.ico']
    })
  ],
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
