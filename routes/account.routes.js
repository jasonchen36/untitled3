/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var account = require('../controllers/account.controller');
var noCache = require('connect-nocache')();


module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/account/:id')
        .get(noCache, account.findById)
        .put(account.update);
    router.route('/account')
        .post(account.create);
};
