const webpack = require("webpack");
const path = require("path");

module.exports = {
    entry: ["./jquery.periodpicker.js"],
    output: {
        filename: "jquery.periodpicker.min.js",
        path: path.resolve(__dirname)
    },
    plugins: [
        new webpack.ProvidePlugin({
            moment: "moment"
        })
    ],
    mode: "production"
};

