const path = require('path');

module.exports = {
  mode: 'development',
  entry: '../js/3d/main.jsx',
  output: {
    filename: 'hv3d.js',
    path: path.resolve(__dirname, '../js/dist'),
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.m?jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  }
};
