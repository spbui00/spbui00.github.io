const path = require('path');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './js/main.js', // Change this to your entry point,
    trip: './js/trip.js',
    viky: './js/viky.js', 
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'), // Change this to your desired output path
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      chunks: ['main'], // Specify the chunks for index.html
    }),
    new HtmlWebpackPlugin({
      template: 'trip.html',
      filename: 'trip.html',
      chunks: ['trip'], 
    }),
    new HtmlWebpackPlugin({
      template: 'viky.html',
      filename: 'viky.html',
      chunks: ['viky'], 
    }),
    new Dotenv()
  ],
};
