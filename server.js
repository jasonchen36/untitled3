/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('./config/config');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var compress = require('compression');
var corsMiddleware = require('./middleware/cors.middleware');
var cacheService = require('./services/cache.service');
var passport = require('passport');
var logger = require('./services/logger.service');
var jwt = require('jsonwebtoken');
var mysql = require('mysql');
var pool = require('./services/db').pool;
var moment = require('moment');
var routes = require('./routes');
var expressValidator = require('express-validator');
var multer = require('multer');
var crypto = require('crypto');
var path = require('path');

morgan.token('api_timestamp', function(req, res){ return moment().format('DD MMM HH:mm:ss'); });
morgan.token('response-time', function getResponseTimeToken(req, res) {
  if (!req._startAt || !res._startAt) {
    // missing request and/or response start time
    return;
  }

  // calculate diff
  var ms = (res._startAt[0] - req._startAt[0]) * 1e3
    + (res._startAt[1] - req._startAt[1]) * 1e-6;

  // return truncated value
  return ms.toFixed(0);
});

// Set the node enviornment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV || 'local';

require('./config/passport')(passport);

var app = express();
app.use(corsMiddleware);
app.set('title', config.api.title);
app.disable('x-powered-by');
app.disable('query parser');
app.disable('trust proxy'); // CORS
app.set('etag', false);
app.enable('strict routing');
app.set('showStackError', true);
app.enable('jsonp callback');
app.use(compress());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressValidator({})); // this line must be immediately after express.bodyParser()!

// Using multer for file upload as bodyParser file uploads are depricated in Express 4.x
// see: http://stackoverflow.com/questions/23340548/how-to-upload-files-use-expressjs-4
// 'uploadFileName' below needs to be a field name on the upload form
var storage = multer.diskStorage({
    destination: config.uploadDir,
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(32, function (err, raw) {
            if (err) {
              return cb(err);
            }

            var uploadFileName = raw.toString('hex') + Date.now() + path.extname(file.originalname);
            cb(null, uploadFileName);
        });
    }
});
app.use(multer({ storage: storage }).single('uploadFileName'));

if (process.env.NODE_ENV === 'development') {
    app.set('json spaces', 4);
    app.use(morgan(':api_timestamp :remote-addr - :method :url HTTP/:http-version :status :res[content-length] bytes - :response-time ms'));
} else {
    app.use(morgan(':api_timestamp :req[x-forwarded-for] - :method :url HTTP/:http-version :status :res[content-length] bytes - :response-time ms'));
}

app.use(passport.initialize());

// routes
app.get('/favicon.ico', function(req, res) {
    res.sendStatus(200);
});

app.use(config.api_root_path, routes.router);

// 404 - Not Found
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// 500 - Internal Server Error
app.use(function(err, req, res, next) {
    var code = err.status || 500;
    if (code !== 404) {
        logger.error(err.stack);
    }
    res.status(code);
    if (process.env.NODE_ENV === 'development') {
        res.json({ message: err.message, error: err });
    } else {
        res.json({ message: err.message});
    }
});


process.on('uncaughtException', function (err) {
  logger.error('UNCAUGHT EXCEPTION: Terminating ...');
  if (err.code === 'EADDRINUSE') {
    logger.error('Failed to bind port. Terminating ...');
  } else {
    logger.error(err.message, '\n', err);
  }
  process.exit(1);
});

// errors won't be silently swallowed when someone forgets to add a catch call to a Promise chain
// @see: https://gist.github.com/benjamingr/0237932cee84712951a2
process.on('unhandledRejection', function(error, p){
  logger.error('Possibly Unhandled Rejection at: Promise ', p);
  logger.error('STACK: ' + error.stack);
  process.exit(2);
});

// Start the app by listening on <port>
var port = process.env.PORT || config.port;
var ipaddr = process.env.ipaddr || config.ipaddr || 'localhost';


logger.info('*********************************************************************************************');
logger.info('Starting %s API Server ...', config.api.name);
logger.info('Server Date/Time: %s', Date(Date.now()));

//Setup services
var servicesPromises = [
    cacheService.init(config.cache)
];

Promise.all(servicesPromises).then(function() {
    logger.info('All services initialized');

    app.listen(port, ipaddr, function() {
        logger.info('%s API Server started on %s:%d NODE_ENV=%s', config.api.name, ipaddr, port, app.get('env'));
        logger.info('Upload Directory:        ' + config.uploadDir);
    });
});


module.exports = app;
