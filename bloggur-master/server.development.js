'use strict';

require('css-modules-require-hook')({
  generateScopedName: '[name]__[local]___[hash:base64:5]'
});
require('babel-register');

var secret = 'super-secret-key';

var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var webpackHotMiddleware = require('webpack-hot-middleware');
var config = require('./webpack.config.development');

var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var app = new express();
var port = 3000;

var compiler = webpack(config);
var devMiddleware = webpackDevMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
})
var hotMiddleware = webpackHotMiddleware(compiler);
var compression = require('compression');
var bodyParser = require('body-parser');

var chokidar = require('chokidar');
var watcher = chokidar.watch('./src');
watcher.on('ready', function() {
  watcher.on('all', function() {
    Object.keys(require.cache).forEach(function(id) {
      if (/\/src\//.test(id)) delete require.cache[id];
    });

    console.info('Cleared /src/ module cache from server.');
  });
});

app.use(devMiddleware);
app.use(hotMiddleware);

app.use(compression({ threshold: 256 }));
app.use('/static', express.static(__dirname + '/static'));

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
  store: new FileStore()
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function reloadableMiddleware(request, response, next) {
  require('./src/middleware').default(request, response, next);
});

app.listen(port, function(error) {
  if (error) {
    console.error(error.stack);
  } else {
    console.info('App running in development mode on port %s.', port);
  }
});
