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
    if (!message.from || !message.client || !message.subject || !message.body) {
        res.status(401).send('missing stuff');
        return;
    }


    // TODO: if attachment, get it


    // if message OK, save it
    Message.create(message).then(function() {
      res.status(200).send('OK');
    });

};

exports.getMessageListForUser = function (req, res) {

    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    //TODO:  if user is admin or rep, return lists for their clients

    var client = req.user.id; // user comes from authentication

    if (req.user.role != 'Customer') {
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

exports.read = function (req, res) {

    if (!req.user) {
        res.status(409).send('no user in request!');
    }

    var id = req.params.id;
    var client = req.user.id; // user comes from authentication

    //TODO: if user is admin, ensure that message is associated with one of their clients

    Message.findOneById(id, client).then(function(message) {
        if (!message) {
            res.status(404).send();
            return;
        }

        // TODO: change status of message

        res.status(200).send(message);
    });
};

// just here for initiaL TEST; may end up in separate cron or triggered process
exports.emailtest = function (req, res) {
    console.log('controller emailtest function');
    var whatsit = mailclient.emailTest();
    res.status(200).send('emailtest done');
};
