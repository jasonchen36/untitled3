/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');
var userModel = require('./user.model');
var logger = require('../services/logger.service');
var cacheService = require('../services/cache.service');

var AdminQuoteLineItem = {
    hasAccess: function(userObj, quoteId) { // ADMINS/TAXPROS ONLY
        if ((!userObj) || (userObj.length === 0)) return false;
        if ((!quoteId) || (quoteId.length === 0)) return false;

        var quoteSql = 'SELECT * FROM quote WHERE id = ?';
        return db.knex.raw(quoteSql, [quoteId]).then(function(quoteSqlResults) {
            var quote = quoteSqlResults[0][0];
            if (!quote) {
                logger.error('ACCESS DENIED: quoteId: ' + quoteId + ' does not exist. This users accountId: ' + userObj.account_id + ', userId: ' + userObj.id);
                return false;
            }
            if ((userModel.isAdmin(userObj)) ||
                (userModel.isTaxpro(userObj))) {
                logger.debug('userId: ' + userObj.id + ' granted ADMIN access to quoteId: ' + quoteId);
                return true;
            } else {
                logger.error('ADMIN ACCESS DENIED: quoteId: ' + quoteId + ' belongs to accountId: ' + quote.account_id + ' not this users accountId: ' + userObj.account_id + ', userId: ' + userObj.id);
                return false;
            }
        });
    },

    findById: function(lineItemId) {
        if ((!lineItemId) || (lineItemId.length === 0)) {
            return Promise.reject(new Error('No lineItemId specified!'));
        }
        var lineItemSql = 'SELECT * FROM admin_quotes_line_items WHERE id = ?';
        return db.knex.raw(lineItemSql, [lineItemId]).then(function(lineItemSqlResults) {
            return lineItemSqlResults[0][0];
        });
    },

    create: function(adminQuoteLineItemObj) {
        if ((!adminQuoteLineItemObj.quoteId) || (adminQuoteLineItemObj.quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }
        if ((adminQuoteLineItemObj.taxReturnId) && (adminQuoteLineItemObj.taxReturnId.length === 0)) {
            return Promise.reject(new Error('No taxReturnId specified!'));
        }
        if ((!adminQuoteLineItemObj.text) || (adminQuoteLineItemObj.text.length === 0)) {
            return Promise.reject(new Error('No text specified!'));
        }
        if ((!adminQuoteLineItemObj.value) || (adminQuoteLineItemObj.value.length === 0)) {
            return Promise.reject(new Error('No value specified!'));
        }

        var fieldnames = 'quote_id, text, value';
        var params = '?, ?, ?';
        if ((adminQuoteLineItemObj.notes) && (adminQuoteLineItemObj.notes.length !== 0)) {
            fieldnames = fieldnames + ', notes';
            params = params + ', ?';
        }

        if ((adminQuoteLineItemObj.taxReturnId) && (adminQuoteLineItemObj.taxReturnId.length !== 0)) {
            fieldnames = fieldnames + ', tax_return_id';
            params = params + ', ?';
        }

        var adminQuoteLineItemInsertSql = 'INSERT INTO admin_quotes_line_items (' + fieldnames + ') VALUES(' + params + ')';
        var adminQuoteLineItemISqlParams = [
            adminQuoteLineItemObj.quoteId,
            adminQuoteLineItemObj.text,
            adminQuoteLineItemObj.value
        ];

        if ((adminQuoteLineItemObj.notes) && (adminQuoteLineItemObj.notes.length !== 0)) {
            adminQuoteLineItemISqlParams.push(adminQuoteLineItemObj.notes);
        }

        if ((adminQuoteLineItemObj.taxReturnId) && (adminQuoteLineItemObj.taxReturnId.length !== 0)) {
            adminQuoteLineItemISqlParams.push(adminQuoteLineItemObj.taxReturnId);
        }

        return db.knex.raw(adminQuoteLineItemInsertSql, adminQuoteLineItemISqlParams).then(function(adminQuoteLineItemInsertSqlResults) {
            var adminQuoteLineItemId = adminQuoteLineItemInsertSqlResults[0].insertId;
            return Promise.resolve(adminQuoteLineItemId);
        });
    },

    update: function(id, lineItemObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No lineItemId specified!'));
        }

        return db.knex('admin_quotes_line_items').update(lineItemObj).where('id', id);
    },

    deleteById: function(quoteId, lineItemId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }
        if ((!lineItemId) || (lineItemId.length === 0)) {
            return Promise.reject(new Error('No lineItemId specified!'));
        }

        var lineItemSql = 'DELETE FROM admin_quotes_line_items WHERE id = ? AND quote_id = ?';
        return db.knex.raw(lineItemSql, [lineItemId, quoteId]);
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

module.exports = AdminQuoteLineItem;
