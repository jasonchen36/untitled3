/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var dependant = {
    findById: function(dependantId) {
        if ((!dependantId) || (dependantId.length === 0)) {
            return Promise.reject(new Error('No messageId specified!'));
        }
        var dependantSql = 'SELECT * FROM dependants WHERE id = ?';
        return db.knex.raw(dependantSql, [dependantId]).then(function(dependantSqlResults) {
            return dependantSqlResults[0][0];
        });
    },

    create: function(dependantObj) {
        if ((!dependantObj.accountId) || (dependantObj.accountId.length === 0)) {
            return Promise.reject(new Error('No accountId specified!'));
        }
        if ((!dependantObj.productId) || (dependantObj.productId.length === 0)) {
            return Promise.reject(new Error('No productId specified!'));
        }
        if ((!dependantObj.firstName) || (dependantObj.firstName.length === 0)) {
            return Promise.reject(new Error('No firstName specified!'));
        }

        var dependantInsertSql = 'INSERT INTO dependants (account_id, product_id, first_name) VALUES(?, ?, ?)';
        var dependantInsertSqlParams = [
            dependantObj.accountId,
            dependantObj.productId,
            dependantObj.firstName
        ];
        return db.knex.raw(dependantInsertSql, dependantInsertSqlParams).then(function(dependantInsertSqlResults) {
            var dependantId = dependantInsertSqlResults[0].insertId;
            return Promise.resolve(dependantId);
        });
    },

    update: function(id, dependantObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No dependantId specified!'));
        }

        return db.knex('dependants').update(dependantObj).where('id', id);
    }
};

module.exports = dependant;
