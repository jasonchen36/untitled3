/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var categories = require('../controllers/categories.controller');
var noCache = require('connect-nocache')();



module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/categories')
        .get(noCache, categories.list);
    router.route('/categories/:id')
        .get(noCache, categories.getCategoryById);
};
