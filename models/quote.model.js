/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var Quote = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var quoteSql = 'SELECT * FROM quote WHERE id = ?';
        return db.knex.raw(quoteSql, [id]).then(function(quoteSqlResults) {
            return(quoteSqlResults[0][0]);
        });
    },

    deleteById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var quoteSql = 'DELETE FROM quote WHERE id = ?';
        return db.knex.raw(quoteSql, [id]);
    },

    create: function(quoteObj) {
        if ((!quoteObj.accountId) || (quoteObj.accountId.length === 0)) {
            return Promise.reject(new Error('No accountId specified!'));
        }
        if ((!quoteObj.productId) || (quoteObj.productId.length === 0)) {
            return Promise.reject(new Error('No productId specified!'));
        }

        var quoteInsertSql = 'INSERT INTO quote (account_id, product_id) VALUES(?, ?)';
        return db.knex.raw(quoteInsertSql, [quoteObj.accountId,quoteObj.productId]).then(function(messageInsertSqlResults) {
            return messageInsertSqlResults[0];
        });
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

module.exports = Quote;
