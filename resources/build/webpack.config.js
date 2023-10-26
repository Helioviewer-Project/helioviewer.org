const path = require('path');

module.exports = {
  mode: 'development',
  entry: '../js/index.js',
  output: {
    filename: 'HelioviewerModules.js',
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
        },
        {
          // If the application is migrated to import the appropriate modules in each script,
          // then this expose loader can be removed so modules don't end up in the global space.
            use: [
                {
                    loader: "expose-loader",
                    options: {
                      exposes: [
                        {
                            globalName: "EventMarker",
                            moduleLocalName: "EventMarker",
                            override: true
                        },
                        {
                          globalName: "MovieManagerUI",
                          moduleLocalName: "MovieManagerUI",
                          override: true,
                        },
                        {
                          globalName: "MediaManagerUI",
                          moduleLocalName: "MediaManagerUI",
                          override: true
                        }
                      ]
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
