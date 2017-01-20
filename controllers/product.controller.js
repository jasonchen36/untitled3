/*jslint node: true */

'use strict';

var config = require('../config/config');
var Product = require('../models/product.model');

exports.getCurrentProduct = function(req, res) {
    if (config.api.currentProductId) {
        return Product.findById(config.api.currentProductId)
        .then(function(result) {
            return res.status(200).send(result);
        });
    } else {
        logger.error('Configuration error: config.api.currentProductId not set');
        return res.status(500).send('Internal Server Error');
    }
};
