/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var pushService = require('../services/push.notification.service');
var mailService = require('../services/mail.service');
var systemMessageService = require('../services/system.message.service');

var notificationMessage = config.onesignal.notificationMessage;

var NotificationType = {
  WELCOME: 1,
  PASSWORD_RESET: 2,
  QUOTE: 3,
  TAX_RETURN_SUBMITTED: 4,
  CHAT_MESSAGE_FROM_TAXPRO: 5,
  TAX_PRO_ASSIGNED: 6,
  PASSWORD_CHANGED: 7,
  emailTemplates: {
      1: {name: config.email.templates.welcome},
      2: {name: config.email.templates.password_reset},
      3: {name: config.email.templates.quote},
      4: {name: config.email.templates.tax_return_submitted},
      5: {name: config.email.templates.message_from_taxpro},
      6: {name: config.email.templates.taxpro_assigned},
      7: {name: config.email.templates.password_changed}
  }
};


var sendNotification = function(user, notificationType, data) {
    if ((notificationType > 0) || (notificationType <= NotificationType.emailTemplates.length)) {
        var emailTemplate = NotificationType.emailTemplates[notificationType].name;
    } else {
        logger.error('Invalid Notification type = ' + notificationType + ' notifications cannot be sent!');
        return Promise.resolve();
    }

    notificationPromises = [];
    switch(notificationType) {
        case NotificationType.WELCOME:
            var subject = config.email.welcomeSubject;
            var message = config.email.welcomeMessage;
            message = message.replace('{{firstName}}', user.first_name);

            notificationPromises.push(mailService.send(user, emailTemplate, data));
            notificationPromises.push(systemMessageService.create(user, subject, message));
            break;
        case NotificationType.PASSWORD_RESET:
            var message = config.email.passwordResetMessage;
            var overrideUserPreferences = true; // password reset email is sent regardless of user notification settings
            notificationPromises.push(mailService.send(user, emailTemplate, data, overrideUserPreferences));
            notificationPromises.push(pushService.send(user, notificationMessage));
            break;
        case NotificationType.TAX_RETURN_SUBMITTED:
            var subject = config.email.submittedSubject;
            var message = config.email.submittedMessage;

            notificationPromises.push(mailService.send(user, emailTemplate, data));
            break;
        case NotificationType.CHAT_MESSAGE_FROM_TAXPRO:
            notificationPromises.push(mailService.send(user, emailTemplate, data));
            var message = data.message;
            notificationPromises.push(pushService.send(user, notificationMessage));
            break;
        case NotificationType.TAX_PRO_ASSIGNED:
            notificationPromises.push(mailService.send(user, emailTemplate, data));
            break;
        case NotificationType.PASSWORD_CHANGED:
            notificationPromises.push(mailService.send(user, emailTemplate, data));
            break;
        default:
            logger.error('Unknown notification type: ' + notificationType);
    }
    return Promise.all(notificationPromises);
};


module.exports.NotificationType = NotificationType;
module.exports.sendNotification = sendNotification;

