/*jslint node: true */

'use strict';

//TODO: optimize the imports

var config = require('../config/config');
var _ = require('underscore');
var db = require('../services/db');
var User = require('../models/user.model');
var logger = require('../services/logger.service');
var passport = require('passport');
var message = require('../controllers/message.controller');
var noCache = require('connect-nocache')();

// v2 of authorization-faking method.
// TODO: REMOVE when no longer testing email!!
var fakeAuthorization = function (req, res, next) {
    //console.log('Starting fakeAuthorization...');

    User.findByEmail('ken@ellefsontech.com', function (err, user) {
        if (err) {
            //return done(err);
        }
        if (!user) {
            //return done(null, false); //no such user
            next();
        } else {
            //logger.debug('found user');
            //return done(null, user); //allows the call chain to continue to the intended route
            req.user = user;
            next();
        }
    });
};



module.exports = function (router) {
    var PassportAuthMiddleware = passport.authenticate('bearer', { session: false });

    // test
    router.route('/messagehub/himom')
        .get(PassportAuthMiddleware, function (req, res) {
          res.send('Hi Mom! it\'s ' + req.user.name);
        });

    router.route('/messages/:id')
        .get(PassportAuthMiddleware, message.read);
    router.route('/messages/:id/read')
        .post(PassportAuthMiddleware, message.markRead);
    router.route('/messages/markAllRead')
        .post(PassportAuthMiddleware, message.markAllRead);
    router.route('/messages')
        .post(PassportAuthMiddleware, message.create)
        .get(PassportAuthMiddleware, noCache, message.getMessageListForUser);

//    // pages
//    app.get('/messages/page', function (req, res) {
//        res.render('users/messages', {
//            title: 'Message Hub'
//        });
//    });

    // email pull(here for TEST)
    // TODO: relocate?
    router.route('/emailtest')
        .get(fakeAuthorization, message.emailtest);

    router.route('/messages/emailtest')
        .get(fakeAuthorization, function (req, res) {
          res.send('an email test from ' + req.user.name);
        });


};
