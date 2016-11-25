/*jslint node: true */

'use strict';

var db = require('../services/db');

var TaxReturnDocument = {
    findByTaxReturnId: function(id) {
        if ((!taxReturnId) || (taxReturnId.length === 0)) {
            return Promise.reject(new Error('No TaxReturnId specified!'));
        }

        var taxReturnDocumentSql = 'SELECT * FROM tax_returns_documents WHERE tax_return_id = ?';
        return db.knex.raw(taxReturnDocumentSql, [id]).then(function(taxReturnDocumentSqlResults) {
            return(taxReturnDocumentSqlResults[0][0]);
        });
    },

    create: function(taxReturnDocumentObj) {
        if ((!taxReturnDocumentObj.tax_return_id) || (taxReturnDocumentObj.tax_return_id.length === 0)) {
            return Promise.reject(new Error('No tax_return_id specified!'));
        }
        if ((!taxReturnDocumentObj.document_id) || (taxReturnDocumentObj.document_id.length === 0)) {
            return Promise.reject(new Error('No document_id specified!'));
        }
        var taxReturnDocumentInsertSql = 'INSERT INTO tax_returns_documents (tax_return_id, document_id) VALUES(?, ?)';
        var taxReturnDocumentParams = [
            taxReturnDocumentObj.tax_return_id,
            taxReturnDocumentObj.document_id
        ];
        return db.knex.raw(taxReturnDocumentInsertSql, taxReturnDocumentParams).then(function(taxReturnDocumentInsertSqlResults) {
            return taxReturnDocumentInsertSqlResults[0].insertId;
        });
    }
};

module.exports = TaxReturnDocument;