/*jslint node: true */

'use strict';

var passport = require('passport');
var users = require('../controllers/users.controller');
var _ = require('underscore');

module.exports = function(router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session:false });

    router.route('/users/reset')
        .put(users.createResetKey);
    router.route('/users/reset/:reset_key')
        .put(users.resetPassword);
    router.route('/login')
        .post(users.logUserIn);
    router.route('/users/me')
        .get(PassportAuthMiddleware, users.me);
    router.route('/users/:userId')
        .get(users.find)
        .put(PassportAuthMiddleware, users.update)
        .delete(PassportAuthMiddleware, users.delete);
    router.route('/users')
        .get(PassportAuthMiddleware, users.list)
        .post(users.create);
    router.route('/users/:userId/password')
        .put(PassportAuthMiddleware, users.update_password);



    // Setting up the userId param
    router.param('userId', users.user);
};
