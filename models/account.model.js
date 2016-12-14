/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');

var Account = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var accountSql = 'SELECT * FROM accounts WHERE id = ?';
        return db.knex.raw(accountSql, [id]).then(function(accountSqlResults) {
            var accountId = accountSqlResults[0][0].id;
            var name = accountSqlResults[0][0].name;
            var resultObj = {};
            resultObj.id = accountId;
            resultObj.name = name;

            var taxReturnsSql = 'SELECT * FROM tax_returns WHERE account_id = ?';
            return db.knex.raw(taxReturnsSql, [accountId]).then(function(taxReturnSqlResults) {
                var taxReturnsArr = taxReturnSqlResults[0];
                resultObj.taxReturns = [];
                _.forEach(taxReturnsArr, function(taxReturn) {
                    resultObj.taxReturns.push(taxReturn);
                });

                var quoteSql = 'SELECT * FROM quote WHERE account_id = ?';
                return db.knex.raw(quoteSql, [id]).then(function(quoteSqlResults) {
                    var quotesArr = quoteSqlResults[0];
                    resultObj.quotes = [];
                    _.forEach(quotesArr, function(quote) {
                        resultObj.quotes.push(quote);
                    });

                    return resultObj;
                });
            });
        });
    },

    create: function(accountObj) {
        if ((!accountObj.name) || (accountObj.name.length === 0)) {
            return Promise.reject(new Error('No name specified!'));
        }

        var accountInsertSql = 'INSERT INTO accounts (name) VALUES(?)';

        return db.knex.raw(accountInsertSql, [accountObj.name]).then(function(messageInsertSqlResults) {
            return messageInsertSqlResults[0].insertId;
        });
    }
};

module.exports = Account;
