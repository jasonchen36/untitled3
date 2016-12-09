var postageapp = null;
var config = require('../config/config');
var logger = require('../services/logger.service');

if (config.email.enabled === 'false') {
    logger.warn('EMAIL IS DISABLED BY config.emails.enabled=false');
} else {
    logger.info('postageapp API KEY: ' + config.postageapp.api_key);
    postageapp = require('postageapp')(config.postageapp.api_key);
}

var defaultCallback = {
    success: function(response, object) {
        logger.info('Send Mail Success HTTP: ' + response.statusCode + ' Message UID: ' + object.response.uid);
    },
    error: function(response, object) {
        logger.error('Send Mail Error HTTP: ' + response.statusCode);
    }
};

exports.send = function(template, recipient, variables, optionalCallback) {
    if (postageapp) {
        if (typeof(optionalCallback) === 'undefined') {
            optionalCallback = defaultCallback;
        }
        var onSuccess = function(response, object) {
            if (optionalCallback && optionalCallback.success) {
                optionalCallback.success(response, object);
            }
        };

        var onError = function(response, object) {
            if (optionalCallback && optionalCallback.error) {
                optionalCallback.error(response, object);
            }
        };

        var options = {
            recipients: recipient,
            template: template
        };
        if (variables) {
            options.variables = variables;
        }
        postageapp.sendMessage(options, onSuccess, onError);
    }
};

