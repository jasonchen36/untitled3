/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var config = require('../config/config');
var _ = require('underscore');
var userModel = require('../models/user.model');
var messageModel = require('../models/message.model');
var db = require('../services/db');
var logger = require('../services/logger.service');
var mailService = require('../services/mail.service');
var notificationService = require('../services/notification.service');
var mailclient = require('../services/mailclient2'); // just here for initiaL TEST

/*******************************************************************************
ENDPOINT
POST /messages

INPUT BODY:
{
  "from": 2,                    MANDATORY (USER ID)
  "client": 1,                  ADMINS SHOULD SET THIS TO MESSAGE SPECIFIC USERS (USER ID)
                                FOR CUSTOMERS IT DEFAULTS TO CURRENT USER ID
                                THEREFORE, IT DOES NOT NEED TO BE PASSED
  "subject": "test message",    OPTIONAL
  "body": "test message body"   MANDATORY
}

AUTH TOKEN IS REQUIRED

RESPONSE:
200 OK
*******************************************************************************/
exports.create = function (req, res, next) {
    var messageObj = {};
    logger.debug('controller - message instantiated');

    messageObj.from = req.user.id; // logged-in user from authentication, whoever that may be
    messageObj.fromname = req.user.first_name + ' ' + req.user.last_name;
    messageObj.fromRole = req.user.role;

    // if message is from a user, they are the client
    if (req.user.role == 'Customer') {
        messageObj.client = parseInt(req.user.id);
    } else {
        messageObj.client = parseInt(req.body.client); // client is passed in
    }

    messageObj.subject = req.body.subject;
    messageObj.body = req.body.body;
    messageObj.status = 'new';

    // fix me
    if (!messageObj.from || !messageObj.client || !messageObj.body) {
        return res.status(401).send('missing stuff');
    }

    if (!messageObj.subject) {
        messageObj.subject = ''; // optional parameter
    }


    // TODO: if attachment, get it


    // if message OK, save it
    return messageModel.create(messageObj).then(function() {
        if (req.user.role !== 'Customer') { // message from Taxpro or Admin triggers notification
            var variables = {
                name: req.user.first_name,
                message: messageObj.body,
                dashboard_url: config.domain + '/dashboard'
            }

            return userModel.findById(messageObj.client).then(function(targetUserObj) {
                return notificationService.sendNotification(targetUserObj, notificationService.NotificationType.CHAT_MESSAGE_FROM_TAXPRO, variables).then(function() {
                    res.status(200).send('OK');

                    // update the last User activity of the logged in user
                    userModel.updateLastUserActivity(req.user);
                    userModel.clearLastUserActivity(targetUserObj);
                }).catch(function(err) {
                    next(err);
                });
            }).catch(function(err) {
                next(err);
            });
        } else {
            res.status(200).send('OK');

            // update the last User activity of the logged in user
            userModel.updateLastUserActivity(req.user);
        }
    }).catch(function(err) {
        next(err);
    });

};

/*******************************************************************************
ENDPOINT
GET /messages/:client

INPUT BODY:
NONE - ONLY AUTH TOKEN IS REQUIRED

RESPONSE:
200 OK
*******************************************************************************/
exports.getMessageListForUser = function (req, res, next) {

    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    //TODO:  if user is admin or rep, return lists for their clients

    var client = req.user.id; // user comes from authentication

    if (req.user.role != 'Customer') { // Admins must specify client
        if (!req.params.client) {
            return res.status(409).send('no client parameter in request!');
        }
        client = req.params.client;

    } else {
        if (req.params.client) { // Non admin user specified a client id param - illegal
            return res.status(401).send(); // not authorized
        }
    }

    return messageModel.findAllById(client).then(function(messagesArr) {
        if (!messagesArr) {
            return res.status(404).send();
        }

        var out = { "messages": messagesArr };
        return res.status(200).send(out);
    }).catch(function(err) {
        next(err);
    });

};

/*******************************************************************************
ENDPOINT
GET /messages/:id

INPUT BODY:
NONE - ONLY AUTH TOKEN IS REQUIRED

RESPONSE:
{
  "id": 7,
  "status": "new",
  "body": "admin test message body",
  "subject": "admin test message",
  "client_id": 57,
  "fromname": "test_admin test_admin",
  "from_id": 1,
  "date": "2016-11-28T18:25:52.000Z"
}

200 OK
*******************************************************************************/
exports.read = function (req, res, next) {

    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    var id = req.params.id;
    var client = req.user.id; // user comes from authentication

    //TODO: if user is admin, ensure that message is associated with one of their clients

    var isAdmin = false;
    if (req.user.role === 'Admin') { // Admins can read any users messages
        isAdmin = true;
    } else {
        isAdmin = false;
    }
    return messageModel.findOneById(id, client, isAdmin).then(function(messageObj) {
        if (!messageObj) {
            return res.status(404).send();
        }
        return res.status(200).send(messageObj);
    }).catch(function(err) {
        next(err);
    });
};

// just here for initiaL TEST; may end up in separate cron or triggered process
exports.emailtest = function (req, res, next) {
    logger.debug('controller emailtest function');
    var whatsit = mailclient.emailTest();
    return res.status(200).send('emailtest done');
};

exports.markRead = function(req, res, next) {
    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    var id = req.params.id;
    var client = req.user.id; // user comes from authentication
    return messageModel.setReadStatusById(id, client).then(function() {
        return res.status(200).send();
    }).catch(function(err) {
        next(err);
    });
};

exports.markAllRead = function(req, res, next) {
    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    var client = req.user.id; // user comes from authentication
    return messageModel.setAllReadStatusByUserId(client).then(function() {
        return res.status(200).send();
    }).catch(function(err) {
        next(err);
    });
};

/*******************************************************************************
 ENDPOINT
 POST /messages/emailMessage

 INPUT BODY:
 {
       "from_id": 30,
       "client_id": 438,
       "message": "This is my testing message."
 }

 AUTH TOKEN IS REQUIRED

 200 OK
 *******************************************************************************/

exports.emailMessage = function(req, res, next){
    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    if (!req.body.from_id) {
        res.status(409).send('no from_id in message!');
    }

    if (!req.body.client_id) {
        res.status(409).send('no client_id in message!');
    }

    if (!req.body.message) {
        res.status(409).send('no message!');
    }

    var sender = req.body.from_id;
    var receiver = req.body.client_id;

    if(sender === receiver){
        res.status(409).send('cannot send message to yourself!');
    }

    userModel.findById(sender).then(function(taxPro){
        userModel.findById(receiver).then(function(user){
            var variables = {
                name: user.first_name,
                email: user.email,
                taxpro_first_name: taxPro.first_name,
                taxpro_last_name: taxPro.last_name,
                message: req.body.message

            };

            mailService.send(user, config.email.templates.message_from_taxpro, config.email.admin, variables);
            res.status(200).send();
        });
    }).catch(function(err) {
        next(err);
    });
};

/*******************************************************************************
 ENDPOINT
 POST /messages/taxProAssigned

 INPUT BODY:
 {
       "taxpro_id": 30,
       "client_id": 438,
       "message": "This is my testing message."
 }

 AUTH TOKEN IS REQUIRED

 200 OK
 *******************************************************************************/

exports.taxproAssignedMessage = function(req, res, next){
    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    if (!req.body.taxpro_id) {
        res.status(409).send('no taxpro_id in message!');
    }

    if (!req.body.client_id) {
        res.status(409).send('no client_id in message!');
    }

    if (!req.body.message) {
        res.status(409).send('no message!');
    }

    var sender = req.body.taxpro_id;
    var receiver = req.body.client_id;

    userModel.findById(sender).then(function(taxPro) {
        userModel.findById(receiver).then(function(user){
            var variables = {
                name: user.first_name,
                email: user.email,
                taxpro_first_name: taxPro.first_name,
                taxpro_last_name: taxPro.last_name,
                message: req.body.message

            };

            mailService.send(user, config.email.templates.taxpro_assigned, config.email.admin, variables);
            res.status(200).send();
        });
    }).catch(function(err) {
        next(err);
    });
};
