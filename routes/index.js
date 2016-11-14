/*jslint node: true */

'use strict';

/**
 * Module dependencies
 */
var express = require('express'),
    controllers = require('../controllers');

/**
 * the new Router exposed in express 4
 * the indexRouter handles all requests to the `/` path
 */
var router = express.Router();

/**
 * this accepts all request methods to the `/` path
 */
router.route('/')
  .all(controllers.index);

require('./user.routes')(router);
require('./healthcheck.routes')(router);
require('./message.routes')(router);
require('./account.routes')(router);
exports.router = router;
