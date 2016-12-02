var config = require('../config/config.js');
var Promise = require('bluebird');
var logger = require('../services/logger.service');
var db = require('../services/db');
var _ = require('lodash');



var Checklist = {
    findById: function(id) {
        if ((!id) || (id.length === 0)) {
            return Promise.reject(new Error('No id specified!'));
        }

        var quoteSql = 'SELECT * FROM checklist_items WHERE id = ?';
        return db.knex.raw(quoteSql, [id]).then(function(quoteSqlResults) {
            return(quoteSqlResults[0][0]);
        });
    },

    getCheckListForQuoteId: function(quoteId) {
        if ((!quoteId) || (quoteId.length === 0)) {
            return Promise.reject('No quoteId specified!');
        }

        var checklistSQL = 'SELECT cr.checklist_item_id, ci.name FROM answers AS a \
                            JOIN checklist_rules AS cr \
                                 ON a.question_id = cr.question_id \
                                 AND a.text = cr.value \
                            JOIN checklist_items AS ci \
                                 ON ci.id = cr.checklist_item_id \
                            WHERE a.tax_return_id IN( \
                                 SELECT tax_return_id FROM quotes_tax_returns \
                                 WHERE quote_id = ?);';
        return db.knex.raw(checklistSQL, [quoteId]).then(function(checklistSQLResults) {
            var resultObj = {};
            if (checklistSQLResults[0][0]) { // allow for undefined
                resultObj.checklist = checklistSQLResults[0][0];
            } else {
                resultObj.checklist = [];
            }

            var documentsSQL = 'SELECT * FROM documents AS d \
                                WHERE d.quote_id = ?;';
            return db.knex.raw(documentsSQL, [quoteId]).then(function(documentsSQLResults) {
                var dbDocs = documentsSQLResults[0];
                var documents = [];
                var docObj = {};
                _.forEach(dbDocs, function(dbDoc) {
                    docObj = {};
                    docObj.documentId = dbDoc.id;
                    docObj.quoteId = dbDoc.quote_id;
                    docObj.taxReturnId = dbDoc.tax_return_id;
                    docObj.checkListItemId = dbDoc.checklist_item_id;
                    docObj.name = dbDoc.name;
                    docObj.url = config.thumbnail.baseUploadUrl + dbDoc.url;
                    docObj.thumbnailUrl = config.thumbnail.baseThumbnailUrl + dbDoc.thumbnail_url;
                    documents.push(docObj);
                });
                resultObj.documents = documents;
                return(resultObj);
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
    }
};

module.exports = Checklist;