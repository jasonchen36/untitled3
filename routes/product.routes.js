/*jslint node: true */

'use strict';

var productController = require('../controllers/product.controller');
var noCache = require('connect-nocache')();

module.exports = function(router) {
    router.route('/product/current')
        .get(noCache, productController.getCurrentProduct);
};