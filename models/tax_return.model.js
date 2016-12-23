/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var TaxReturn = {
    findById: function(taxReturnId) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No messageId specified!'));
        }
        var taxReturnSql = 'SELECT tax_returns.*, status.name as status_name,status.display_text as status_display_text FROM tax_returns JOIN status ON tax_returns.id = status.id WHERE tax_returns.id = ? LIMIT 1';
        return db.knex.raw(taxReturnSql, [taxReturnId]).then(function(taxReturnSqlResults) {
            var data = _.map(taxReturnSqlResults[0], function(entry){
                return {
                    id: entry.id,
                    product_id: entry.product_id,
                    account_id: entry.account_id,
                    status_id: 1,
                    first_name: entry.first_name,
                    last_name: entry.last_name,
                    province_of_residence: entry.province_of_residence,
                    date_of_birth: entry.date_of_birth,
                    canadian_citizen: entry.canadian_citizen,
                    authorize_cra: entry.authorize_cra,
                    status: {
                        id: entry.status_id,
                        name: entry.status_name,
                        display_text: entry.status_display_text
                    },
                    created_at: entry.created_at,
                    updated_at: entry.updated_at
                }
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