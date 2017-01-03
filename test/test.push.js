/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var onesignal = require('../services/push.notification.service');

onesignal.sendPushNotification('All Users', 'Hello from TAXplan API!');