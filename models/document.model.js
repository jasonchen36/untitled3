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
        if ((!documentObj.name) || (documentObj.name.length === 0)) {
            return Promise.reject(new Error('No name specified!'));
        }
        if ((!documentObj.url) || (documentObj.url.length === 0)) {
            return Promise.reject(new Error('No url specified!'));
        }
        if ((!documentObj.thumbnailUrl) || (documentObj.thumbnailUrl.length === 0)) {
            return Promise.reject(new Error('No thumbnailUrl specified!'));
        }
        var documentInsertSql = 'INSERT INTO documents (name, url, thumbnail_url) VALUES(?, ?, ?)';
        var documentInsertSqlParams = [
            documentObj.name,
            documentObj.url,
            documentObj.thumbnailUrl
        ];
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
    }
};

module.exports = document;
