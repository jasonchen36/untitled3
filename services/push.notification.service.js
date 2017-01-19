/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var Account = require('../models/account.model');

exports.send = function(user, message) {
    var accountId = user.account_id;
    return Account.findById(accountId).then(function(account) {
        if (account.pushNotifications === 'Yes') {
            internalSend(user, message);
        } else {
            logger.error('push.notification.service: push notifications disabled by user preferences.');
            return Promise.resolve();
        }
    });
};

function internalSend(user, message) {
    var ONESIGNAL_REST_API_KEY = config.onesignal.restApiKey;
    var ONESIGNAL_APP_ID = config.onesignal.appId;
    var userId = user.id;

    return request(
        {
            method: 'POST',
            uri: 'https://onesignal.com/api/v1/notifications',
            headers: {
                'Authorization': 'Basic ' + ONESIGNAL_REST_API_KEY,
                'Content-Type': 'application/json'
            },
            json: true,
            body: {
                'app_id': ONESIGNAL_APP_ID,
                'contents': {en: message},
                filters: [{"field": "tag", "key": "user_id", "value": userId}],
                ios_badgeType: 'Increase'
            }
        },
        function(error, response, body) {
            if (!body.errors) {
                logger.debug(body);
            } else {
                logger.error('push.notification.service Error: ' + body.errors);
            }
            return Promise.resolve();
        }
    );
};

