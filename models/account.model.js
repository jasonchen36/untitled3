/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');

const taxReturnModel = require('./tax_return.model');

var Account = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var accountSql = 'SELECT * FROM accounts WHERE id = ?';
        return db.knex.raw(accountSql, [id]).then(function(accountSqlResults) {
            if ((accountSqlResults[0]) && (accountSqlResults[0].length > 0)) {
                var accountId = accountSqlResults[0][0].id;
                var name = accountSqlResults[0][0].name;
                var pushNotifications = accountSqlResults[0][0].push_notifications;
                var emailNotifications = accountSqlResults[0][0].email_notifications;
            } else {
                return Promise.resolve();
            }
            var resultObj = {};
            resultObj.id = accountId;
            resultObj.name = name;
            resultObj.pushNotifications = pushNotifications;
            resultObj.emailNotifications = emailNotifications;

            var taxReturnsSql = 'SELECT tax_returns.*, status.name as status_name,status.display_text as status_display_text FROM tax_returns JOIN status ON tax_returns.status_id = status.id WHERE tax_returns.account_id = ?';
            return db.knex.raw(taxReturnsSql, [accountId]).then(function(taxReturnSqlResults) {
                var taxReturnsArr = taxReturnSqlResults[0];
                resultObj.taxReturns = [];
                _.forEach(taxReturnsArr, function(taxReturn) {
                    resultObj.taxReturns.push(taxReturnModel.formatData(taxReturn));
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
       var accountInsertSql = '';
       var accountInsertSqlParams = [];

       if (accountObj.taxProId) {
           accountInsertSql = 'INSERT INTO accounts (name, taxpro_id) VALUES(?, ?)';
           accountInsertSqlParams = [accountObj.name, accountObj.taxProId];
       } else {
           accountInsertSql = 'INSERT INTO accounts (name) VALUES(?)';
           accountInsertSqlParams = [accountObj.name];
       }
       return db.knex.raw(accountInsertSql, accountInsertSqlParams).then(function(messageInsertSqlResults) {
           return messageInsertSqlResults[0].insertId;
       });
    },

    updateById: function(accountId, accountObj) {
        if ((!accountId) || (accountId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        return db.knex('accounts').update(accountObj).where('id', accountId);
    }
};

module.exports = Account;
