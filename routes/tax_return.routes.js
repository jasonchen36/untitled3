/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var tax_return = require('../controllers/tax_return.controller');
var noCache = require('connect-nocache')();



module.exports = function (router) {
    //todo, require authorization
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/tax_return/:id')
        .get(PassportAuthMiddleware, noCache, tax_return.findTaxReturnById)
        .put(PassportAuthMiddleware, tax_return.updateTaxReturnById);
    router.route('/tax_return')
        .post(tax_return.createTaxReturn); // does not require login
    router.route('/tax_returns')
        .post(tax_return.createTaxReturns); // does not require login
    router.route('/tax_return/:id/answers')
        .post(PassportAuthMiddleware, tax_return.createAnswer)
        .get(PassportAuthMiddleware, noCache, tax_return.listAnswers);
    router.route('/tax_return/:taxReturnId/answers/category/:categoryId')
        .get(PassportAuthMiddleware, noCache, tax_return.listAnswersFilterCategory);
    router.route('/tax_return/:id/answer/:id')
        .get(PassportAuthMiddleware, noCache, tax_return.findAnswerById);
    router.route('/tax_return/:id/address')
        .post(PassportAuthMiddleware, tax_return.createAddress);
    router.route('/tax_return/:id/addresses')
        .get(PassportAuthMiddleware, noCache, tax_return.listAddresses);
    router.route('/tax_return/:id/status')
        .put(PassportAuthMiddleware, tax_return.updateTaxReturnStatusById);
    router.route('/tax_return/:id/dependants')
        .get(PassportAuthMiddleware, noCache, tax_return.getDependantsById);
    router.route('/tax_return/:taxReturnId/address/:addressId')
        .get(PassportAuthMiddleware, noCache, tax_return.findAddressById)
        .put(PassportAuthMiddleware, tax_return.updateAddress)
        .post(PassportAuthMiddleware, tax_return.linkExistingAddresses);
    router.route('/tax_return/:id/dependant')
        .post(PassportAuthMiddleware, tax_return.createDependant);
    router.route('/tax_return/:taxReturnId/dependant/:dependantId')
        .get(PassportAuthMiddleware, noCache, tax_return.findDependantById)
        .put(PassportAuthMiddleware, tax_return.updateDependant)
        .post(PassportAuthMiddleware, tax_return.linkExistingDependants)
        .delete(PassportAuthMiddleware, tax_return.deleteDependant);
};
