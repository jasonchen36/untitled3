/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var db = require('../services/db');
var logger = require('../services/logger.service');
var User = require('../models/user.model');
var Message = require('../models/message.model');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');
var async = require("async");
var mail = require('../services/mail');
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
exports.create = function (req, res) {
    var message = {};
    logger.debug('controller - message instantiated');

    message.from = req.user.id; // logged-in user from authentication, whoever that may be
    message.fromname = req.user.first_name + ' ' + req.user.last_name;

    // if message is from a user, they are the client
    if (req.user.role == 'Customer') {
        message.client = parseInt(req.user.id);
    } else {
        message.client = parseInt(req.body.client); // client is passed in
    }

    message.subject = req.body.subject;
    message.body = req.body.body;
    message.status = 'new';
//    message.datetime = new Date();

    // fix me
    if (!message.from || !message.client || !message.body) {
        res.status(401).send('missing stuff');
        return;
    }

    if (!message.subject) {
        message.subject = ''; // optional parameter
    }


    // TODO: if attachment, get it


    // if message OK, save it
    Message.create(message).then(function() {
      res.status(200).send('OK');
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
exports.getMessageListForUser = function (req, res) {

    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    //TODO:  if user is admin or rep, return lists for their clients

    var client = req.user.id; // user comes from authentication

    if (req.user.role != 'Customer') { // Admins must specify client to message
        if (!req.params.client) {
            res.status(409).send('no client parameter in request!');
        }
        client = req.params.client;
    }

    Message.findAllById(client).then(function(messages) {
        if (!messages) {
            res.status(404).send();
            return;
        }

        var out = { "messages": messages };
        res.status(200).send(out);
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
exports.read = function (req, res) {

    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    var id = req.params.id;
    var client = req.user.id; // user comes from authentication

    //TODO: if user is admin, ensure that message is associated with one of their clients

    var isAdmin = false;
    if (req.user.role === 'Admin') { // Admins can read any users messages
        isAdmin = true
    } else {
        isAdmin = false;
    }
    Message.findOneById(id, client, isAdmin).then(function(message) {
        if (!message) {
            res.status(404).send();
            return;
        }

        // change status of message if this user is intended recipient
        // i.e. admins can read messages for others without updating status
        if ((!isAdmin) && (message.status === 'new') && (client === req.user.id)) {
            Message.setReadStatusById(id).then(function() {
                res.status(200).send(message);
            });
        } else {
            if ((isAdmin) && (message.status === 'new') && (req.user.id === message.client_id)) {
                Message.setReadStatusById(id).then(function() {
                    res.status(200).send(message);
                });
            } else {
                res.status(200).send(message);
            }
        }
    });
};

// just here for initiaL TEST; may end up in separate cron or triggered process
exports.emailtest = function (req, res) {
    console.log('controller emailtest function');
    var whatsit = mailclient.emailTest();
    res.status(200).send('emailtest done');
};
