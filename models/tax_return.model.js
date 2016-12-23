/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var TaxReturn = {
    findById: function(taxReturnId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No messageId specified!'));
        }
        var taxReturnSql = 'SELECT tax_returns.*, status.name as status_name,status.display_text as status_display_text FROM tax_returns JOIN status ON tax_returns.id = status.id WHERE tax_returns.id = ?';
        return db.knex.raw(taxReturnSql, [taxReturnId]).then(function(taxReturnSqlResults) {
            return taxReturnSqlResults[0][0];
        });
    },

    create: function(taxReturnObj) {
        if ((!taxReturnObj.accountId) || (taxReturnObj.accountId.length === 0)) {
            return Promise.reject(new Error('No accountId specified!'));
        }
        if ((!taxReturnObj.productId) || (taxReturnObj.productId.length === 0)) {
            return Promise.reject(new Error('No productId specified!'));
        }
        if ((!taxReturnObj.firstName) || (taxReturnObj.firstName.length === 0)) {
            return Promise.reject(new Error('No firstName specified!'));
        }

        var taxReturnInsertSql = 'INSERT INTO tax_returns (account_id, product_id, first_name) VALUES(?, ?, ?)';
        var taxReturnInsertSqlParams = [
            taxReturnObj.accountId,
            taxReturnObj.productId,
            taxReturnObj.firstName
        ];
        return db.knex.raw(taxReturnInsertSql, taxReturnInsertSqlParams).then(function(taxReturnInsertSqlResults) {
            var taxReturnId = taxReturnInsertSqlResults[0].insertId;
            return Promise.resolve(taxReturnId);
        });
    },

    update: function(id, taxReturnObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }

        return db.knex('tax_returns').update(taxReturnObj).where('id', id);
    },

    checkIdExists: function(id) {
        if (!id) {
            return Promise.resolve(false);
        }
        return this.findById(id).then(function(row) {
            if (row) {
                return true;
            } else {
                return false;
            }
        });
    }
};

module.exports = TaxReturn;