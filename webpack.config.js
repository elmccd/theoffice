const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/client/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  devServer: {},
};
