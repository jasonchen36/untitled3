/*jslint node: true */

'use strict';

var config = require('../config/config');
var passport = require('passport');
var notificationsController = require('../controllers/notifications.controller');



module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    router.route('/notifications')
        .get(PassportAuthMiddleware, notificationsController.listAll);
    router.route('/notifications/unread')
        .get(PassportAuthMiddleware, notificationsController.listUnread);
    router.route('/notifications/:id')
        .get(PassportAuthMiddleware, notificationsController.findById);
};
