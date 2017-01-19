/*jslint node: true */

var config = require('../config/config');
var logger = require('../services/logger.service');
var onesignal = require('../services/push.notification.service');

var user = {id: 123, account_id: 433};
onesignal.send(user, 'Hello from TAXplan API!');