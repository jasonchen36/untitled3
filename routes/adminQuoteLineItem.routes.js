/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var adminQuoteLineItem = require('../controllers/adminQuoteLineItem.controller');
var noCache = require('connect-nocache')();



module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/quote/:quoteId/adminQuoteLineItem')
        .post(PassportAuthMiddleware, adminQuoteLineItem.create);
    router.route('/quote/:quoteId/adminQuoteLineItem/:adminQuoteLineItemId')
        .get(PassportAuthMiddleware, noCache, adminQuoteLineItem.getById)
        .put(PassportAuthMiddleware, noCache, adminQuoteLineItem.updateById)
        .delete(PassportAuthMiddleware, noCache, adminQuoteLineItem.deleteById);
};