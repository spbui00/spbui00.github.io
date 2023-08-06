const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './js-min/main.js', // Change this to your entry point
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'), // Change this to your desired output path
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html', // Change this to your HTML template
    }),
  ],
};
