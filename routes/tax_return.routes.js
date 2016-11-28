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
        .post(tax_return.createAddress);
    router.route('/tax_return/:taxReturnId/address/:addressId')
        .get(tax_return.findAddressById)
        .put(tax_return.updateAddress)
        .post(tax_return.linkExistingAddresses);
    router.route('/tax_return/:id/dependant')
        .post(tax_return.createDependant);
    router.route('/tax_return/:taxReturnId/dependant/:dependantId')
        .get(tax_return.findDependantById)
        .put(tax_return.updateDependant)
        .post(tax_return.linkExistingDependants);
    //router.route('/tax_return/:id/checklist')
        //.get(tax_return.findChecklist);
    router.route('/tax_return/:id/document')
        .post(tax_return.createDocument);
    router.route('/tax_return/:id/document/:id')
        .get(tax_return.deleteDocumentById);
};
