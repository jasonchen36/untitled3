/*jslint node: true */

'use strict';

var db = require('../services/db');

var Account = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject('No id specified!');
        }

        var accountSql = 'SELECT * FROM accounts WHERE id = ?';
        return db.knex.raw(accountSql, [id]).then(function(accountSqlResults) {
            return(accountSqlResults[0]);
        });
    },

    create: function(accountObj) {
        if ((!accountObj.name) || (accountObj.name.length === 0)) {
            return Promise.reject('No name specified!');
        }

        var accountInsertSql = 'INSERT INTO accounts (name) VALUES(?)';

        return db.knex.raw(accountInsertSql, [accountObj.name]).then(function(messageInsertSqlResults) {
            return messageInsertSqlResults[0];
        });
    }
};

module.exports = Account;