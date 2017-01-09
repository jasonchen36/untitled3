/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var TaxReturn = {
    findById: function(taxReturnId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No messageId specified!'));
        }
        var taxReturnSql = 'SELECT tax_returns.*, status.name as status_name,status.display_text as status_display_text FROM tax_returns JOIN status ON tax_returns.status_id = status.id WHERE tax_returns.id = ? LIMIT 1';
        return db.knex.raw(taxReturnSql, [taxReturnId]).then(function(taxReturnSqlResults) {
            var data = _.map(taxReturnSqlResults[0], function(entry){
                return TaxReturn.formatData(entry);
            });
            return data[0];
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
        if ((!taxReturnObj.filerType) || (taxReturnObj.filerType.length === 0)) {
          return Promise.reject(new Error('No  filerType specified!'));
        }
        var taxReturnInsertSql = 'INSERT INTO tax_returns (account_id, product_id, first_name, filer_type) VALUES(?, ?, ?, ?)';
        var taxReturnInsertSqlParams = [
            taxReturnObj.accountId,
            taxReturnObj.productId,
            taxReturnObj.firstName,
            taxReturnObj.filerType
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

    setAllsubmittedForAccountId: function(accountId, productId) {
        if ((!accountId) || (accountId.length === 0)) {
            return Promise.reject(new Error('No accountId specified!'));
        }
        var updateStatusSql = 'UPDATE tax_returns SET status_id = 5 WHERE account_id = ? AND product_id = ?';
        return db.knex.raw(updateStatusSql, [accountId, productId]).then(function(updateStatusSqlResults) {
            var affectedRows = updateStatusSqlResults[0].affectedRows;
            return Promise.resolve(affectedRows);
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
    },

    formatData: function(data){
        return {
            id: data.id,
            product_id: data.product_id,
            account_id: data.account_id,
            first_name: data.first_name,
            last_name: data.last_name,
            province_of_residence: data.province_of_residence,
            date_of_birth: data.date_of_birth,
            canadian_citizen: data.canadian_citizen,
            authorize_cra: data.authorize_cra,
            status: {
                id: data.status_id,
                name: data.status_name,
                display_text: data.status_display_text
            },
            created_at: data.created_at,
            updated_at: data.updated_at,
            filer_type: data.filer_type
        }
    }
};

module.exports = TaxReturn;
