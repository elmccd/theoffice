const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './src/client/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle-dev.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'WS_BACKEND_URL': JSON.stringify('ws://localhost:8888'),
    }),
  ],
};
