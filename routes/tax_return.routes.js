/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var tax_return = require('../controllers/tax_return.controller');




module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/tax_return/:id')
        .get(tax_return.findById);
    router.route('/tax_return')
        .post(tax_return.create);
    router.route('/tax_return/:id/answer')
        .post(answers.create);
    router.route('/tax_return/:id/answer/:id')
        .get(answers.findById);
    router.route('/tax_return/:id/answers')
        .get(answers.find);
    router.route('/tax_return/:id/address')
        .post(address.create);
    router.route('/tax_return/:id/address/:id')
        .get(address.findById);
    router.route('/tax_return/:id/checklist')
        .get(checklist.find);
    router.route('/tax_return/:id/document')
        .post(document.create);
    router.route('/tax_return/:id/document/:id')
        .get(document.findById);
    router.route('/tax_return/:id/address')
        .post.(address.create);
    router.route('tax_return/:id/address/:id')
        .get(document.findById);    
};
