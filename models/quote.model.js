/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');
var _ = require('lodash');
var userModel = require('./user.model');
var logger = require('../services/logger.service');

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
        if ((!quoteObj.lineItems) || (quoteObj.lineItems.length === 0)) {
            return Promise.reject(new Error('No lineItems specified!'));
        }
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
                    var lineItemInsertSql = 'INSERT INTO quotes_line_items \
                                             (quote_id, tax_return_id, text, value, notes) \
                                             VALUES (?, ?, ?, ?, ?) \
                                             ON DUPLICATE KEY UPDATE \
                                             quote_id = ?, tax_return_id = ?, \
                                             text = ?, value = ?, notes = ?';
                    var lineItemInsertSqlParams = [quoteId,
                                                   lineItem.taxReturnId,
                                                   'Tax Prep.',
                                                   lineItem.price,
                                                   lineItem.notes,
                                                   quoteId,
                                                   lineItem.taxReturnId,
                                                   'Tax Prep.',
                                                   lineItem.price,
                                                   lineItem.notes];
                    lineItemPromises.push(db.knex.raw(lineItemInsertSql, lineItemInsertSqlParams));
                });
                return Promise.all(lineItemPromises)
                .then(function() {
                    trx.commit;
                    return quoteId;
                })
                .catch(trx.rollback);
            });
        });
    },

    createLineItems: function(text, value) {
        if ((!text) || (text.length === 0)) {
            return Promise.reject(new Error('No text specified!'));
        }
        if ((!value) || (value.length === 0)) {
            return Promise.reject(new Error('No value specified!'));
        }
        if ((!quoteObj.lineItems) || (quoteObj.lineItems.length === 0)) {
            return Promise.reject(new Error('No lineItems specified!'));
        }
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
                    var lineItemInsertSql = 'INSERT INTO quotes_line_items \
                                             (quote_id, tax_return_id, text, value, notes) \
                                             VALUES (?, ?, ?, ?, ?) \
                                             ON DUPLICATE KEY UPDATE \
                                             quote_id = ?, tax_return_id = ?, \
                                             text = ?, value = ?, notes = ?';
                    var lineItemInsertSqlParams = [quoteId,
                                                   lineItem.taxReturnId,
                                                   'Tax Prep.',
                                                   lineItem.price,
                                                   lineItem.notes,
                                                   quoteId,
                                                   lineItem.taxReturnId,
                                                   'Tax Prep.',
                                                   lineItem.price,
                                                   lineItem.notes];
                    lineItemPromises.push(db.knex.raw(lineItemInsertSql, lineItemInsertSqlParams));
                });
                return Promise.all(lineItemPromises)
                .then(function() {
                    trx.commit;
                    return quoteId;
                })
                .catch(trx.rollback);
            });
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
                          qli.value \
                        FROM quote AS q \
                        RIGHT JOIN quotes_line_items AS qli ON qli.quote_id = q.id \
                        WHERE q.account_id = ? AND q.product_id = ?';
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
    }

};

module.exports = Quote;
