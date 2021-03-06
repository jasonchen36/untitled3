/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');
var userModel = require('./user.model');
var logger = require('../services/logger.service');
var cacheService = require('../services/cache.service');

var Quote = {
    hasAccess: function(userObj, quoteId) {
        if ((!userObj) || (userObj.length === 0)) return false;
        if ((!quoteId) || (quoteId.length === 0)) return false;

        var quoteSql = 'SELECT * FROM quote WHERE id = ?';
        return db.knex.raw(quoteSql, [quoteId]).then(function(quoteSqlResults) {
            var quote = quoteSqlResults[0][0];
            if (!quote) {
                logger.error('ACCESS DENIED: quoteId: ' + quoteId + ' does not exist. This users accountId: ' + userObj.account_id + ', userId: ' + userObj.id);
                return false;
            }
            if ((userObj.account_id === quote.account_id) ||
                (userModel.isAdmin(userObj)) ||
                (userModel.isTaxpro(userObj))) {
                logger.debug('userId: ' + userObj.id + ' granted access to quoteId: ' + quoteId);
                return true;
            } else {
                logger.error('ACCESS DENIED: quoteId: ' + quoteId + ' belongs to accountId: ' + quote.account_id + ' not this users accountId: ' + userObj.account_id + ', userId: ' + userObj.id);
                return false;
            }
        });
    },

    findById: function(id, includeDisabledLineitems) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }
        if ((typeof(includeDisabledLineitems) === 'undefined') || (includeDisabledLineitems.length === 0)) {
            includeDisabledLineitems = 1;
        }

        var quoteSql = 'SELECT * FROM quote WHERE id = ?';
        return db.knex.raw(quoteSql, [id]).then(function(quoteSqlResults) {
            var quoteObj = quoteSqlResults[0][0];
            var productId = quoteObj.product_id;
            var accountId = quoteObj.account_id;
            var taxReturnSql = 'SELECT * FROM tax_returns WHERE product_id = ? AND account_id = ?';
            return db.knex.raw(taxReturnSql, [productId, accountId]).then(function(taxReturnSqlResults) {
                quoteObj.taxReturns = taxReturnSqlResults[0] || [];
                var quoteLineItemsSql = 'SELECT * FROM quotes_line_items WHERE quote_id = ?';
                if (includeDisabledLineitems === 0) {
                    quoteLineItemsSql = quoteLineItemsSql + ' AND enabled = 1';
                }
                quoteLineItemsSql = quoteLineItemsSql + ' ORDER BY tax_return_id ASC, value DESC';
                return db.knex.raw(quoteLineItemsSql, [id]).then(function(quoteLineItemsSqlResults) {
                    quoteObj.quoteLineItems = quoteLineItemsSqlResults[0] || [];
                    var adminLineitemsSql = 'SELECT * FROM admin_quotes_line_items WHERE quote_id = ?';
                    return db.knex.raw(adminLineitemsSql, [id]).then(function(adminLineitemsSqlResults) {
                        quoteObj.adminLineitems = adminLineitemsSqlResults[0] || [];
                        var subtotal = 0;
                        var tax = 0;
                        _.forEach(quoteObj.quoteLineItems, function(lineItem) {
                            var taxReturn = _.find(quoteObj.taxReturns, {id: lineItem.tax_return_id});
                            if (lineItem.enabled === 1)  {
                                if (typeof(taxReturn) !== 'undefined') {
                                        tax += lineItem.value * 0.13;
                                }
                                subtotal = subtotal + lineItem.value;
                            }
                        });
                        _.forEach(quoteObj.adminLineitems, function(adminLineItem) {
                            var taxReturn = _.find(quoteObj.taxReturns, {id: adminLineItem.tax_return_id});
                            tax += adminLineItem.value * 0.13;
                            subtotal = subtotal + adminLineItem.value;
                        });
                        quoteObj.subtotal = subtotal.toFixed(2);
                        quoteObj.tax = tax.toFixed(2);
                        quoteObj.total = (tax + subtotal).toFixed(2);
                        return quoteObj;

                    });
                });
            });
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
        if ((!quoteObj.lineItems) || (quoteObj.lineItems.length === 0)) {
            return Promise.reject(new Error('No lineItems specified!'));
        }

        return cacheService.get('depositAmounts', this.getDirectDepositAmounts()).then(function(depositAmountsCache) {
            var directDepositRec = _.find(depositAmountsCache, {product_id: quoteObj.productId});
            if ((!directDepositRec) || (directDepositRec.length === 0)) {
                return Promise.reject(new Error('Failed to get direct deposit amount. Is there missing config?'));
            }
            var directDepositAmount = directDepositRec.amount.toFixed(2);
            return db.knex.transaction(function(trx) {
                // NOTE:
                // If a table contains an AUTO_INCREMENT column and INSERT ... ON DUPLICATE KEY UPDATE
                // inserts or updates a row, the LAST_INSERT_ID() function returns the AUTO_INCREMENT value.
                // LAST_INSERT_ID(expr) on the other hand returns:
                // a) insertId in the case of insert
                // b) the id of the updated row in the case of update
                // @see: http://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html
                //       http://dev.mysql.com/doc/refman/5.7/en/information-functions.html#function_last-insert-id
                var quoteInsertSql = 'INSERT INTO quote \
                                      (account_id, product_id) \
                                      VALUES(?, ?) \
                                      ON DUPLICATE KEY UPDATE \
                                      id=LAST_INSERT_ID(id), account_id = ?, product_id = ?';
                var quoteInsertSqlParams = [quoteObj.accountId,
                                            quoteObj.productId,
                                            quoteObj.accountId,
                                            quoteObj.productId];
                return trx.raw(quoteInsertSql, quoteInsertSqlParams).then(function(messageInsertSqlResults) {
                    var quoteId = messageInsertSqlResults[0].insertId;
                    var lineItemPromises = [];
                    _.forEach(quoteObj.lineItems, function(lineItem) {
                        var taxprepInsertSql = 'INSERT INTO quotes_line_items \
                                                (quote_id, tax_return_id, text, value, notes, enabled) \
                                                VALUES (?, ?, ?, ?, ?, ?) \
                                                ON DUPLICATE KEY UPDATE \
                                                quote_id = ?, tax_return_id = ?, \
                                                text = ?, value = ?, notes = ?, enabled = ?';
                        var taxprepInsertSqlParams = [
                                                      quoteId,
                                                      lineItem.taxReturnId,
                                                      'Tax Prep.',
                                                      lineItem.price,
                                                      lineItem.notes,
                                                      1,
                                                      quoteId,
                                                      lineItem.taxReturnId,
                                                      'Tax Prep.',
                                                      lineItem.price,
                                                      lineItem.notes,
                                                      1
                                                    ];
                        lineItemPromises.push(db.knex.raw(taxprepInsertSql, taxprepInsertSqlParams));

                        var directDepositInsertSql = 'INSERT INTO quotes_line_items \
                                                      (quote_id, tax_return_id, text, value, notes, enabled) \
                                                      VALUES (?, ?, ?, ?, ?, ?) \
                                                      ON DUPLICATE KEY UPDATE \
                                                      quote_id = ?, tax_return_id = ?, \
                                                      text = ?, value = ?, notes = ?, enabled = ?';
                        var directDepositInsertSqlParams = [
                                                            quoteId,
                                                            lineItem.taxReturnId,
                                                            'Direct Deposit',
                                                            directDepositAmount,
                                                            lineItem.notes,
                                                            0,
                                                            quoteId,
                                                            lineItem.taxReturnId,
                                                            'Direct Deposit',
                                                            directDepositAmount,
                                                            lineItem.notes,
                                                            0
                                                          ];
                        lineItemPromises.push(db.knex.raw(directDepositInsertSql, directDepositInsertSqlParams));
                    });
                    return Promise.each(lineItemPromises, function() { // .each to avoid ER_LOCK_DEADLOCK

                    }).then(function() {
                        trx.commit;
                        return quoteId;
                    })
                    .catch(trx.rollback);
                });
            });
        });
    },

    checkIdExists: function(id) {
        if (!id) {
            return Promise.resolve(false);
        }
        var includeDisabledLineitems = 1;
        return this.findById(id, includeDisabledLineitems).then(function(row) {
            if (row) {
                return true;
            } else {
                return false;
            }
        });
    },

    findByProductIdAccountId: function(productId, accountId) {
      if ((!productId) || (productId.length === 0)) {
          return Promise.reject(new Error('No productId specified!'));
      }
      if ((!accountId) || (accountId.length === 0)) {
          return Promise.reject(new Error('No accountId specified!'));
      }
      var accountSql = 'SELECT q.id, \
                               q.account_id, \
                               q.product_id, \
                               q.created_at, \
                               q.updated_at, \
                               a.name \n\
                        FROM quote AS q \
                        JOIN accounts AS a ON a.id = q.account_id AND a.id = ? \
                        WHERE q.product_id = ?' ;
      return db.knex.raw(accountSql, [accountId,productId]).then(function(accountSqlResults) {
          return accountSqlResults[0];
      });
    },

    getEmailFieldsByProductIdAccountId: function(productId, accountId) {
      if ((!productId) || (productId.length === 0)) {
          return Promise.reject(new Error('No productId specified!'));
      }
      if ((!accountId) || (accountId.length === 0)) {
          return Promise.reject(new Error('No accountId specified!'));
      }
      var quoteSql = 'SELECT \
                          q.id, \
                          q.account_id, \
                          q.product_id, \
                          qli.tax_return_id, \
                          qli.text, \
                          qli.value, \
                          qli.enabled \
                        FROM quote AS q \
                        RIGHT JOIN quotes_line_items AS qli ON qli.quote_id = q.id \
                        WHERE q.account_id = ? AND q.product_id = ? \
                        ORDER BY qli.tax_return_id ASC, qli.value DESC';
      return db.knex.raw(quoteSql, [accountId, productId]).then(function(quoteSqlResults) {
          return quoteSqlResults[0];
      });
    },

    populateQuestions: function() {
        var categoriesSql = 'SELECT id FROM categories WHERE name = ?';
        var categoriesSqlParams = ["Quote"];
        return db.knex.raw(categoriesSql, categoriesSqlParams).then(function(categoriesSqlResults) {
            if ((accountSqlResults[0]) && (accountSqlResults[0].length > 0)) {
                var quoteCategoryId = categoriesSqlResults[0][0].id;
            } else {
                return Promise.resolve([]);
            }

            var questionsSql = 'SELECT id, text FROM questions WHERE category_id = ?';
            var questionsSqlParams = [quoteCategoryId];
            return db.knex.raw(questionsSql, questionsSqlParams).then(function(questionsSqlResults) {
               return questionsSqlResults[0];
            });
        });
    },

    getDirectDepositAmounts: function () {
        var directDepositAmountSql = 'SELECT * FROM direct_deposit_amount';
        return db.knex.raw(directDepositAmountSql, []).then(function(directDepositAmountSqlResults) {
            return directDepositAmountSqlResults[0];
        });
    },

    setLineItemEnabled: function (quoteId, lineItemId, enabled) {
        var updateSql = 'UPDATE quotes_line_items SET enabled = ? WHERE quote_id = ? AND id = ?';
        var updateSqlParams = [enabled, quoteId, lineItemId]
        return db.knex.raw(updateSql, updateSqlParams).then(function(updateSqlResults) {
            var affectedRows = updateSqlResults[0].affectedRows;
            return Promise.resolve(affectedRows);
        });
    }

};

module.exports = Quote;
