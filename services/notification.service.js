/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var pushService = require('../services/push.notification.service');
var mailService = require('../services/mail.service');
var systemMessageService = require('../services/system.message.service');

var NotificationType = {
  WELCOME: 1,
  PASSWORD_RESET: 2,
  QUOTE: 3,
  TAX_RETURN_SUBMITTED: 4,
  emailTemplates: {
      1: {name: config.email.templates.welcome},
      2: {name: config.email.templates.password_reset},
      3: {name: config.email.templates.quote},
      4: {name: config.email.templates.tax_return_submitted}
  }
};


var sendNotification = function( user, notificationType, data) {
    var emailTemplate = NotificationType.emailTemplates[notificationType].name;

    notificationPromises = [];
    switch(notificationType) {
        case NotificationType.WELCOME:
            var subject = config.email.welcomeSubject;
            var message = config.email.welcomeMessage;

            notificationPromises.push(mailService.send(user, emailTemplate, data));
            notificationPromises.push(pushService.send(user, message));
            notificationPromises.push(systemMessageService.create(user.id, subject, message));
            break;
        case NotificationType.PASSWORD_RESET:
            var message = config.email.passwordResetMessage;
            notificationPromises.push(mailService.send(user, emailTemplate, data));
            notificationPromises.push(pushService.send(user, message));
            break;
        case NotificationType.TAX_RETURN_SUBMITTED:
            var subject = config.email.submittedSubject;
            var message = config.email.submittedMessage;
            var deviceId = user.id;

            return mailService.send(user, emailTemplate, data);
            notificationPromises.push(pushService.send(user, message));
            notificationPromises.push(systemMessageService.create(user.id, subject, config.email.submittedMessage));
            break;
        default:
            logger.error('Unknown notification type: ' + notificationType);
    }
    return Promise.all(notificationPromises);
};


module.exports.NotificationType = NotificationType;
module.exports.sendNotification = sendNotification;

