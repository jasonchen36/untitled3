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
        .post(PassportAuthMiddleware, quote.submit);
    router.route('/quote/:id')
        .get(PassportAuthMiddleware, quote.findById);
    router.route('/quote')
        .post(quote.create); // Create quote does not requite Auth!
    router.route('/quote/:id/document')
        .post(PassportAuthMiddleware, quote.createDocument);
    router.route('/quote/:quoteId/document/:documentId')
        .delete(PassportAuthMiddleware, quote.deleteDocumentById);
    router.route('/quote/:id/checklist')
        .get(PassportAuthMiddleware, quote.getChecklist);
    router.route('/quote/:id/checklist/PDF')
        .get(PassportAuthMiddleware, quote.getChecklistPDF);
    router.route('/quote/product/:productId/account/:accountId')
        .get(PassportAuthMiddleware, quote.findByAccountId);
};
