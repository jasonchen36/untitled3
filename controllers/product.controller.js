/*jslint node: true */

'use strict';

var config = require('../config/config');
var productModel = require('../models/product.model');

exports.getCurrentProduct = function(req, res, next) {
    if (config.api.currentProductId) {
        return productModel.findById(config.api.currentProductId)
        .then(function(resultObj) {
            return res.status(200).send(resultObj);
        });
    } else {
        logger.error('Configuration error: config.api.currentProductId not set');
        return res.status(500).send('Internal Server Error');
    }
};
