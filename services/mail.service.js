var postageapp = null;
var config = require('../config/config');
var logger = require('../services/logger.service');
var Promise = require('bluebird');

if (config.email.enabled === 'false') {
    logger.warn('EMAIL IS DISABLED BY config.emails.enabled=false');
} else {
    logger.info('postageapp API KEY: ' + config.postageapp.api_key);
    PostageApp = require('postageapp');
    var postageapp = new PostageApp(config.postageapp.api_key);
}


exports.send = function(user, template, variables) {
    var recipient = user.email;
    var accountId = user.accountId;

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

