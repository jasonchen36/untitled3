/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var logger = require('../services/logger.service');
var passport = require('passport');
var message = require('../controllers/message.controller');
var taxReturn = require('../controllers/tax_return.controller');
var quote = require('../controllers/quote.controller');
var note = require('../controllers/note.controller');
var noCache = require('connect-nocache')();

module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/admin/users/:client/messages')
        .get(PassportAuthMiddleware, message.getMessageListForUser);

    router.route('/admin/tax_returns/statuses')
      .get(PassportAuthMiddleware, noCache, taxReturn.getAvailableTaxReturnStatuses);

    router.route('/admin/quote/:quoteId/document/:documentId/viewed')
      .put(PassportAuthMiddleware, quote.setDocumentAsViewed);


    router.route('/admin/users/:userId/notes')
      .get(PassportAuthMiddleware, noCache, note.list)
      .post(PassportAuthMiddleware, note.create);

    router.route('/admin/users/:userId/notes/:noteId')
      .delete(PassportAuthMiddleware, note.del);

    router.route('/admin/users/:userId/notes/:noteId/done')
      .put(PassportAuthMiddleware, note.markAsDone);
};
