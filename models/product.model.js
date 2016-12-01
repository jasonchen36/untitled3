/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Product = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var productSql = 'SELECT * FROM products WHERE id = ?';
        return db.knex.raw(productSql, [id]).then(function(productSqlResults) {
            return(productSqlResults[0][0]);
        });
    }
};

module.exports = Product;
