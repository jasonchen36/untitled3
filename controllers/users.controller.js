/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var passport = require('passport');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var validator = require('express-validator');
var userModel = require('../models/user.model');
var accountModel = require('../models/account.model');
var quoteModel = require('../models/quote.model');
var logger = require('../services/logger.service');
var db = require('../services/db');
var notificationService = require('../services/notification.service');
var mailService = require('../services/mail.service');

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
exports.createResetKey = function(req, res, next) {
    var userToReset = req.body;

    if ((!userToReset) || (!userToReset.email) || (userToReset.email.length === 0)) {
        return res.status(400).send({ msg: 'No email provided' });
    }
    return userModel.findByEmail(userToReset.email).then(function(userObj) {
        if (!userObj) {
            return res.status(404).send({ msg: 'unknown user' });
        }
        userObj.reset_key = userModel.createResetKey();
        return userModel.updateResetKey(userObj.id, userObj.reset_key).then(function() {
            var variables = {
                name: userObj.first_name,
                reset_url: config.domain + '/password-reset/' + userObj.reset_key
            };
            logger.info('Sending password reset email to user ' + userObj.email);
            logger.debug('reset_url: ' + variables.reset_url);
            return notificationService.sendNotification(userObj, notificationService.NotificationType.PASSWORD_RESET, variables).then(function() {
                return res.status(200).send();
            });
        }).catch(function(err) {
            next(err);
        });
    }).catch(function(err) {
        next(err);
    });
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
exports.resetPassword = function(req, res, next) {
    var password = req.body.password;

    if ((!password) || (password.length === 0)) {
        res.status(400).send({ msg: 'No password provided' });
    }
    var reset_key = req.params.reset_key;
    return userModel.findByResetKey(reset_key).then(function(userObj) {
        if (!userObj) {
            return res.status(404).send();
        }
        var new_salt = userModel.makeSalt();
        var hashed_password = userModel.encryptPassword(new_salt, password);
        userObj.hashed_password = hashed_password;
        userObj.reset_key = null;
        return userModel.updatePassword(userObj.id, hashed_password, new_salt).then(function() {
            return res.status(200).send();
        }).catch(function(err) {
            next(err);
        });
    }).catch(function(err) {
        next(err);
    });
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
    passport.authenticate('local-login', function(err, userObj, info) {
        if (err) {
            return next(err);
        }

        if (!userObj) {
            return res.status(400).json([{ msg: 'Invalid email or password' }]);
        } else if (userObj.migrated_user === 'Yes'){
            return res.status(400).json([{ msg: 'You are a migrated user. Please reset your password.' }]);
        }

        //Add token to user
        var token = createToken(userObj);
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
    if (errors) { return res.status(400).send(errors); }

    var userObj = {};
    userObj.username = req.body.username;
    userObj.salt = userModel.makeSalt();
    userObj.hashed_password = userModel.encryptPassword(userObj.salt, req.body.password);
    userObj.first_name = req.body.first_name;
    userObj.last_name = req.body.last_name;
    userObj.email = req.body.email;
    if (req.body.accountId) {
        userObj.accountId = parseInt(req.body.accountId); // link account to user
    }
    userObj.productId = config.api.currentProductId;

    return userModel.findByEmail(userObj.email).then(function(existingUser) {
        if (existingUser) {
            return res.status(400).send({ 'message': 'User exists!' });
        }
        userObj.provider = 'local';
        userObj.role = 'Customer';
        if (!userObj.accountId) {
            // create a new account for this user
            var accountObj = {};
            accountObj.name = userObj.first_name;
            return accountModel.create(accountObj).then(function(accountId) {
                userObj.accountId = accountId;
                return createUserAndSendEmail(userObj).then(function(token) {
                    return res.json({ token : token });
                }).catch(function(err) {
                    next(err);
                });
            }).catch(function(err) {
                next(err);
            });
        } else {
            return createUserAndSendEmail(userObj).then(function(token) {
                return res.json({ token : token });
            }).catch(function(err) {
                next(err);
            });
        }
    }).catch(function(err) {
        next(err);
    });
};

function createUserAndSendEmail(userObj) {
    return userModel.create(userObj).then(function(userInsertResult) {
        var sendWelcomeEmailTo = function(userObj) {
            var variables = {
                name: userObj.first_name
            };
            var i = 1;
            var total = 0;
            _.forEach(userObj.quote, function(quoteLineItem) {
                variables['quote_text' + i] = quoteLineItem.text;
                variables['quote_value' + i] = quoteLineItem.value;
                total = total + quoteLineItem.value;
                i = i + 1;
            });
            variables.total_value = total;
            return notificationService.sendNotification(userObj, notificationService.NotificationType.WELCOME, variables);
        };

        var notifyAdminAbout = function(userObj) {
            var variables = {
                name: userObj.first_name,
                email: userObj.email
            };
            return mailService.send(userObj, config.email.templates.profile_created, config.email.admin, variables);
        };

        var productId = userObj.productId;
        var accountId = userObj.accountId;
        return userModel.findByEmail(userObj.email).then(function(userResultObj) {
            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(userResultObj);
            return quoteModel.getEmailFieldsByProductIdAccountId(productId, accountId).then(function(quote) {
                userResultObj.quote = quote;
                return sendWelcomeEmailTo(userResultObj).then(function() {
//                  return notifyAdminAbout(user);
                    var token = createToken(userResultObj);
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
exports.me = function(req, res, next) {
  var userObj = req.user;

    userObj.taxpro_pic = null;
    userObj.taxpro_desc = null;
    if(userObj.taxpro_id !== null){
        return userModel.findById(userObj.taxpro_id).then(function(taxproObj) {
            if (taxproObj) {
                userObj.taxpro_pic = taxproObj.profile_picture;
                userObj.taxpro_desc = taxproObj.description;
                userObj.taxpro_name = taxproObj.first_name + " " + taxproObj.last_name;
                userObj.taxpro_title = taxproObj.title;
                res.jsonp(userObj ? cleanUserData(userObj) : null);
            }
        }).catch(function(err) {
            next(err);
        });
    } else {
        res.jsonp(userObj ? cleanUserData(userObj) : null);
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
exports.list = function(req, res, next) {
    var queryParams = req.query ? req.query: {};

    // TODO look into passport and roles
    if (userModel.isAdmin(req.user)) {
        return userModel.findAllCustomersFiltered(queryParams).then(function(usersArr) {
            return res.status(200).send(cleanUsersData(usersArr));
        }).catch(function(err) {
            next(err);
        });
    } else if(userModel.isTaxpro(req.user)) {
        // filter out for users with this taxpro's id.
        queryParams.taxPro=req.user.id;

        return userModel.findAllCustomersFiltered(queryParams, req.user.id).then(function(usersArr) {
            return res.status(200).send(cleanUsersData(usersArr));
        }).catch(function(err) {
            next(err);
        });
    } else {
        return res.status(404).send();
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
exports.find = function(req, res, next) {
    req.checkParams('userId', 'Please provide a userId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var userId = parseInt(req.params.userId);
    if (req.user.id === userId) {
        return res.status(200).send(req.user);
    } else {
         return userModel.findById(userId).then(function(userObj) {
            if (!userObj) {
                return res.status(404).send();
            }
            return res.status(200).send(cleanUserData(userObj));
        }).catch(function(err) {
            next(err);
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
    req.checkParams('userId', 'Please provide a userId').isInt();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    if (userModel.isAdmin(req.user)) {
        var userId = parseInt(req.params.userId);
        if (req.user.id === userId) {
            return res.status(400).send({ msg: 'Unable to remove yourself' });
        }
        return userModel.deleteById(userId).then(function() {
            return res.status(204).send();
        }).catch(function(err) {
            next(err);
        });
    } else {
        return res.status(403).send();
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
exports.update_password = function(req, res, next) {
    req.checkParams('userId', 'Please provide a userId').isInt();
    req.checkBody('password', 'Please provide a password').notEmpty();
    var errors = req.validationErrors();
    if (errors) { return res.status(400).send(errors); }

    var userId = parseInt(req.params.userId);
    var password = req.body.password;

    if (!(req.user.id === userId) && (!userModel.isAdmin(req.user))) {
        return res.status(403).send();
    }
    var new_salt = userModel.makeSalt();
    var hashed_password = userModel.encryptPassword(new_salt, password);
    return userModel.updatePassword(userId, hashed_password, new_salt).then(function() {
        return res.status(200).send();
    }).catch(function(err) {
        next(err);
    });
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
    var userObj = req.body;


    if (req.user.id !== userId && (!userModel.isAdmin(req.user))) {
        return res.status(403).send();
    }
    var keys = ['first_name', 'last_name', 'email', 'phone','taxpro_id'];

    if (userModel.isAdmin(req.user)) {
        keys.push('role');
    }
    if ((userObj.role) && (!userModel.isValidRole(userObj.role))) {
        return res.status(409).json(new Error('Invalid role'));
    }
    var params = _.pick(userObj, keys);

    return userModel.findById(userId).then(function(foundUserObj) {
        if ((!foundUserObj) || (foundUserObj.length === 0)) {
            return res.status(404).send();
        }
        _.each(params, function(value, key) {
            foundUserObj[key] = value;
        });

        return userModel.updateById(userId, params)
        .then(function(userResultObj) {
            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);

            return res.json(cleanUserData(userResultObj));
        }).catch(function(err) {
            next(err);
        });
    }).catch(function(err) {
        next(err);
    });
};

/******************************************************************************
 *                                                                            *
 *                    HELPER FUNCTIONS                                        *
 *                                                                            *
 ******************************************************************************/

// router.param  user
exports.user = function(req, res, next, id) {
    return userModel.findById(id).then(function(userObj) {
        if (!userObj) return next({ message: 'Failed to load User ' + id, status: 404 });
        req.user = userObj;
        next();
    }).catch(function(err) {
        next(err);
    });
};

// create a JWT token from payload
var createToken = function (userObj) {
    var payloadObj = {};
    payloadObj.email = userObj.email;
    payloadObj.id = userObj.id;

    return jwt.sign(payloadObj, config.sessionSecret, { expiresIn: config.JWTExpires });
};

var cleanUsersData = function (usersArr) {
  return _.map(usersArr, function(ul) {
    return cleanUserData(ul);
  });
};

var cleanUserData = function (userObj) {
  var cleanedUser = _.merge({},userObj);

  delete cleanedUser.hashed_password;
  delete cleanedUser.salt;

  return cleanedUser;
};
