var postageapp = null;
var config = require('../config/config');
var logger = require('../services/logger.service');
var Promise = require('bluebird');
var Account = require('../models/account.model');

if (config.email.enabled === 'false') {
    logger.warn('EMAIL IS DISABLED BY config.emails.enabled=false');
} else {
    logger.info('postageapp API KEY: ' + config.postageapp.api_key);
    PostageApp = require('postageapp');
    var postageapp = new PostageApp(config.postageapp.api_key);
}

exports.send = function(user, template, variables, overrideUserPreferences=false) {
    if (!PostageApp) {
        logger.warn('mail.service: emails disabled by API config.');
        return Promise.resolve();
    }
    var accountId = user.account_id;
    return Account.findById(accountId).then(function(account) {
        if ((account.emailNotifications === 'Yes') || (overrideUserPreferences)) {
            internalSend(user, template, variables);
        } else {
            logger.error('mail.service: email notifications disabled by user preferences.');
            return Promise.resolve();
        }
    });
};


var internalSend = function(user, template, variables) {
    var recipient = user.email;

    if (postageapp) {
        var options = {
            recipients: recipient,
            template: template
        };
        if (variables) {
            options.variables = variables;
        }

        return postageapp.sendMessage(options).then(function(response) {
            var msg = 'Send Mail Success status=' + response.message.status + ', Message UID: ' +
                      response.message.uid + ' URL: ' + response.message.url;
            logger.info(msg);
        }).catch(function(error) {
            logger.error(error);
        });
    }
};

