/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var request = 	require('request');

var sendPushNotification = function(device, message) {
    var ONESIGNAL_REST_API_KEY = config.onesignal.restApiKey;
    var ONESIGNAL_APP_ID = config.onesignal.appId;
    request(
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
                filters: [{"field": "tag", "key": "user_id", "value": "123"}]
            }
        },
        function(error, response, body) {
            if (!body.errors) {
                logger.debug(body);
            } else {
                logger.error('Error: ', body.errors);
            }
        }
    );
};


module.exports.sendPushNotification = sendPushNotification;

