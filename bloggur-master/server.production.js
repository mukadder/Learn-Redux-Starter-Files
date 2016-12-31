'use strict';

var secret = 'super-secret-key';

var fs = require('fs');
var https = require('https');
var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var compression = require('compression');
var bodyParser = require('body-parser');
var middleware = require('./lib/middleware').default;

var useWWW = true;
var httpApp = new express();
var httpPort = 8080;
var httpsApp = new express();
var httpsPort = 4433;

var ssl = {
  directory: './ssl/',
  keyFile: 'server.key',
  certFile: 'www_domain_com.crt',
  caFiles: [
    'bundle.crt'
  ]
};

var sslEnabled = true;
var serverOptions;

try {
  serverOptions = {
    secureProtocol: 'SSLv23_method',
    secureOptions: require('constants').SSL_OP_NO_SSLv3,
    key: fs.readFileSync(ssl.directory + ssl.keyFile),
    cert: fs.readFileSync(ssl.directory + ssl.certFile),
    ca: ssl.caFiles.map(function(file) {
      return fs.readFileSync(ssl.directory + file);
    })
  };
} catch (error) {
  sslEnabled = false;
  httpsApp = httpApp;
  httpsPort = httpPort;
  console.error('SSL configuration error:\n', error);
}

if (sslEnabled) {
  httpApp.use(function httpsRedirection(request, response, next) {
    try {
      var host = request.headers.host;
      var url = request.originalUrl || request.baseUrl;

      if (useWWW && host.split('.').length < 3) {
        response.redirect('https://www.' + host + url);
      } else {
        response.redirect('https://' + host + url);
      }
    } catch(err) {
      next();
    }
  });

  httpApp.listen(httpPort, function(error) {
    if (error) {
      console.error(error);
    } else {
      console.info(
        'Redirecting http (%s) to https (%s).', httpPort, httpsPort
      );
    }
  });

  if (useWWW) {
    httpsApp.use(function wwwRedirection(request, response, next) {
      try {
        var host = request.headers.host;
        var url = request.originalUrl || request.baseUrl;

        if (host.split('.').length < 3) {
          response.redirect('https://www.' + host + url);
        } else {
          next();
        }
      } catch(err) {
        next();
      }
    });
  }
}

httpsApp.use(compression({ threshold: 256 }));
httpsApp.use('/dist', express.static(__dirname + '/dist'));
httpsApp.use('/static', express.static(__dirname + '/static'));

httpsApp.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
  store: new FileStore(),
  cookie: { secure: sslEnabled }
}));

httpsApp.use(bodyParser.json());
httpsApp.use(bodyParser.urlencoded({ extended: true }));
httpsApp.use(middleware);

function serverRunning(error) {
  if (error) {
    console.error(error);
  } else {
    console.info('App running in production mode on port %s.', httpsPort);
  }
}

if (sslEnabled) {
  https.createServer(serverOptions, httpsApp).listen(httpsPort, serverRunning);
} else {
  httpApp.listen(httpsPort, serverRunning);
}
