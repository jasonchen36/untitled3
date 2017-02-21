/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var account = require('../controllers/account.controller');
var userModel = require('../models/user.model');
var acocuntModel = require('../models/account.model');
var noCache = require('connect-nocache')();


module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });
    var PassportAccountAuthMiddleware = function(req, res, next) {
        var accountId = parseInt(req.params.id);
        return userModel.findByAccountId(accountId).then(function(userObj) {
            if (!userObj) { // no user exists for this account: do not limit access (still onboarding)
                return next();
            }
            if (acocuntModel.hasAccess(userObj, accountId)) {
                return PassportAuthMiddleware(req, res, next);
            } else {
                return res.status(401).send({ msg: 'Unauthorized' });
            }
        });
   };

    router.route('/account/:id')
        .get(PassportAccountAuthMiddleware, noCache, account.findById)
        .put(account.update);
    router.route('/account')
        .post(account.create);
};
