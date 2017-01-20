/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var onesignal = require('../services/push.notification.service');

console.log(config.onesignal.appId);

var user = {"id": 40, "account_id": 413}
onesignal.send(user, 'Hello from TAXplan API!');