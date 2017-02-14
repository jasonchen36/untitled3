/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var quote = require('../controllers/quote.controller');
var noCache = require('connect-nocache')();



module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/quote/:id/submit')
        .post(PassportAuthMiddleware, quote.submit);
    router.route('/quote/:id')
        .get(PassportAuthMiddleware, noCache, quote.findById);
    router.route('/quote')
        .post(quote.create); // Create quote does not requite Auth!
//    router.route('/quote/:id/lineItem')
//        .post(PassportAuthMiddleware, quote.createLineItem);
//    router.route('/quote/:quoteId/lineItem/:lineItemId')
//        .put(PassportAuthMiddleware, quote.updateLineItem)
//        .delete(PassportAuthMiddleware, quote.deleteLineItemById);
    router.route('/quote/:id/adminChecklist')
        .get(PassportAuthMiddleware, quote.getAdminChecklist);
    router.route('/quote/:id/document')
        .post(PassportAuthMiddleware, quote.createDocument);
    router.route('/quote/:quoteId/document/:documentId')
        .delete(PassportAuthMiddleware, quote.deleteDocumentById)
        .get(PassportAuthMiddleware, noCache, quote.getDocumentById);
    router.route('/quote/:id/checklist')
        .get(PassportAuthMiddleware, noCache, quote.getChecklist);
    router.route('/quote/:id/checklist/PDF')
        .get(PassportAuthMiddleware, noCache, quote.getChecklistPDF);
    router.route('/quote/product/:productId/account/:accountId')
        .get(PassportAuthMiddleware, noCache, quote.findByAccountId);
    router.route('/quote/:quoteId/taxReturn/:taxReturnId/setDirectDeposit')
        .put(PassportAuthMiddleware, noCache, quote.setDirectDeposit);
};
