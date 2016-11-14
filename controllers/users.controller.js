/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
//var Account = mongoose.model('Account');
var passport = require('passport');
var jwt = require('jsonwebtoken');
var _ = require('underscore');
var config = require('../config/config');
var mail = require('../services/mail');
var async = require("async");
var db = require('../services/db');
var validator = require('express-validator');
var User = require('../models/user.model');
var logger = require('../services/logger.service');

/**
 * Auth callback - for Facebook etc login strategies
 */
exports.authCallback = function(req, res) {
    res.redirect('/');
};


exports.createResetKey = function(req, res) {
    var userToReset = req.body;

    if ((userToReset.email) && (userToReset.email.length > 0)) {
        User.findByEmail(userToReset.email).then(function(user) {
            if (user) {
                user.reset_key = User.createResetKey();
                User.updateResetKey(user.id, user.reset_key).then(function() {
                    var callback = {
                        success: function(response, object) {},
                        error: function(response, object) {}
                    };
                    var variables = {
                        name: user.name,
                        reset_url: config.domain + '/#!/set_password/' + user.reset_key
                    };
                    logger.info('Sending password reset email to user ' + user.email);
                    logger.debug('reset_url: ' + variables.reset_url);
//                  mail.send(config.email.templates.password_reset, user.email, variables, callback);
                    res.status(200).send();
                });
            } else {
                res.status(404).send({ msg: 'unknown user' });
            }
        });
    } else {
        res.status(400).send({ msg: 'No email provided' });
    }
};

exports.resetPassword = function(req, res) {
    var password = req.body.password;

    if ((password) && (password.length > 0)) {
        var reset_key = req.params.reset_key;
        User.findByResetKey(reset_key).then(function(user) {
            if (user) {
                var new_salt = User.makeSalt();
                var hashed_password = User.encryptPassword(new_salt, password);
                user.hashed_password = hashed_password;
                user.reset_key = null;
                User.updatePassword(user.id, hashed_password, new_salt).then(function() {
                    res.status(200).send();
                });
            } else {
                res.status(404).send();
            }
        });
    } else {
        res.status(400).send();
    }
};

var createToken = function (user) {
    var payloadObj = {};
    payloadObj.email = user.email;
    payloadObj.id = user.id;

    return jwt.sign(payloadObj, config.sessionSecret, { expiresIn: config.JWTExpires });
};

exports.logUserIn = function(req, res, next) {
    passport.authenticate('local-login', function(err, user, info) {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(400).json([{ msg: 'Invalid email or password' }]);
        }

        //Add token to user
        var token = createToken(user);
        //var accounts = user.accounts;, accounts: accounts
        return res.json({ token : token });

    })(req, res, next);
};

/**
 * Create user
 */
exports.create = function(req, res, next) {
//    req.checkBody('username', 'Username not provided').notEmpty();
//    req.checkBody('username', 'Username can only contain letters, numbers, periods, and underscores').optional().matches('^[a-zA-Z0-9._]+$');
    req.checkBody('password', 'Password not provided').notEmpty();
    req.checkBody('first_name', 'First Name not provided').notEmpty();
    req.checkBody('last_name', 'Last Name not provided').notEmpty();
    req.checkBody('email', 'Email is invalid').isEmail();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var userObj = {};
        userObj.username = req.body.username;
        userObj.salt = User.makeSalt();
        userObj.hashed_password = User.encryptPassword(userObj.salt, req.body.password);
        userObj.first_name = req.body.first_name;
        userObj.last_name = req.body.last_name;
        userObj.email = req.body.email;
        User.findByEmail(userObj.email).then(function(existingUser) {
            if (existingUser) {
                res.status(400).send({ 'message': 'User exists!' });
            } else {
                userObj.provider = 'local';
                userObj.role = 'Customer';
                User.create(userObj).then(function() {
                    // TODO link user to account

                    // TODO email may not exist
                    var sendWelcomeEmailTo = function(user) {
                        var variables = {
                            name: user.name
                        };
                        mail.send(config.email.templates.welcome, user.email, variables);
                    };

                    var notifyAdminAbout = function(user) {
                        var variables = {
                            name: user.name,
                            email: user.email
                        };
                        mail.send(config.email.templates.profile_created, config.email.admin, variables);
                    };

                    User.findByEmail(userObj.email).then(function(user) {
    //                  sendWelcomeEmailTo(user);
    //                  notifyAdminAbout(user);

                        var token = createToken(user);
                        res.json({ token : token });
                    });
            });
            }
        });
    }
};

/**
 * Send User
 */
exports.me = function(req, res) {
    delete req.user.hashed_password;
    delete req.user.salt;
    res.jsonp(req.user || null);
};

exports.list = function(req, res) {
    // TODO look into passport and roles
    if (req.user.role === 'Admin') {
        User.findAllCustomers().then(function(users) {
            _.forEach(users, function(user) {
                delete user.hashed_password;
                delete user.salt;
            });
            res.send(users);
        });
    } else {
        res.status(404).send();
    }
};

/**
 * Find user by id
 */
exports.user = function(req, res, next, id) {
    User.findById(id).then(function(user) {
        if (!user) return next({ message: 'Failed to load User ' + id, status: 404 })
        req.user = user;
        next();
    });
};

exports.find = function(req, res, err) {
    // TODO figure out how to get errors from next
    var userId = req.params.userId;
    if (req.user.id === userId) {
        res.send(req.user);
    } else {
        // TODO need service for this
        User.findById(userId).then(function(user) {
            delete user.hashed_password;
            delete user.salt;
            res.send(user);
        });
    }
};

// delete is ADMIN ONLY and should only delete other users
exports.delete = function(req, res, next) {
    if (User.isAdmin(req.user)) {
        var userId = req.params.userId;
        if (req.user.id == userId) {
            res.status(400).send({ msg: 'Unable to remove yourself' });
        } else {
            User.deleteById(userId).then(function() {
                res.status(204).send();
            });
        }
    } else {
        res.status(404).send();
    }
};

exports.update_password = function(req, res) {
    req.checkParams('userId', 'Please provide a userId').notEmpty();
    req.checkBody('password', 'Please provide a password').notEmpty();

    var userId = req.params.userId;
    var password = req.body.password;

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        if (req.user.id == userId || req.user.role == 'Admin') {
            var new_salt = User.makeSalt();
            var hashed_password = User.encryptPassword(new_salt, password);
            User.updatePassword(userId, hashed_password, new_salt).then(function() {
                res.status(200).send();
            });
        } else {
            res.status(404).send();
        }
    }
};

exports.update = function(req, res, next) {
    var userId = req.params.userId;
    var user = req.body;
    if (req.user.id == userId || req.user.role == 'Admin') {
        //var keys = ['name', 'birthday', 'address', 'phone'];
        var keys = ['first_name', 'last_name', 'email', 'phone']; //v2
        if (User.isAdmin(req.user)) {
            keys.push('role');
        }
        if ((user.role) && ((user.role1=== 'Admin') || (user.role !== 'Customer'))) {
            return res.status(409).json(new Error('Invalid role'));
        }
        var params = _.pick(user, keys);

        User.findById(userId).then(function(user) {
            _.each(params, function(value, key) {
                user[key] = value;
            });
            db.knex('users').update(user).where('id', userId).then(function(userResult) {
                delete user.hashed_password;
                delete user.salt;
                return res.json(user);
              });
        });
    } else {
        res.status(404).send();
    }
};