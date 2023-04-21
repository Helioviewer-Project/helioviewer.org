const path = require('path');

module.exports = {
  entry: '../js/Events/EventMarker.js',
  output: {
    filename: 'EventMarker.js',
    path: path.resolve(__dirname, '../js/dist'),
  },
  module: {
    rules: [
        {
          test: /\.m?js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-react']
            }
          }
        },
        {
            test: /EventMarker\.js$/,
            use: [
                {
                    loader: "expose-loader",
                    options: {
                        exposes: {
                            globalName: "EventMarker",
                            moduleLocalName: "EventMarker",
                        }
                    }
                },
                {
                    loader: "babel-loader",
                    options: {
                      presets: ['@babel/preset-react']
                    }
                },
            ]
        }
      ]
  }
};
