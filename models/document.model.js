/*jslint node: true */

'use strict';

var db = require('../services/db');

var Promise = require('bluebird');

var document = {
    findById: function(documentId) {
        if ((!documentId) || (documentId.length === 0)) {
            return Promise.reject(new Error('No documentId specified!'));
        }
        var documentSql = 'SELECT * FROM documents WHERE id = ?';
        return db.knex.raw(documentSql, [documentId]).then(function(documentSqlResults) {
            return documentSqlResults[0][0];
        });
    },

    create: function(documentObj) {
        if ((!documentObj.quoteId) || (documentObj.quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }
        var checklistItemIdExists = (documentObj.hasOwnProperty('checklistItemId'));
        var checklistItemIdIsZero = (checklistItemIdExists) && (documentObj.checklistItemId === 0);
        var checklistItemIdNotSpecified = (!checklistItemIdExists) || (documentObj.checklistItemId.length === 0);
        if ((!checklistItemIdIsZero) && checklistItemIdNotSpecified) {
            return Promise.reject(new Error('No checklistItemId specified!'));
        }
        if ((!documentObj.name) || (documentObj.name.length === 0)) {
            return Promise.reject(new Error('No name specified!'));
        }
        if ((!documentObj.url) || (documentObj.url.length === 0)) {
            return Promise.reject(new Error('No url specified!'));
        }
        if ((!documentObj.thumbnailUrl) || (documentObj.thumbnailUrl.length === 0)) {
            return Promise.reject(new Error('No thumbnailUrl specified!'));
        }
        var documentInsertSql = '';
        if (documentObj.taxReturnId) {
            documentInsertSql = 'INSERT INTO documents (quote_id, checklist_item_id, name, url, thumbnail_url, tax_return_id) VALUES(?, ?, ?, ?, ?, ?)';
        } else {
            documentInsertSql = 'INSERT INTO documents (quote_id, checklist_item_id, name, url, thumbnail_url) VALUES(?, ?, ?, ?, ?)';
        }
        var documentInsertSqlParams = [
            documentObj.quoteId,
            documentObj.checklistItemId,
            documentObj.name,
            documentObj.url,
            documentObj.thumbnailUrl
        ];
        if (documentObj.taxReturnId) {
            documentInsertSqlParams.push(documentObj.taxReturnId);
        }
        return db.knex.raw(documentInsertSql, documentInsertSqlParams).then(function(documentInsertSqlResults) {
            var documentId = documentInsertSqlResults[0].insertId;
            return Promise.resolve(documentId);
        });
    },

    update: function(id, documentObj) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No documentId specified!'));
        }

        return db.knex('documents').update(documentObj).where('id', id);
    },

    deleteById: function(quoteId, documentId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }
        if ((!documentId) || (documentId.length === 0)) {
            return Promise.reject(new Error('No documentId specified!'));
        }

        var quoteSql = 'DELETE FROM documents WHERE id = ? AND quote_id = ?';
        return db.knex.raw(quoteSql, [documentId, quoteId]);
    },

    setDocumentAsViewedById: function(quoteId, documentId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject(new Error('No quoteId specified!'));
        }

        if ((!documentId) || (documentId.length === 0)) {
            return Promise.reject(new Error('No documentId specified!'));
        }

        var quoteSql = 'UPDATE documents SET viewed_by_taxpro=IF(viewed_by_taxpro=1, 0, 1) WHERE id = ? AND quote_id = ?';
        return db.knex.raw(quoteSql, [documentId, quoteId]);
    }

};

module.exports = document;
