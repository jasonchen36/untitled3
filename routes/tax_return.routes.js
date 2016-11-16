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
        .get(tax_return.findTaxReturnById);
    router.route('/tax_return')
        .post(tax_return.createTaxReturn);
    router.route('/tax_return/:id/answer')
        .post(answers.createAnswer);
    router.route('/tax_return/:id/answer/:id')
        .get(answers.findAnswerById);
    router.route('/tax_return/:id/answers')
        .get(answers.listAnswers);
    router.route('/tax_return/:id/address')
        .post(address.createAddress);
    router.route('/tax_return/:id/address/:id')
        .get(address.findAddressById);
    router.route('/tax_return/:id/checklist')
        .get(checklist.findChecklist);
    router.route('/tax_return/:id/document')
        .post(document.createDocument);
    router.route('/tax_return/:id/document/:id')
        .get(document.findDocumentById);
    router.route('/tax_return/:id/address')
        .put(address.updateAddress);
    router.route('tax_return/:id/address/:id')
        .post(document.findById);
};
