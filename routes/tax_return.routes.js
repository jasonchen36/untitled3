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
        .get(tax_return.findTaxReturnById)
        .put(tax_return.updateTaxReturnById);
    router.route('/tax_return')
        .post(tax_return.createTaxReturn);
    router.route('/tax_return/:id/answers')
        .post(tax_return.createAnswer)
        .get(tax_return.listAnswers);
    router.route('/tax_return/:id/answer/:id')
        .get(tax_return.findAnswerById);
    router.route('/tax_return/:id/address')
        .post(tax_return.createAddress)
        .put(tax_return.updateAddress);
    router.route('/tax_return/:id/address/:id')
        .get(tax_return.findAddressById)
        .post(tax_return.linkExistingAddresses);
    router.route('/tax_return/:id/dependent')
        .post(tax_return.createDependent)
        .put(tax_return.updateDependent);
    router.route('/tax_return/:id/dependent/:id')
        .get(tax_return.findDependentById)
        .post(tax_return.linkExistingDependents);
    router.route('/tax_return/:id/checklist')
        .get(tax_return.findChecklist);
    router.route('/tax_return/:id/document')
        .post(tax_return.createDocument);
    router.route('/tax_return/:id/document/:id')
        .get(tax_return.deleteDocumentById);
};
