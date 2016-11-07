/*jslint node: true */

'use strict';

// message controller

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Account = mongoose.model('Account');
var User = mongoose.model('User');
var Message = mongoose.model('Message');

// boilerplate
var _ = require('underscore');
var config = require('../config/config');
var mkdirp = require('mkdirp');
var fs = require('fs');
var mv = require('mv');
//var stripe = require("stripe")(config.strip.secret);
var async = require("async");
var mail = require('../services/mail');
var mailclient = require('../services/mailclient2'); // just here for initiaL TEST
var jwt = require('jsonwebtoken');


exports.create = function (req, res) {
    
    var message = new Message();
    console.log('controller - message instantiated');
    
    message.from = req.user._id; // logged-in user from authentication, whoever that may be
    message.fromname = req.user.first_name + ' ' + req.user.last_name;
    
    // if message is from a user, they are the client
    if (req.user.role == 'Customer') {
        message.client = req.user._id;
    } else {
        message.client = req.body.client; // client is passed in
    }
    
    message.subject = req.body.subject;
    message.body = req.body.body;
    message.status = 'new';
    // date comes from module default
    
    // fix me
    if (!message.from || !message.client || !message.subject || !message.body) {
        res.send(401, "missing stuff");
        return;
    }
    
    
    // TODO: if attachment, get it
    
    
    // if message OK, save it
    message.save(function (err, message, numAffected) {
        if (err) {
            res.send(409, 'Unable to save message: ' + err.message);
        } else {
            //res.json(newMessage); //
            res.send(201, "...saved");
        }
    });
    
};

exports.getMessageListForUser = function (req, res) {
    
    if (!req.user) {
        res.send(409, "no user in request!");
    }
    
    //TODO:  if user is admin or rep, return lists for their clients
    
    var client = req.user._id; // user comes from authentication
    
    if (req.user.role != 'Customer') {
        client = req.params.client;
    }
    
    Message.find({ client: client }).exec(function (err, messages) {
        if (err) {
            res.send(409, new Error(err.toString()));
            return;
        }
        
        if (!messages) {
            res.send(404);
            return;
        }
        
        var out = { "messages": messages };
        res.send(200, out);
    });
    
};

exports.read = function (req, res) {
    
    if (!req.user) {
        res.send(409, "no user in request!");
    }
    
    var id = req.params.id;
    var client = req.user._id; // user comes from authentication
    
    //TODO: if user is admin, ensure that message is associated with one of their clients
    
    Message.findOne({ _id: id, client: client }).exec(function (err, message) {
        if (err) {
            res.send(409, new Error(err.toString()));
            return;
        }
        
        if (!message) {
            res.send(404);
            return;
        }
        
        // TODO: change status of message
        
        res.send(200, message);
    });
};

// just here for initiaL TEST; may end up in separate cron or triggered process
exports.emailtest = function (req, res) {
    console.log('controller emailtest function');
    var whatsit = mailclient.emailTest();
    res.send(200, "emailtest done");
};


