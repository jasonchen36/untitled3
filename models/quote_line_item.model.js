/*jslint node: true */

'use strict';

var db = require('../services/db');
var Promise = require('bluebird');

var QuoteLineItem = {

    findById: function(lineItemId) {
        if ((!lineItemId) || (lineItemId.length === 0)) {
            return Promise.reject(new Error('No lineItemId specified!'));
        }
        var lineItemSql = 'SELECT * FROM quotes_line_items WHERE id = ?';
        return db.knex.raw(lineItemSql, [lineItemId]).then(function(documentSqlResults) {
            return documentSqlResults[0][0];
        });
    },

    update: function(id, lineItemObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No lineItemId specified!'));
        }

        return db.knex('quotes_line_items').update(lineItemObj).where('id', id);
    },

    deleteById: function(quoteId, lineItemId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }
        if ((!lineItemId) || (lineItemId.length === 0)) {
            return Promise.reject(new Error('No lineItemId specified!'));
        }

        var lineItemSql = 'DELETE FROM quotes_line_items WHERE id = ? AND quote_id = ?';
        return db.knex.raw(lineItemSql, [lineItemId, quoteId]);
    }

};

module.exports = QuoteLineItem;
