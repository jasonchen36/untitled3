/*jslint node: true */

'use strict';

var db = require('../services/db');

var Document = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var documentSql = 'SELECT * FROM documents WHERE id = ?';
        return db.knex.raw(documentSql, [id]).then(function(documentSqlResults) {
            return(documentSqlResults[0][0]);
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
            return documentInsertSqlResults[0].insertId;
        });
    }
};

module.exports = Document;