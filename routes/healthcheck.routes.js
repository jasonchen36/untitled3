/*jslint node: true */

'use strict';

var healthcheckController = require('../controllers/healthcheck.controller');

module.exports = function(router) {
    router.route('/healthcheck')
        .get(healthcheckController.checkhealth);
};