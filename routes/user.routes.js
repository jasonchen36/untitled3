/*jslint node: true */

'use strict';

var passport = require('passport');
var users = require('../controllers/users.controller');
var _ = require('underscore');
var noCache = require('connect-nocache')();

module.exports = function(router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session:false });

    router.route('/users/deleteme/:delete_user_key')
        .put(noCache, users.softDeleteUser);
    router.route('/users/reset/:reset_key')
        .put(users.resetPassword);
    router.route('/users/reset')
        .put(users.createResetKey);
    router.route('/users/:userId/password')
        .put(PassportAuthMiddleware, users.update_password);
    router.route('/users/me')
        .get(PassportAuthMiddleware, noCache, users.me);
    router.route('/users/taxpros')
        .get(PassportAuthMiddleware, noCache, users.getAllTaxPros);
    router.route('/users/:userId')
        .get(PassportAuthMiddleware, noCache, users.find)
        .put(PassportAuthMiddleware, users.update)
        .delete(PassportAuthMiddleware, users.delete);
    router.route('/users')
        .get(PassportAuthMiddleware, noCache, users.list)
        .post(users.create);

    router.route('/login')
        .post(users.logUserIn);



    // Setting up the userId param
    router.param('userId', users.user);
};
