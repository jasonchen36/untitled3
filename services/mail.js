var postageapp = null;
var config = require('../config/config');
var logger = require('../services/logger.service');

if ((process.env.NODE_ENV == 'test') || (process.env.NODE_ENV == 'development')) {
    logger.warn('EMAIL IS DISABLED BY NODE_ENV=%s', process.env.NODE_ENV);
} else {
    postageapp = require('postageapp')(config.postageapp.api_key);
}

exports.send = function(template, recipient, variables, callback) {
    if (postageapp) {
        var onSuccess = function(response, object) {
            if (callback && callback.success) {
                callback.success(response, object);
            }
        };

        var onError = function(response, object) {
            if (callback && callback.error) {
                callback.error(response, object);
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
