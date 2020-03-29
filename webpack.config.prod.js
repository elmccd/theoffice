const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/client/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'WS_BACKEND_URL': JSON.stringify('ws://ec2-3-127-39-200.eu-central-1.compute.amazonaws.com:8888'),
    }),
  ],
};
