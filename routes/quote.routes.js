/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var quote = require('../controllers/quote.controller');




module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/quote/:id/submit')
        .post(quote.submit);
    router.route('/quote/:id')
        .get(quote.findById);
    router.route('/quote')
        .post(quote.create);
    router.route('/quote/:id/calculate')
        .post(quote.calculate);

};
