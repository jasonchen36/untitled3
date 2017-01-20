/*jslint node: true */

'use strict';

var productController = require('../controllers/product.controller');

module.exports = function(router) {
    router.route('/product/current')
        .get(productController.getCurrentProduct);
};