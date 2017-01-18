/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var message = require('../controllers/message.controller');
var taxReturn = require('../controllers/tax_return.controller');



module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/admin/users/:client/messages')
        .get(PassportAuthMiddleware, message.getMessageListForUser);

    router.route('/admin/tax_returns/statuses')
      .get(PassportAuthMiddleware, taxReturn.getAvailableTaxReturnStatuses);
};
