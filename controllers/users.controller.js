/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var config = require('../config/config');
var mailService = require('../services/mail.service');
var async = require("async");
var db = require('../services/db');
var validator = require('express-validator');
var User = require('../models/user.model');
var Account = require('../models/account.model');
var Quote = require('../models/quote.model');
var logger = require('../services/logger.service');
var notificationService = require('../services/notification.service');

/**
 * Auth callback - for Facebook etc login strategies
 */
exports.authCallback = function(req, res) {
    res.redirect('/');
};

/*******************************************************************************
ENDPOINT
PUT /users/reset

INPUT BODY:
{
  "email": "mike@email.com"
}

RESPONSE:
200 OK/404/400
*******************************************************************************/
exports.createResetKey = function(req, res) {
    var userToReset = req.body;

    if ((userToReset.email) && (userToReset.email.length > 0)) {
        return User.findByEmail(userToReset.email).then(function(user) {
            if (user) {
                user.reset_key = User.createResetKey();
                return User.updateResetKey(user.id, user.reset_key).then(function() {

                    var variables = {
                        name: user.first_name,
                        reset_url: config.domain + '/password-reset/' + user.reset_key
                    };
                    logger.info('Sending password reset email to user ' + user.email);
                    logger.debug('reset_url: ' + variables.reset_url);
                    notificationService.sendNotification(user, notificationService.NotificationType.PASSWORD_RESET, variables)
                    res.status(200).send();
                }).catch(function(err) {
                    logger.error(err.message);
                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                    return;
                });
            } else {
                res.status(404).send({ msg: 'unknown user' });
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    } else {
        res.status(400).send({ msg: 'No email provided' });
    }
};

/*******************************************************************************
ENDPOINT
PUT /users/reset/:reset_key

INPUT BODY:
{
  "password": "new-password"
}

RESPONSE:
200 OK/400/404
*******************************************************************************/
exports.resetPassword = function(req, res) {
    var password = req.body.password;

    if ((password) && (password.length > 0)) {
        var reset_key = req.params.reset_key;
        return User.findByResetKey(reset_key).then(function(user) {
            if (user) {
                var new_salt = User.makeSalt();
                var hashed_password = User.encryptPassword(new_salt, password);
                user.hashed_password = hashed_password;
                user.reset_key = null;
                return User.updatePassword(user.id, hashed_password, new_salt).then(function() {
                    res.status(200).send();
                }).catch(function(err) {
                    logger.error(err.message);
                    res.status(500).send({ msg: 'Something broke: check server logs.' });
                    return;
                });
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    } else {
        res.status(400).send({ msg: 'No password provided' });
    }
};

/*******************************************************************************
ENDPOINT
POST /login

INPUT BODY:
{
  "email": "test_user@gmail.com",
  "password": "123"
}

RESPONSE:
200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RfdXNlckBnbWFpbC5jb20iLCJpZCI6NCwiaWF0IjoxNDc5MjQwMDc4LCJleHAiOjE0NzkyNDM2Nzh9.mmwzcpeJAmWHAYmob2iycVxfqEhwjBF9VuhrlZQK2tQ"
}

The token is valid for 1 hour (default from config) and can be attached to
the headers of further requests so endpoints may be called as the validated user
*******************************************************************************/
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

/*******************************************************************************
ENDPOINT
POST /users

INPUT BODY:
{
  "password": "123",
  "first_name": "test_user",
  "last_name": "test_user",
  "email": "test_user@gmail.com",
  "accountId": 2345              // optional
                                    - if accountId is passed do not create an account.
                                      Instead link the account to the new user.
                                    - if not passed create an account and link to user
}

RESPONSE:
200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RfdXNlckBnbWFpbC5jb20iLCJpZCI6NCwiaWF0IjoxNDc5MjQwMDc4LCJleHAiOjE0NzkyNDM2Nzh9.mmwzcpeJAmWHAYmob2iycVxfqEhwjBF9VuhrlZQK2tQ"
}

The token is valid for 1 hour (default from config) and can be attached to
the headers of further requests so endpoints may be called as the validated user
*******************************************************************************/
exports.create = function(req, res, next) {
    req.checkBody('password', 'Password not provided').notEmpty();
    req.checkBody('first_name', 'First Name not provided').notEmpty();
    req.checkBody('last_name', 'Last Name not provided').notEmpty();
    req.checkBody('email', 'Email is invalid').isEmail();
    req.checkBody('accountId', 'Account ID is invalid').optional().isInt();

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
        if (req.body.accountId) {
            userObj.accountId = req.body.accountId; // link account to user
        }
        userObj.productId = config.api.currentProductId;

        return User.findByEmail(userObj.email).then(function(existingUser) {
            if (existingUser) {
                res.status(400).send({ 'message': 'User exists!' });
            } else {
                userObj.provider = 'local';
                userObj.role = 'Customer';
                if (!userObj.accountId) {
                    // create a new account for this user
                    var accountObj = {};
                    accountObj.name = userObj.first_name;
                    return Account.create(accountObj).then(function(accountResult) {
                        userObj.accountId = accountResult;
                        return createUserAndSendEmail(userObj).then(function(token) {
                            res.json({ token : token });

                            // update the last User activity of the logged in user
                            User.updateLastUserActivity(req.user);
                        }).catch(function(err) {
                            logger.error(err.message);
                            res.status(500).send({ msg: 'Something broke: check server logs.' });
                            return;
                        });
                    }).catch(function(err) {
                        logger.error(err.message);
                        res.status(500).send({ msg: 'Something broke: check server logs.' });
                        return;
                    });
                } else {
                    return createUserAndSendEmail(userObj).then(function(token) {
                        res.json({ token : token });

                        // update the last User activity of the logged in user
                        User.updateLastUserActivity(req.user);
                    }).catch(function(err) {
                        logger.error(err.message);
                        res.status(500).send({ msg: 'Something broke: check server logs.' });
                        return;
                    });
                }
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

function createUserAndSendEmail(userObj) {
    return User.create(userObj).then(function(userInsertResult) {
        //userObj.id = userInsertResult;
        var sendWelcomeEmailTo = function(user) {
            var variables = {
                name: user.first_name
            };
            var i = 1;
            var total = 0;
            _.forEach(user.quote, function(quoteLineItem) {
                variables['quote_text' + i] = quoteLineItem.text;
                variables['quote_value' + i] = quoteLineItem.value;
                total = total + quoteLineItem.value;
                i = i + 1;
            });
            variables.total_value = total;
            return notificationService.sendNotification(user, notificationService.NotificationType.WELCOME, variables);
        };

        var notifyAdminAbout = function(user) {
            var variables = {
                name: user.first_name,
                email: user.email
            };
            return mailService.send(user, config.email.templates.profile_created, config.email.admin, variables);
        };

        return User.findByEmail(userObj.email).then(function(user) {
            return Quote.getEmailFieldsByProductIdAccountId(userObj.productId, userObj.accountId).then(function(quote) {
                user.quote = quote;
                return sendWelcomeEmailTo(user).then(function() {
//                  return notifyAdminAbout(user);

                    var token = createToken(user);
                    return token;
                });
            });
        });
    });
}

/*******************************************************************************
ENDPOINT
GET /users/me

INPUT BODY:
None.

RESPONSE:
200 OK
{
  "id": 4,
  "role": "Customer",
  "provider": "local",
  "name": null,
  "email": "test_user@gmail.com",
  "phone": "1234567890",
  "username": "test_user",
  "first_name": "test_user",
  "last_name": "test_user",
  "accounts": null,
  "birthday": null,
  "reset_key": null
}
*******************************************************************************/
exports.me = function(req, res) {
  var user = req.user;

    user.taxpro_pic = null;
    user.taxpro_desc = null;
    if(user.taxpro_id !== null){
        return User.findById(user.taxpro_id).then(function(taxpro) {
            if (taxpro) {
                user.taxpro_pic = taxpro.profile_picture;
                user.taxpro_desc = taxpro.description;
                user.taxpro_name = taxpro.first_name + " " + taxpro.last_name;
                user.taxpro_title = taxpro.title;
                res.jsonp(user ? cleanUserData(user) : null);
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    } else {
        res.jsonp(user ? cleanUserData(user) : null);
    }

};

/*******************************************************************************
ENDPOINT (ADMIN ONLY requires valid admin token in header)
GET /users

INPUT BODY:
None.

RESPONSE:
200 OK
[
  {
    "id": 1,
    "role": "Admin",
    "provider": "local",
    "name": "Admin",
    "email": "4tcsv0+39eb34sja3uyg@sharklasers.com",
    "phone": null,
    "username": "test_admin",
    "first_name": "test_admin",
    "last_name": "test_admin",
    "accounts": null,
    "birthday": null,
    "reset_key": "202bb88282e64298916a0963fcb3143d0c21cb5257856b18632014eedefd0134"
  }
]
*******************************************************************************/
exports.list = function(req, res) {
    var queryParams = req.query ? req.query: {};
    var userRole = req.user.role;

    // TODO look into passport and roles
    if (req.user.role === 'Admin') {
        return User.findAllCustomersFiltered(queryParams).then(function(users) {
            res.status(200).send(cleanUsersData(users));
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    } else if(req.user.role === 'TaxPro') {
        // filter out for users with this taxpro's id.
        queryParams.taxPro=req.user.id;

        return User.findAllCustomersFiltered(queryParams, req.user.id).then(function(users) {
            res.status(200).send(cleanUsersData(users));
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    } else {
        res.status(404).send();
    }
};


/*******************************************************************************
ENDPOINT (ADMIN ONLY requires valid admin token in header)
GET /users/:id

INPUT BODY:
{
  firstname:  "Michael",
  product:    "2016"
}

RESPONSE:
200 OK
{
  "id": 1,
  "role": "Admin",
  "provider": "local",
  "name": "Admin",
  "email": "4tcsv0+39eb34sja3uyg@sharklasers.com",
  "hashed_password": "Akay7w5Z2sC5h1qGh9DxAUgXXvNBbPZaAensbOB9Jr9+vsZ4DOUAEVT8ZvKMoxl7pzI1AH4qEMjyiyNfIaAVzw==",
  "salt": "i5vtb97x5aMjQPv/NH29iw==",
  "phone": null,
  "username": "test_admin",
  "first_name": "test_admin",
  "last_name": "test_admin",
  "accounts": null,
  "birthday": null,
  "reset_key": "202bb88282e64298916a0963fcb3143d0c21cb5257856b18632014eedefd0134"
}
*******************************************************************************/
exports.find = function(req, res, err) {
    // TODO figure out how to get errors from next
    var userId = parseInt(req.params.userId);
    if (req.user.id === userId) {
        res.status(200).send(req.user);
    } else {
        // TODO need service for this
        return User.findById(userId).then(function(user) {
            if (user) {
                res.status(200).send(cleanUserData(user));
            } else {
                res.status(404).send();
            }
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    }
};

/*******************************************************************************
ENDPOINT (ADMIN ONLY requires valid admin token in header)
DELETE /users/:id

INPUT BODY:
None

RESPONSE:
204 No Content or 404

delete is ADMIN ONLY and should only delete other users (not self)
*******************************************************************************/
exports.delete = function(req, res, next) {
    if (User.isAdmin(req.user)) {
        var userId = parseInt(req.params.userId);
        if (req.user.id === userId) {
            res.status(400).send({ msg: 'Unable to remove yourself' });
        } else {
            return User.deleteById(userId).then(function() {
                res.status(204).send();
            }).catch(function(err) {
                logger.error(err.message);
                res.status(500).send({ msg: 'Something broke: check server logs.' });
                return;
            });
        }
    } else {
        res.status(404).send();
    }
};

/*******************************************************************************
ENDPOINT
PUT /users/:id/password

INPUT BODY:
{
  "password": "12345"
}

RESPONSE:
200 OK/404 if user id does not exist

Users can reset their own password. Admins can reset any users password.
*******************************************************************************/
exports.update_password = function(req, res) {
    req.checkParams('userId', 'Please provide a userId').isInt();
    req.checkBody('password', 'Please provide a password').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        res.status(400).send(errors);
    } else {
        var userId = parseInt(req.params.userId);
        var password = req.body.password;

        if (req.user.id === userId || req.user.role === 'Admin') {
            var new_salt = User.makeSalt();
            var hashed_password = User.encryptPassword(new_salt, password);
            return User.updatePassword(userId, hashed_password, new_salt).then(function() {
                res.status(200).send();
            }).catch(function(err) {
                logger.error(err.message);
                res.status(500).send({ msg: 'Something broke: check server logs.' });
                return;
            });
        } else {
            res.status(404).send();
        }
    }
};

/*******************************************************************************
ENDPOINT
PUT /users/:id

INPUT BODY: (need at least one field present, multiple optional fields)
{
  "first_name": "firstname",
  "last_name": "lastname",
  "email": "fake@email.com",
  "phone": "1234567890"
}
RESPONSE:
200 OK/404 if user id does not exist

Users can update their own first_name, last_name, email and phone.
Admins can update role for other users.
*******************************************************************************/
exports.update = function(req, res, next) {
    var userId = parseInt(req.params.userId);
    var user = req.body;


    if (req.user.id === userId || req.user.role === 'Admin') {
        //var keys = ['name', 'birthday', 'address', 'phone'];
        var keys = ['first_name', 'last_name', 'email', 'phone','taxpro_id']; //v2

        if (User.isAdmin(req.user)) {
            keys.push('role');
        }
        if ((user.role) && ((user.role !== 'Admin') && (user.role !== 'Customer') && user.role !== 'TaxPro')) {
            return res.status(409).json(new Error('Invalid role'));
        }
        var params = _.pick(user, keys);

        return User.findById(userId).then(function(user) {
            _.each(params, function(value, key) {
                user[key] = value;
            });

            return User.updateById(userId,params)
            .then(function(userResult) {
                // update the last User activity of the logged in user
                User.updateLastUserActivity(req.user);

                return res.json(cleanUserData(userResult));
            }).catch(function(err) {
                logger.error(err.message);
                res.status(500).send({ msg: 'Something broke: check server logs.' });
                return;
            });
        }).catch(function(err) {
            logger.error(err.message);
            res.status(500).send({ msg: 'Something broke: check server logs.' });
            return;
        });
    } else {
        res.status(404).send();
    }
};

/******************************************************************************
 *                                                                            *
 *                    HELPER FUNCTIONS                                        *
 *                                                                            *
 ******************************************************************************/

// router.param  user
exports.user = function(req, res, next, id) {
    return User.findById(id).then(function(user) {
        if (!user) return next({ message: 'Failed to load User ' + id, status: 404 });
        req.user = user;
        next();
    }).catch(function(err) {
        logger.error(err.message);
        res.status(500).send({ msg: 'Something broke: check server logs.' });
        return;
    });
};

// create a JWT token from payload
var createToken = function (user) {
    var payloadObj = {};
    payloadObj.email = user.email;
    payloadObj.id = user.id;

    return jwt.sign(payloadObj, config.sessionSecret, { expiresIn: config.JWTExpires });
};

var cleanUsersData = function (users) {
  return _.map(users, function(ul) {
    return cleanUserData(ul);
  });
};

var cleanUserData = function (user) {
  var cleanedUser = _.merge({},user);

  delete cleanedUser.hashed_password;
  delete cleanedUser.salt;

  return cleanedUser;
};
