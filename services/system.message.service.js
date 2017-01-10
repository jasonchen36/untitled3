/*jslint node: true */

'use strict';

/**
 * Module dependencies.
 */
var _ = require('underscore');
var config = require('../config/config');
var logger = require('../services/logger.service');
var Message = require('../models/message.model');


exports.create = function (toUserId, subject, body) {
    var message = {};
    message.from = 0; // user_id = 0 is 'System'
    message.fromname = 'TAXplan System';
    message.fromRole = 'System';
    message.client = toUserId;
    message.subject = subject;
    message.body = body;
    message.status = 'new';

    if (!message.subject || !message.client || !message.body) {
        var err = 'system.message.service: missing stuff';
        return Promise.reject(err);
    }
    return Message.create(message);
};
