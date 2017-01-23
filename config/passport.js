/*jslint node: true */

'use strict';

var LocalStrategy = require('passport-local').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var config = require('./config');
var jwt = require('jsonwebtoken');
var db = require('../services/db');
var Promise = require('bluebird');
var User = require('../models/user.model');
var logger = require('../services/logger.service');

module.exports = function(passport) {

    // Serialize the user id to push into the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // Deserialize the user object based on a pre-serialized token
    // which is the user id
    passport.deserializeUser(function(id, done) {
        User.findById(id).then(function(err, user) {
            done(err, user);
        });
    });

    // Use local strategy
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function(req, email, password, done) {
        User.findByEmail(email).then(function(user) {
            if (!user) {
                return done(null, false, { message: 'Unknown user' });
            }

            var isMatch = User.authenticate(user.salt, password, user.hashed_password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid password' });
            }
            return done(null, user);
        });
    })),

    passport.use(new BearerStrategy(
        function(token, done) {
            try {
                jwt.verify(token, config.sessionSecret, function(err, decoded) {
                    if (err) {
                        /*
                          err = {
                            name: 'TokenExpiredError',
                            message: 'jwt expired',
                            expiredAt: 1408621000
                          }
                        */
                        if (err.expiredAt) {
                            logger.error(err.name + ': ' + err.message + ', expiredAt: ' + err.expiredAt);
                        } else {
                            logger.error(err.name + ': ' + err.message);
                        }
                        return done(null, false);
                    }
                    User.findByEmail(decoded.email).then(function(user) {
                        if (!user) {
                            return done(null, false); //no such user
                        } else {
                            return done(null, user); //allows the call chain to continue to the intended route
                        }
                    });
                });
            } catch (err) {
                return done(null, false);
            }
        }
    ));
};
