var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var React = require('react');

makeIndex();

module.exports = {
    devtool: 'eval',

    entry: './index.js',

    output: {
        path: '__build__',
        filename: 'build.js',
        publicPath: '__build__'
    },

    module: {
        loaders: [
            //{ test: /\.js$/, loader: 'mocha-loader', exclude: /node_modules/ },
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
            { test: /\.woff(2)?$/,   loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf$/, loader: "file-loader" },
            { test: /\.eot$/, loader: "file-loader" },
            { test: /\.svg$/, loader: "file-loader" }
        ]
    }
};

function makeIndex() {
    if (!fs.existsSync('./index.css')) fs.writeFileSync('./index.css', "body {}");
    if (!fs.existsSync('./index.js')) fs.writeFileSync('./index.js', 'console.log("Hello World");');
    fs.writeFileSync('./index.html', makeMarkup('index'));
}

function makeMarkup(mainFile) {
  return React.renderToStaticMarkup((
    React.DOM.html({},
      React.DOM.link({ rel: 'stylesheet', href: '/index.css' }),
      React.DOM.body({},
        React.DOM.div({ id: 'mocha' }),
        React.DOM.div({ id: 'app' }),
        React.DOM.script({ src: '/__build__/build.js' })
      )
    )
  ));
}
