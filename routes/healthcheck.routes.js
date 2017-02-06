/*jslint node: true */

'use strict';

var healthcheckController = require('../controllers/healthcheck.controller');
var noCache = require('connect-nocache')();

module.exports = function(router) {
    router.route('/healthcheck')
        .get(noCache, healthcheckController.checkhealth);
};